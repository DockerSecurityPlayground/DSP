const server = require('socket.io');
const pty = require('node-pty');
const path = require('path');
const AppUtils = require('../util/AppUtils');
const log = AppUtils.getLogger();


let dockerShell;
exports.setDockerShell = function setDockerShell(dockerInfos) {
  dockerShell = dockerInfos
}

exports.init = function init(httpserv) {
  const io = server(httpserv,{path: '/webshell/socket.io'});
  io.on('connection', function(socket){

      var request = socket.request;

      log.info((new Date()) + ' Connection accepted.');
      log.info(dockerShell);
      if (dockerShell && dockerShell.mainPath && dockerShell.nameRepo && dockerShell.labName && dockerShell.dockerName) {
        // Initiate session
        var term;
        // var entrypoint = { script:"docker-compose", args: ['-f', '/root/dsp/giper/pppp/docker-compose.yml', 'exec', 'prova', '/bin/bash'] };
        // DockerCompose operation
        if (dockerShell.dockercompose === "true") {
          const dockerPath = path.join(dockerShell.mainPath, dockerShell.nameRepo, dockerShell.labName, 'docker-compose.yml');
          var entrypoint = { script:"docker-compose", args: ['-f', dockerPath, 'exec', dockerShell.dockerName, '/bin/bash'] };
        }
        // Container operation
        else {
          var entrypoint = { script:"docker", args: ['exec', '-i', '-t', dockerShell.dockerName, '/bin/bash'] };
        }

        term = pty.spawn(entrypoint.script, entrypoint.args, {
            name: 'xterm-256color',
            cols: 80,
            rows: 30
        });

        // Loop
        term.on('data', function(data) {
            socket.emit('output', data);
        });
        term.on('exit', function(code) {
            log.info((new Date()) + " PID=" + term.pid + " ENDED");
          //docker_graph_action.html?nameRepo=giper&namelab=pppp&reponame=giper
            socket.emit('exit', `docker_graph_action.html?reponame=${dockerShell.nameRepo}&namelab=${dockerShell.labName}`)
        });
        socket.on('resize', function(data) {
            term.resize(data.col, data.row);
        });
        socket.on('input', (data) => {
            term.write(data);
        });
        socket.on('disconnect', function() {
            term.end();
        });
      }
    else {
        socket.emit('exit', '/logout');
    }
  })
}
