const server = require('socket.io');
const pty = require('pty.js');

exports.init = function init(httpserv) {
  const io = server(httpserv,{path: '/webshell/socket.io'});
  io.on('connection', function(socket){
      var request = socket.request;
      console.log((new Date()) + ' Connection accepted.');

      // Initiate session
      var term;
      var entrypoint = { script:'/bin/bash' } ;
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
          socket.emit('exit', '/logout');
      });
      socket.on('resize', function(data) {
          term.resize(data.col, data.row);
      });
      socket.on('input', function(data) {
          term.write(data);
      });
      socket.on('disconnect', function() {
          term.end();
      });
  })
}
