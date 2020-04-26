var DSP_DockerToolsCtrl  = function($scope, $location, Notification, SafeApply, SocketService, incrementNumber, dockerAPIService, dockerImagesService) {
  function sleep (time) {
      return new Promise((resolve) => setTimeout(resolve, time));
  }
  const host = $location.host();
  const httpdProtocol = "http";
  $scope.httpdUrl = httpdProtocol + "://" + host + ":" + $scope.httpdPort;

  $scope.clearManagedLogs = function () {
    $scope.managedServicesLogs = "";
  }

  // // Kali set state
  // dockerAPIService.isRun("kali")
  // .then(function successCb(data) {
  //   $scope.isKaliRun = data.data.data.isRun;
  // }, function errorCb() {
  //   Notification("Error in check kali status", 'error');
  // })

  // // Httpd set state
  // dockerAPIService.isRun("httpd")
  // .then(function successCb(data) {
    
  //   $scope.isHttpdRun = data.data.data.isRun;
  // }, function errorCb() {
  //   Notification("Error in check httpd status", 'error');
  // })

  $scope.init = function init() {
    console.log("=== INIT DOCKER TOOLS CONTROLLER ===");
    $scope.listServices = [];
    $scope.activeTab = "";
    $scope.showPorts = false;
    $scope.showEnv = false;
    $scope.showTools = true;
    $scope.hackToolMode = {
      val : "oneline"
    }
    $scope.hackLabel = "Command:"
    $scope.optPort = { container: 0, host: 0};
    $scope.optionalPorts = [];
    $scope.runningHackTools = [];
    $scope.terminals = [];
    $scope.currentEnvironment = {name: '', value: ''};
    $scope.currentContainer = {};
    $scope.hackToolNotify = "";


    // dockerImagesService.get(function(images) {
    //   $scope.imageList = images
    // });
    $scope.t = {
      name: 'red'
    };

    var initTab = "cname";
    $scope.selectedItem = initTab;
    $scope.checked = ['true','','',''];
    $scope.changeTab = function(tab,selected){
        console.log($scope.currentContainer.selectedImage)
      for(i = 0; i<$scope.checked.length; i++)
        $scope.checked[i] = 0;
      $scope.checked[tab] = 'true';
      $scope.selectedItem = selected;
    }
    dockerAPIService.setServices($scope.listServices);
    initCurrentContainer();
    dockerAPIService.initServices(function(services) {
      if(services.length > 0) {
        $scope.showTools = true;
      }
    });
  }



// $scope.setOneLineNetwork = function setOneLineNetwork(networkName){
//  $scope.currentContainer.OneLineNetwork = networkName;
// }


  $scope.setNetwork = function() {
  }

  $scope.updateImages = function() {
    dockerImagesService.get(function(images) {
      $scope.imageList = images;
    }, true);
  }

  $scope.changeMode = function() {
  }

  function initCurrentContainer() {
    $scope.currentContainer.name = "newService"
    $scope.currentContainer.isInteractive = true;
    $scope.currentContainer.isOneLine = false;
    $scope.currentContainer.isDaemonized = true;
    // $scope.currentContainer.command = "/bin/bash"
    $scope.currentContainer.command = '/bin/sh -c "[ -e /bin/bash ] && /bin/bash || /bin/sh"';
    $scope.currentContainer.environments = [];
    // $scope.currentContainer.environments = [{
    //     name: 'ip',
    //     value: 'rp'
    // }];
    $scope.currentContainer.ports = {};

    $scope.optionalPorts = [];
    $scope.optPort = { container: 0, host: 0};
}


$scope.addEnvironment = function addEnvironment() {
  $scope.showEnv = true;
  console.log("ADD ENV");
  if ($scope.currentEnvironment.name && $scope.currentEnvironment.value) {
  $scope.currentContainer.environments.push({
        name: $scope.currentEnvironment.name,
        value: $scope.currentEnvironment.value
    });
  } else {
    Notification({message:"Pls fill name and value"}, 'error');
  }
  // $scope.currentEnvironment = {name: '', value: '' };
}


$scope.deleteEnvironment = function deleteEnvironment(nameEnv) {
      // var nn = _.without(c.networks, _.findWhere(c.networks, {
  $scope.currentContainer.environments = _.without($scope.currentContainer.environments, _.findWhere($scope.currentContainer.environments,
    {
      name: nameEnv
    }
  ));
  if($scope.currentContainer.environments.length == 0)
    $scope.showEnv = false;
}

$scope.containerHasNetwork = function containerHasNetwork(c, n) {
  var ret = false;
  _.each(c.networks, function(containerNetwork) {
    if (containerNetwork.name == n.name) {
      ret = true;
    }
  });
  return ret;
}
$scope.attachNetwork = function attachNetwork(c, n) {
  console.log("ATTACH NETWORK");
  dockerAPIService.attachNetwork(c.name, n.name)
    .then(function successCallback(response) {
      Notification("Network Attached!");
      c.networks.push({
        name : n.name
      });
      // Set as default network
      dockerAPIService.serviceDefaultNetwork(c.name, n.name)
      .then(function successCallback(response) {
        Notification("Default Network Set");
      },
        function errorCallback(error) {
        Notification(error.data.message, 'error');
      });
    }, function errorCallback(error) {
      Notification(error.data.message, 'error');
    });
}

$scope.detachNetwork = function detachNetwork(c, n) {
  console.log("DETACH NETWORK");
  dockerAPIService.detachNetwork(c.name, n.name)
    .then(function successCallback(response) {
      Notification("Network Detached!");
      var nn = _.without(c.networks, _.findWhere(c.networks, {
        name: n.name
      }));
      c.networks = nn;
      var radioElement = document.getElementById(n.name);
      radioElement.checked = false;

    }, function errorCallback(error) {
      Notification(error.data.message, 'error');
    });

}

  $scope.runService = function runService() {
    console.log($scope.currentContainer.selectedImage);
    $scope.showTools = true;
    console.log("RUN SERVICE");
    console.log($scope.currentContainer);
    dockerAPIService.runService($scope.currentContainer)
    .then(function successCallback(response) {
      initCurrentContainer();
      dockerAPIService.initServices();

    }, function errorCallback(error) {
      console.log(error);
      Notification(error.data.message, 'error');
    })
  }
 $scope.runServiceOneLine = function runServiceOneLine() {
   $scope.hackToolNotify = "";
   // $scope.showTerminal = true;
   incrementNumber.newObj($scope.currentContainer.selectedImage.label)
   var nameRunning = incrementNumber.newName($scope.currentContainer.selectedImage.label)
   if (_.contains($scope.runningHackTools, nameRunning)) {
     Notification(nameRunning + " is already in execution, pls wait", 'error');
   } else {
   $scope.currentContainer.name = nameRunning;
   $scope.runningHackTools.push(nameRunning);
   $scope.terminals.push({name: nameRunning, message: ''})
   // Set selected networks
  $scope.currentContainer.OneLineNetworks = []
   _.each($scope.networkList, function(n) {
     if (n.isNetworkOnelineAttached) {
       $scope.currentContainer.OneLineNetworks.push(n.name);
     }
   })
   SocketService.manage(JSON.stringify({
       action : 'docker_run',
       params : {
         currentContainer: $scope.currentContainer
       }
   }), function(event) {
    var data = JSON.parse(event.data)
    if(data.status === 'success')  {
      console.log('success');
      Notification('Done', 'success');
      SafeApply.exec($scope, function() {
        // $scope.runningHackTools = _.without($scope.runningHackTools, nameRunning);
      })
    }
    else if(data.status === 'error') {
          console.log(data);
            // Notification(data, 'error');
          $scope.hackToolNotify += data.message;
        // if (_.contains($scope.runningHackTools, nameRunning)) {
          // $scope.runningHackTools = _.without($scope.runningHackTools, nameRunning);
        // }
            // $scope.responseError = $scope.responseErrorHeader + data.message;
            // $scope.labState = playProto
            // $scope.action = $scope.startLab
      }
    // Notification
    else {
        // $scope.hackToolNotify += data.message;
        _.findWhere($scope.terminals, {name: nameRunning}).message += data.message;
       }
     });
   }
 }
  $scope.deleteHackTool = function(nameHacktool) {
    console.log("Remove hack tooL");
    console.log(nameHacktool);
    dockerAPIService.deleteHackTool(nameHacktool)
    .then(function successCallback(response) {
      console.log('Service Deleted');
      $scope.terminals = _.filter($scope.terminals, function(o) { return o.name !== nameHacktool; });
      $scope.runningHackTools = _.without($scope.runningHackTools, nameHacktool)
    }, function errorCallback(error) {
      Notification({message: error.message}, 'error');
    })
  }

  $scope.stopService = function stopService(containerName) {
     console.log("STOP SERVICE");
    dockerAPIService.stopService(containerName)
    .then(function successCallback(response) {
      Notification("Service Stopped!");
      // Show Start button
      stoppedContainer = _.findWhere($scope.listServices, {
        name: containerName
      });
      stoppedContainer.showRun = true;
      stoppedContainer.state = dockerAPIService.stoppedStatus;
    }, function errorCallback(error) {
      console.log(error);
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
$scope.deleteService = function deleteService(containerName) {
  console.log("DELETE SERVICE")
  dockerAPIService.deleteService(containerName)
    .then(function successCallback(response) {
      Notification("Service Deleted!");
      $scope.listServices = dockerAPIService.deleteLocalService(containerName);
      if($scope.listServices.length == 0){
        $scope.showTools = false;
      }
    },
      function errorCallback(error) {
      Notification(error.data.message, 'error');
    });
    console.log($scope.listServices);

}

$scope.setAsDefault = function setAsDefault(container, networkName) {
    console.log("Set As Default")
    dockerAPIService.serviceDefaultNetwork(container.name, networkName)
      .then(function successCallback(response) {
        Notification("Default Network Set");
      },
        function errorCallback(error) {
        Notification(error.data.message, 'error');
      });
  }

$scope.addOptionalPort = function addOptionalPort() {
  // TODO Check conditions
  $scope.showPorts = true;
  var optionalPort = angular.copy($scope.optPort);
  try {

      if(!optionalPort.container || !optionalPort.host)
        throw new Error('Empty value');
      var pc = parseInt(optionalPort.container);
      var ph = parseInt(optionalPort.host);

      if (pc < 1 || pc > 65535 || ph < 1 || ph > 65535) throw new Error('Out of range');
      $scope.optionalPorts.push(optionalPort);
      $scope.currentContainer.ports[optionalPort.container.toString()] = optionalPort.host;
  }
  catch (e) {
      console.log(e);
      Notification({message:"Pls insert correct values"}, 'error');
  }
}

$scope.changedImage = function changedImage(selectedImage) {
  if ($scope.hackToolMode.val == "oneline") {
    $scope.currentContainer.command = selectedImage.default_command;
    $scope.currentContainer.tag = selectedImage.tag;
    $scope.hackLabel = selectedImage.label;
  }
}

$scope.stopHackTool = function stopHackTool(name) {
  console.log("name");
  console.log(name);
  dockerAPIService.stopService(name)
  .then(function successCallback(response) {
      Notification("Service Stopped!");
      $scope.runningHackTools = _.without($scope.runningHackTools, name);
  }, function errorCallback(error) {
      Notification(error.data.message, "error");
  });
}

$scope.removeOptionalPort = function removeOptionalPort($index) {
  var op = $scope.optionalPorts[$index];
  // Delete from currentContainer port
  delete $scope.currentContainer.ports[op.container];
  $scope.optionalPorts.splice($index, 1);
  if($scope.optionalPorts.length === 0)
    $scope.showPorts = false;
}
$scope.onFinishRender = function onFinishRender() {
  const currentTerminal = $scope.terminals[$scope.terminals.length -1];
  console.log(currentTerminal);
  $scope.activeTab = currentTerminal.name;
  console.log("COPEAT");
  console.log($scope.activeTab);

}
}
