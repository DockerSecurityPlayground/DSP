const server = require('socket.io');
const pty = require('pty.js');
const path = require('path');


let dockerShell;
exports.setDockerShell = function setDockerShell(dockerInfos) {
  dockerShell = dockerInfos
}

exports.init = function init(httpserv) {
  const io = server(httpserv,{path: '/webshell/socket.io'});
  io.on('connection', function(socket){
      
      var request = socket.request;
      
      console.log((new Date()) + ' Connection accepted.');
      console.log(dockerShell); 
      if (dockerShell && dockerShell.mainPath && dockerShell.nameRepo && dockerShell.labName && dockerShell.dockerName) {
        // Initiate session
        var term;
        // var entrypoint = { script:"docker-compose", args: ['-f', '/root/dsp/giper/pppp/docker-compose.yml', 'exec', 'prova', '/bin/bash'] };
        const dockerPath = path.join(dockerShell.mainPath, dockerShell.nameRepo, dockerShell.labName, 'docker-compose.yml');
        var entrypoint = { script:"docker-compose", args: ['-f', dockerPath, 'exec', dockerShell.dockerName, '/bin/bash'] };
    
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
            console.log((new Date()) + " PID=" + term.pid + " ENDED");
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
            console.log('term end');
            term.end();
        });
      }
    else { 
        console.log("No dockerShell variable setted");
        socket.emit('exit', '/logout');
    }
  })
}
