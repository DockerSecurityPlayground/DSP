const server = require('socket.io');
const { execFile } = require('child_process');
const path = require('path');
const Docker = require('dockerode');
const AppUtils = require('../util/AppUtils');
const dockerJS = require('../lib/mydockerjs').docker;
const dockerComposer = require('../lib/mydockerjs').dockerComposer;
const { execSync } = require('child_process');
const log = AppUtils.getLogger();
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

function dockerComposeV2Installed() {
  try {
    execSync('docker compose version');
    return true;
  } 
  catch (error) {
    return false;
  }
}

let dockerShell;
exports.setDockerShell = function setDockerShell(dockerInfos) {
  dockerShell = dockerInfos
}

function initShellCommand(callback, dockerPath = "") {
  let shellCommand = "/bin/sh";
  const containerName = dockerShell.dockerName;
  if (dockerShell.dockercompose === "true") {
    dockerComposer.exec(dockerPath, containerName, "/bin/ls -1 /bin", (err, output) => {
      if (err) {
        // Fallback to /bin/sh to keep websocket shell usable even if probe fails.
        callback(null, shellCommand);
        return;
      }

      if (output) {
        const binCommands = output.split("\n");
        shellCommand = binCommands.includes("bash") || binCommands.includes("bash\r") ? "/bin/bash" : "/bin/sh";
      }

      callback(null, shellCommand);
    });
  } else {
    dockerJS.exec(containerName, "/bin/ls -1 /bin", (err, output) => {
      if (err) {
        callback(null, shellCommand);
        return;
      }

      if (output) {
        const binCommands = output.split("\n");
        shellCommand = binCommands.includes("bash") || binCommands.includes("bash\r") ? "/bin/bash" : "/bin/sh";
      }

      callback(null, shellCommand);
    });
  }
}
function resolveContainerId(composePath, serviceName, callback) {
  if (dockerShell.dockercompose !== 'true') {
    callback(null, dockerShell.dockerName);
    return;
  }

  const cmd = dockerComposeV2Installed() ? 'docker' : 'docker-compose';
  const args = dockerComposeV2Installed()
    ? ['compose', '-f', path.join(composePath, 'docker-compose.yml'), 'ps', '-q', serviceName]
    : ['-f', path.join(composePath, 'docker-compose.yml'), 'ps', '-q', serviceName];

  execFile(cmd, args, (err, stdout, stderr) => {
    if (err) {
      callback(new Error(stderr || err.message));
      return;
    }
    const containerId = (stdout || '').trim();
    if (!containerId) {
      callback(new Error(`Container ID not found for service '${serviceName}'`));
      return;
    }
    callback(null, containerId);
  });
}

function execTerm(socket, containerRef, shellCommand) {
  const cmd = [shellCommand, '-i'];
  log.info(`[WEBSOCKET SHELL] docker exec on ${containerRef}: ${cmd.join(' ')}`);

  const container = docker.getContainer(containerRef);
  container.exec({
    AttachStdin: true,
    AttachStdout: true,
    AttachStderr: true,
    Tty: true,
    Cmd: cmd,
    Env: ['TERM=xterm-256color']
  }, (err, execInstance) => {
    if (err) {
      log.error(`[WEBSOCKET SHELL] create exec error: ${err.message}`);
      socket.emit('output', `\r\nError: ${err.message}\r\n`);
      socket.emit('exit', `lab/use/${dockerShell.nameRepo}/${dockerShell.labName}`);
      return;
    }

    execInstance.start({ hijack: true, stdin: true, Tty: true }, (startErr, stream) => {
      if (startErr) {
        log.error(`[WEBSOCKET SHELL] start exec error: ${startErr.message}`);
        socket.emit('output', `\r\nError: ${startErr.message}\r\n`);
        socket.emit('exit', `lab/use/${dockerShell.nameRepo}/${dockerShell.labName}`);
        return;
      }

      stream.on('data', (data) => {
        socket.emit('output', data.toString('utf8'));
      });

      stream.on('error', (streamErr) => {
        log.error(`[WEBSOCKET SHELL] stream error: ${streamErr.message}`);
      });

      stream.on('end', () => {
        socket.emit('exit', `lab/use/${dockerShell.nameRepo}/${dockerShell.labName}`);
      });

      socket.on('input', (data) => {
        if (stream.writable) {
          stream.write(data);
        }
      });

      socket.on('resize', (data) => {
        if (data && data.row && data.col) {
          execInstance.resize({ h: data.row, w: data.col }, () => {});
        }
      });

      socket.on('disconnect', () => {
        try {
          stream.end();
        } catch (e) {
          log.debug(`[WEBSOCKET SHELL] disconnect cleanup: ${e.message}`);
        }
      });
    });
  });
}

exports.init = function init(httpserv) {
  let shellCommand = "/bin/sh";
  const io = server(httpserv,{path: '/webshell/socket.io'});
  io.on('connection', function(socket){

      var request = socket.request;

      log.info((new Date()) + ' Connection accepted.');
      log.info(dockerShell);
      if (dockerShell && dockerShell.mainPath && dockerShell.nameRepo && dockerShell.labName && dockerShell.dockerName) {

        // DockerCompose operation
        if (dockerShell.dockercompose === "true") {
          const composePath = path.join(dockerShell.mainPath, dockerShell.nameRepo, dockerShell.labName);
          initShellCommand((err, shellCommand) => {
              if(err) {
                log.error(`Error: ${err}`);
              } else {
                resolveContainerId(composePath, dockerShell.dockerName, (resolveErr, containerId) => {
                  if (resolveErr) {
                    log.error(`[WEBSOCKET SHELL] resolve container error: ${resolveErr.message}`);
                    socket.emit('output', `\r\nError: ${resolveErr.message}\r\n`);
                    socket.emit('exit', `lab/use/${dockerShell.nameRepo}/${dockerShell.labName}`);
                    return;
                  }
                  execTerm(socket, containerId, shellCommand);
                });
              }
          }, composePath);
        }
        // Container operation
        else {
          initShellCommand((err, shellCommand) => {
              if(err) {
                log.error(`Error: ${err}`);
              } else {
                execTerm(socket, dockerShell.dockerName, shellCommand);
              }
          });
        }
      }
    else {
        socket.emit('exit', '/logout');
    }
  })
}
