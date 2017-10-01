function SocketService($websocket) {
  var socket;
    this.manage = function manage(jsonToSend, handlerMessage) {
       var dataStream = $websocket('ws://localhost:8080');
        dataStream.send(jsonToSend);
        dataStream.onMessage(handlerMessage);
    };
 // this.manage = function manage(jsonToSend, handlerMessage) {
 //     if (socket) socket.close();
 //     socket = new WebSocket('ws://localhost:8080');
 //     //	var url = '/dsp_v1/docker_compose/'+$scope.nameRepo+"/"+$scope.labName
 //     socket.onopen = function() {
 //       //Send compose up 
 //       socket.send(jsonToSend);
 //       console.log(socket);
 //     }
 //     socket.onmessage  = handlerMessage;
 // };
  this.close = function close() {
//    socket.close();
  }
}
