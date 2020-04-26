const server = require('socket.io');
const pty = require('node-pty');
const path = require('path');
const AppUtils = require('../util/AppUtils');
const dockerJS = require('mydockerjs').docker;
const log = AppUtils.getLogger();


let dockerShell;
exports.setDockerShell = function setDockerShell(dockerInfos) {
  dockerShell = dockerInfos
}

exports.init = function init(httpserv) {
  let shellCommand = "/bin/sh";
  const io = server(httpserv,{path: '/webshell/socket.io'});
  io.on('connection', function(socket){

      var request = socket.request;

      log.info((new Date()) + ' Connection accepted.');
      log.info(dockerShell);
      if (dockerShell && dockerShell.mainPath && dockerShell.nameRepo && dockerShell.labName && dockerShell.dockerName) {
        // Initiate session
        var term;
        // DockerCompose operation
        if (dockerShell.dockercompose === "true") {
          const dockerPath = path.join(dockerShell.mainPath, dockerShell.nameRepo, dockerShell.labName, 'docker-compose.yml');
          var entrypoint = { script:"docker-compose", args: ['-f', dockerPath, 'exec', dockerShell.dockerName, shellCommand] };
        }
        // Container operation
        else {
          const containerName = dockerShell.dockerName;
          dockerJS.exec(containerName, "/bin/ls /bin", (err, output) => {
            const binCommands = output.split("\n");

            shellCommand = binCommands.includes("bash") ? "/bin/bash" : "/bin/sh";
            var entrypoint = { script:"docker", args: ['exec', '-i', '-t', dockerShell.dockerName, shellCommand] };
            
            
              if(err) {
                log.error(`Error: ${err}`);
              } else {
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
          })
        }
      }
    else {
        socket.emit('exit', '/logout');
    }
  })
}
