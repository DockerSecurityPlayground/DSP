
var DSP_MonitorCtrl  = function($scope, $routeParams, $location, Notification, SafeApply, SocketService, incrementNumber, dockerAPIService, dockerImagesService) {
  console.log("On Monitor Ctrl");
  var currentLab = $routeParams.namelab;
  var currentRepo = $routeParams.repo;

  
  
  $scope.hostPort = 14500;
  const host = $location.host();
  const protocol = "https";
  $scope.captureName = "";
  $scope.captureLogs = "";
  $scope.isWiresharkRun = false;
  $scope.isWiresharkInProgress = false;
  $scope.wiresharkLogs = "";
  $scope.labMachines = [];
  $scope.isTcpdumpCapturing = false;
  $scope.machinesToBeSniffed = {};

  $scope.wiresharkUrl = protocol + "://" + host + ":" + $scope.hostPort + "/?username=wireshark&password=wireshark&sharing=true";

  // Load lab information
  dockerAPIService.loadGeneralLab(currentRepo, currentLab, 0, function (data) {
    $scope.labMachines = data.clistToDraw.map(function (m) { return m.name});
    $scope.labMachines.forEach(function (m) {
      $scope.machinesToBeSniffed[m] = false;
    })
  });

 // Check if wireshark is run 
  dockerAPIService.isWiresharkRun()
  .then(function successCb(data) {
    $scope.isWiresharkRun = data.data.data.isRun;
  }, function errorCallback(error) {
    Notification("Error in check wireshark status", 'error')
  });
  // Check if tcpdump is run
  dockerAPIService.isTcpdumpRun()
  .then(function successCb(data) {
    $scope.isTcpdumpCapturing = data.data.data.isRun;
  }, function errorCallback(error) {
    Notification("Error in check tcpdump status", 'error')
  });

  $scope.startWireshark = function() {
    console.log("Start wireshark")
    $scope.isWiresharkInProgress = true;
    SocketService.manage(JSON.stringify({
      action: 'wireshark_run',
      body: {
        hostPort: $scope.hostPort
      }
    }), function(event) {
      const data = JSON.parse(event.data)
      switch (data.status) {
        case 'success':
          Notification("Wireshark Started");
          $scope.isWiresharkRun = true;
          $scope.isWiresharkInProgress = false;
          $scope.wiresharkLogs = "";
          break;
        case 'error':
          Notification("Wirshark start error: "+ event.data, 'error');
          break;
        // Notification
        default:
        $scope.wiresharkLogs += data.message;
        break;
      }
    });
}

$scope.startCapture = function() {
  console.log("TCPDUMP Start Capture");
  SocketService.manage(JSON.stringify({
    action: 'capture_run',
    body: {
      machinesToBeSniffed: $scope.machinesToBeSniffed,
      lab: currentLab,
      sessionName: $scope.captureName
    }
  }), function(event) {
    const data = JSON.parse(event.data)
    switch (data.status) {
      case 'success':
        Notification("Capture Started");
        $scope.isTcpdumpCapturing = true;
        break;
      case 'error':
        Notification("TCPDUMP Capture Error: "+ event.data, 'error');
        break;
      // Notification
      default:
      $scope.captureLogs += data.message;
      break;
    }
  });
  
}

$scope.clearCaptureLogs = function() {
  $scope.captureLogs = "";
}

$scope.clearWiresharkLogs = function() {
  $scope.wiresharkLogs = "";
}
  $scope.stopWireshark = function() {
    console.log("Stop wireshark")
    dockerAPIService.stopWireshark()
    .then(function successCb() {
        $scope.isWiresharkRun = false;
        Notification("Wireshark Stopped");
    }, function errorCb() {
       Notification("Some error in wireshark stop command", 'error');
    });
  }
  $scope.stopCapture = function() {
    console.log("Stop capture")
    dockerAPIService.stopCapture()
    .then(function successCb() {
        $scope.isTcpdumpCapturing = false;
        Notification("Capture Stopped");
    }, function errorCb() {
       Notification("Some error in Capture stop command", 'error');
    });
  }
}
