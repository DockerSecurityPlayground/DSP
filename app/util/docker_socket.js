const server = require('socket.io');
const pty = require('node-pty');
const path = require('path');
const AppUtils = require('../util/AppUtils');
const dockerJS = require('../lib/mydockerjs').docker;
const dockerComposer = require('../lib/mydockerjs').dockerComposer;
const { execSync } = require('child_process');
const log = AppUtils.getLogger();

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
function execTerm(socket, entrypoint) {
  // Initiate session
  var term;

  log.info(`[WEBSOCKET SHELL] spawning: ${entrypoint.script} ${entrypoint.args.join(' ')}`);
  term = pty.spawn(entrypoint.script, entrypoint.args, {
      name: 'xterm-256color',
      cols: (dockerShell.size && dockerShell.size.width) ? dockerShell.size.width : 80,
      rows: (dockerShell.size && dockerShell.size.height) ? dockerShell.size.height : 30
  });

  // Loop
  term.on('data', function(data) {
      socket.emit('output', data);
  });
  term.on('exit', function(code) {
      log.info((new Date()) + " PID=" + term.pid + " ENDED");
    //docker_graph_action.html?nameRepo=giper&namelab=pppp&reponame=giper
socket.emit('exit', `lab/use/${dockerShell.nameRepo}/${dockerShell.labName}`)
  });
  term.on('error', (err) => {
    log.error(`[WEBSOCKET SHELL] terminal error: ${err.message}`);
    socket.emit('output', `\r\n[terminal-error] ${err.message}\r\n`);
  });
  socket.on('resize', function(data) {
    try {
      if (data.col && data.row)
        term.resize(data.col, data.row);
    } catch(e) {
      log.warn(`log exception: ${1}`, e.message)
    }
  });
  socket.on('input', (data) => {
      term.write(data);
  });
  socket.on('disconnect', function() {
    term.end();
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
          const dockerPath = path.join(composePath, 'docker-compose.yml');
          initShellCommand((err, shellCommand) => {
              if(err) {
                log.error(`Error: ${err}`);
              } else {
                var entrypoint;
                if (dockerComposeV2Installed()) {
                  // Use Docker Compose v2 (docker compose)
                  entrypoint = { script:"docker", args: ['compose', '-f', dockerPath, 'exec', dockerShell.dockerName, shellCommand] };
                } else {
                  // Use Docker Compose v1 (docker-compose)
                  entrypoint = { script:"docker-compose", args: ['-f', dockerPath, 'exec', dockerShell.dockerName, shellCommand] };
                }
                execTerm(socket, entrypoint);
              }
          }, composePath);
        }
        // Container operation
        else {
          initShellCommand((err, shellCommand) => {
              if(err) {
                log.error(`Error: ${err}`);
              } else {
                var entrypoint = { script:"docker", args: ['exec', '-i', '-t', dockerShell.dockerName, shellCommand] };
                execTerm(socket, entrypoint);
              }
          });
        }
      }
    else {
        socket.emit('exit', '/logout');
    }
  })
}
