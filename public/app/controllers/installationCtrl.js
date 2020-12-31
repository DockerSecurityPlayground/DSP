var dsp_InstallationCtrl = function(ServerResponse, SocketService, SafeApply, RegexService, $http, $scope, $window,Notification) {
  $scope.installView =  {
          showButton : true,
          showLoading : false

  };

  $scope.config={
          mainDir : 'dsp',
          name : '',
          githubURL: "",
    dockerRepo: 'dockersecplayground'
  };
  $scope.repo = {
    isPrivate : false,
    username : '',
    token : '',
  };

  $scope.notify = ' Installation and download DSP Projects... Pls wait ';
  $scope.nameRegex = RegexService.nameRegex
  $scope.install = function() {
  SocketService.manage(
    JSON.stringify({
            action:'installation',
            config: $scope.config,
            repo: $scope.repo,
          }),
    function(event) {
          var data = JSON.parse(event.data);
          if(data.status === 'success') {
            Notification("DSP installed! Now you'll be redirected", 'success');
            $scope.installView.showButton = false;
            $scope.installView.showLoading = false;
            //OK REDIRECT USER TO INDEX
              setTimeout(function() {
                // Close socket
                SocketService.close();
                $window.location.href = '/index.html'
              }, 3000);
          }
          else if(data.status === 'error') {
            $scope.installView.showButton = true;
            $scope.installView.showLoading = false;
            console.log(data.message);
            Notification('Server error:'+ data.message, 'error');
          } else if(data.status === 'progress') {
              SafeApply.exec($scope, function() {
                //$scope.notify+= data.message+"<br>";
                $scope.notify = data.message;
              });
          }
        }
    );
  //  var socket = new WebSocket('ws://localhost:8080');
  //  socket.onopen = function() {
  //    socket.send(JSON.stringify({
  //      action:'installation',
  //      config: $scope.config
  //    }));
  //  }

    //socket.onmessage = function(event) {
    //  var data = JSON.parse(event.data);
    //  if(data.status === 'success') {
    //    Notification("DSP installed! Now you'll be redirected", 'success');
    //    $scope.installView.showButton = false;
    //    $scope.installView.showLoading = false;
    //    //OK REDIRECT USER TO INDEX
    //      setTimeout(function() {
    //        // Close socket
    //        socket.close();
    //        $window.location.href = '/index.html'
    //      }, 3000);
    //  }

    //  else if(data.status === 'error') {
    //                  $scope.installView.showButton = true;
    //                  $scope.installView.showLoading = false;
    //                  console.log(data.message);
    //                  Notification('Server error:'+ data.message, 'error');
    //  } else if(data.status === 'progress') {
    //      SafeApply.exec($scope, function() {
    //                  $scope.notify+= data.message+"<br>";
    //      });
    //  }



    //}
            $scope.installView.showButton = false;
            $scope.installView.showLoading = true;
	};

  $scope.isPrivateCheckbox = false;

  $scope.checkRepoPrivate = function (){
    $scope.isPrivateCheckbox =  !$scope.isPrivateCheckbox;
  };

}
