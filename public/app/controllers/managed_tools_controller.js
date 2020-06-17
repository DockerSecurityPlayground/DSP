var DSP_ManagedToolsCtrl  = function($scope, $location, Notification, SafeApply, SocketService, incrementNumber, dockerAPIService, dockerImagesService) {
  function sleep (time) {
      return new Promise((resolve) => setTimeout(resolve, time));
  }
  $scope.kaliService = dockerAPIService.kaliService;
  $scope.httpdService = dockerAPIService.httpdService;
  $scope.browserService = dockerAPIService.browserService;
  $scope.httpdPort = 8081;
  $scope.browserPort = 5800;
  $scope.managedServicesLogs = "";


  const host = $location.host();
  const httpdProtocol = "http";
  $scope.httpdUrl = httpdProtocol + "://" + host + ":" + $scope.httpdPort;
  $scope.browserUrl = httpdProtocol + "://" + host + ":" + $scope.browserPort;

  $scope.clearManagedLogs = function () {
    $scope.managedServicesLogs = "";
  }
  console.log("=== Managed Controller ===");
  
  dockerAPIService.updateManagedServices();
  // Kali set state
// $scope.setOneLineNetwork = function setOneLineNetwork(networkName){
//  $scope.currentContainer.OneLineNetwork = networkName;
// }


  $scope.startKali = function startKali() {
    console.log("Start kali")
    SocketService.manage(JSON.stringify({
      action: 'kali_run',
      body: {
      }
    }), function(event) {
      const data = JSON.parse(event.data)
      switch (data.status) {
        case 'success':
          Notification("Kali Started");
          $scope.kaliService.isRun = true;
          $scope.managedServicesLogs = "";
          dockerAPIService.initServices(() => {});
          break;
        case 'error':
          Notification("Kali start error: "+ event.data, 'error');
          break;
        // Notification
        default:
        $scope.managedServicesLogs += data.message;
        break;
      }
    });
  }
  $scope.stopKali = function stopKali() {
    console.log("Stop Kali service");
    dockerAPIService.stopKali()
    .then(function successCallback(response) {
      $scope.kaliService.isRun = false;
      dockerAPIService.initServices(() => {});
      Notification("Service kali stopped")
    }, function errorCallback(error) {
      Notification(error.data.message, 'error');
    });
  }

  $scope.startBrowser = function startBrowser() {
    console.log("Start browser")
    SocketService.manage(JSON.stringify({
      action: 'browser_run',
      body: {
        hostPort: $scope.browserPort
      }
    }), function(event) {
      const data = JSON.parse(event.data)
      switch (data.status) {
        case 'success':
          Notification("Browser Started");
          $scope.browserService.isRun = true;
          $scope.managedServicesLogs = "";
          dockerAPIService.initServices(() => {});
          break;
        case 'error':
          Notification("Browser start error: "+ event.data, 'error');
          break;
        // Notification
        default:
        $scope.managedServicesLogs += data.message;
        break;
      }
    });
  }
  $scope.stopBrowser = function stopBrowser() {
    console.log("Stop Browser service");
    dockerAPIService.stopBrowser()
    .then(function successCallback(response) {
      $scope.browserService.isRun = false;
      dockerAPIService.initServices(() => {});
      Notification("Service browser stopped")
    }, function errorCallback(error) {
      Notification(error.data.message, 'error');
    });
  }

  $scope.startHttpd = function startHttpd() {
    console.log("Start httpd")
    SocketService.manage(JSON.stringify({
      action: 'httpd_run',
      body: {
        hostPort: $scope.httpdPort
      }
    }), function(event) {
      const data = JSON.parse(event.data)
      switch (data.status) {
        case 'success':
          Notification("Httpd Started");
          $scope.httpdService.isRun = true;
          $scope.managedServicesLogs = "";
          dockerAPIService.initServices(() => {});
          break;
        case 'error':
          Notification("Httpd start error: "+ event.data, 'error');
          break;
        // Notification
        default:
        $scope.managedServicesLogs += data.message;
        break;
      }
    });
  }

  $scope.stopHttpd = function stopHttpd() {
    console.log("Stop Httpd service");
    dockerAPIService.stopHackTool("httpd")
    .then(function successCallback(response) {
      $scope.httpdService.isRun = false;
      dockerAPIService.initServices(() => {});
      Notification("Service httpd stopped")
    }, function errorCallback(error) {
      Notification(error.data.message, 'error');
    });

  }

  $scope.startService = function startService(containerName) {
    console.log("START SERVICE");
    dockerAPIService.startService(containerName)
    .then(function successCallback(response) {
      Notification("Service Started!");
      // Show Start button
      startedContainer = _.findWhere($scope.listServices, {
        name: containerName
      });
      startedContainer.showRun = false;
      startedContainer.state = successStatus;

    }, function errorCallback(error) {
      console.log(error);
      Notification(error.data.message, 'error');
    });
  }
}
