var DSP_GraphActionController = function DSP_GraphActionController($scope,$sce, SocketService, CleanerService, $uibModal, $log,$http, $location,  $window, cfpLoadingBar, dockerAPIService, containerManager, Notification) {
  console.log("=== INIT ACTION CONTROLLER ===");
  $scope.labName= '';
  $scope.labInfos = {} ;
  $scope.yamlfile='';
  $scope.entryPointName = ''
  $scope.notify=''
  $scope.tinymceSolution;
  $scope.tinymceGoal = 'goal';
  $scope.responseErrorHeader= "ERROR: ";
  $scope.responseError = "";
  $scope.networkList = [];

  const warningMessageHeader = 'WARNING: ';
  const networkEmptyMessage =  'Network is empty! Have you drawn the containers?';

  function initNetworkList() {
    console.log("INIT NETWORK LIST");
    dockerAPIService.getNetworkList($scope.nameRepo, $scope.labName)
      .then(function successCallback(response) {
        console.log("SUCCESS NETWORK");
        console.log(response);
        $scope.networkList = response.data.data;
      }, function errorCallback(error) {
        Notification({message:"Server error: "+error}, 'error');
      });
  }
  function openInNewTab(url) {
    var a = document.createElement("a");
    a.target = "_blank";
    a.href = url;
    a.click();
  }
  $scope.warningMessage = '';
  //Proto actions
  const playProto = {  actionLabel:"Start lab",  actionClass:"glyphicon glyphicon-play", statusLabel: "Lab is inactive" , actionButton:"btn btn-success", state:'inactive' , statusClass:"alert alert-danger text-center"}
  const loadingProto = {  actionLabel:"Loading",  actionClass:"glyphicon glyphicon-refresh", statusLabel: "Loading..." , actionButton:"btn btn-warning", state:'loading' , statusClass:"alert alert-warning text-center"}
  const stopProto = { actionLabel:"Stop lab",  actionButton:"btn btn-danger", actionClass:"glyphicon glyphicon-stop", statusLabel: "Lab is active", state:'active', statusClass:"alert alert-success text-center"}
  function updateNotify(data) {
    if(!$scope.$$phase) {
      $scope.$apply(function() {
        $scope.notify+= data.message+"<br>";
      });
      //$digest or $apply
    }
    else $scope.notify += data.message;
  }

  //Start the lab
  $scope.startLab = function startLab()
  {
    console.log("We 're stating lab"  )
    //On start loading
    $scope.labState = loadingProto
    startLoad()
    $scope.action = $scope.loading

    //Send
    SocketService.manage(JSON.stringify({
      action : 'docker_up',
      params : {
        namerepo : $scope.nameRepo,
        namelab : $scope.labName
      }
    }), function(event) {
      var data = JSON.parse(event.data);
      if(data.status === 'success')  {
        console.log("Success")
        //Set state on stop
        $scope.labState = stopProto
        $scope.action = $scope.stopLab
        initNetworkList();
        //End load action
        completeLoad()
      }
      else if(data.status === 'error') {
        Notification('Some error in docker-compose up command', 'error');
        console.log(data)
        $scope.responseError = $scope.responseErrorHeader + data.message;
        $scope.labState = playProto
        $scope.action = $scope.startLab
      }
      else updateNotify(data);
    });




  } //End startlab

  $scope.copyFromContainer = function (nameContainer, dc="true") {
    var modalInstance = $uibModal.open({
      animation: true,
      component: 'copyFromContainerComponent',
      resolve: {
        lab: function () {
          return  {
            namerepo : $scope.nameRepo,
            namelab : $scope.labName,
            namecontainer: nameContainer,
            dockercompose : dc
          };
        }
      }
    });

    modalInstance.result.then(function () {
      console.log("respone modalInstance")
    }, function () {
      $log.info('modal-component dismissed at: ' + new Date());
    });
  }

  $scope.copyInContainer = function (nameContainer, dc="false") {
    var modalInstance = $uibModal.open({
      animation: true,
      component: 'copyInContainerComponent',
      resolve: {
        lab: function () {
          return  {
            namerepo : $scope.nameRepo,
            namelab : $scope.labName,
            namecontainer: nameContainer,
            dockercompose : dc
          };
        }
      }
    });

    modalInstance.result.then(function () {
      console.log("responso modalInstance")
    }, function () {
      $log.info('modal-component dismissed at: ' + new Date());
    });
  }
  // Container go to shell
  $scope.goToContainer = function goToContainer(nameContainer, dc="true")  {
    console.log(nameContainer)
    console.log(dc)
    $http.post('/dsp_v1/dockershell', {
      namerepo : $scope.nameRepo,
      namelab : $scope.labName,
      dockername: nameContainer,
      dockercompose : dc
    })
      .then(
        function success(response) {
          console.log("SUCCESS");
          var windowReference = window.open();
          windowReference.location = "docker_socket.html";
          // window.open('docker_socket.html', '_blank');
        },
        function error(err) {
          // Lab running error
          Notification({message:"Server error: "+err.data.message}, 'error');
        });
  }

  //Stop the lab
  $scope.stopLab = function stopLab() {
    console.log("We're stopping lab")
    //Temp state of loading
    $scope.labState = loadingProto
    startLoad()
    $scope.action = $scope.loading
    //Open socket
    //	var url = '/dsp_v1/docker_compose/'+$scope.nameRepo+"/"+$scope.labName
    //Send compose up
    SocketService.manage(JSON.stringify({
      action : 'docker_down',
      params : {
        namerepo : $scope.nameRepo,
        namelab : $scope.labName
      }
    }),
      function(event) {
        var data = JSON.parse(event.data);
        if(data.status === 'success')  {
          console.log("Success")
          console.log($scope.listServices);
          dockerAPIService.detachAllServices();
          //Complete spinner
          completeLoad()
          //labState to play proto
          $scope.labState = playProto
          $scope.action = $scope.startLab
        }
        else if(data.status === 'error') {
          Notification('Some error in docker-compose down command', 'error');
          //	$scope.labState = playProto
          //	$scope.action = $scope.startLab
        }
        else updateNotify(data);
      });
  }

  //Nothing to do
  $scope.loading = function loading() {}



  //Param analysis
  var params = $location.search()
  if(params.namelab && params.reponame)
  {
    $scope.labName= params.namelab;
    $scope.nameRepo= params.reponame;
  }
  else  {
    Notification('Network name or repo name no selected, you will come back to home!', 'error');
    $scope.labState = stopProto
    $scope.action = $scope.stopLab
  }



  //   $window.onbeforeunload = function(evt) {
  //     if ($scope.labState.state !== 'inactive') {
  //       $scope.stopLab();
  //     }
  //   };
  //
  $scope.goToImages = function goToImages() {
    if($scope.labState.state === 'loading') {
      Notification('Pls wait the end of operation', 'warning');
    }
    // Only if it's been defined
    else {
      window.location.href='/images';
    }
  }
  $scope.exitLab = function exitLab() { 
if($scope.labState.state === 'loading') {
  Notification('Pls wait the end of operation', 'warning');
}
// Only if it's been defined
else {
  window.location.href='/lab/use/'+$scope.nameRepo+'/'+$scope.labName
}
}


/** LOAD INFO ABOUT LAB **/

$http.get("/dsp_v1/labs/"+$scope.nameRepo+"/"+$scope.labName)
  .then(function successCallback(response) {
    console.log("Success:")
    $scope.labInfos = response.data.data
    $scope.labInfos.goal = CleanerService.parse($scope.labInfos.goal)
    $scope.labInfos.solution = CleanerService.parse($scope.labInfos.solution)
    $scope.tinymceSolution = $sce.trustAsHtml($scope.labInfos.solution)
    $scope.tinymceGoal = $sce.trustAsHtml($scope.labInfos.goal)
  },
    function errorCallback(response) {
      console.log("Error")
    })



/** GRAPH INFORMATION **/
var gh = GraphHandler()
//Called when an element is called
var graphOkCallback = function graphErrorCallback(currentToDraw) {

  containerManager.updateWhenToDraw(currentToDraw)
  console.log(JSON.stringify($scope.containerListToDraw))
  //Delete current container drawer element , it cannot be more used
  gh.setCurrent(null)
  $scope.containerToDraw = null
}

var graphErrorCallback = function graphErrorCallback(message) {
  $scope.$apply(canvasClick())
}

gh.registerErrorCallback(graphErrorCallback)
gh.registerOkCallback(graphOkCallback)
gh.canDrag(false)
gh.setEditMode()

/* DODCKER API INIT  : load docker images */
dockerAPIService.getDockerImages()
  .then(function successCallback(response) {
    var imageList = response.data.data
    $log.warn("TODO : CHECK SIZE DOCKER IMAGES == 0")
    console.log(imageList)
    $scope.imageList = imageList


    //When imageList it's loded LOAD LAB (network.json)
    dockerAPIService.useLab($scope.nameRepo, $scope.labName, false, function(data) {
      //Current labState : if stopped play actions else stop actions
      $scope.labState = data.state === 'STOPPED' ? playProto : stopProto;
      $scope.action = data.state === 'STOPPED' ? $scope.startLab : $scope.stopLab;
      // If is empty clistToDraw set warning
      if(_.isEmpty(data.clistToDraw))
        $scope.warningMessage = warningMessageHeader+ networkEmptyMessage;

      $scope.listContainers = data.clistToDraw;
      var canvasJSON = data.canvasJSON;
      gh.loadGraphicJSON(canvasJSON)
      containerManager.loadContainers(data, {imageList : $scope.imageList})

      // Load yamlfile
      var yamlcode = angular.element('#code_yaml')

      yamlcode.text(data.yamlfile)
      Prism.highlightAll();
      $scope.yamlfile = data.yamlfile;
      //console.log(NetworkManagerService)
      //  if(data.networkList)
      //  NetworkManagerService.setNetworkList(data.networkList)
      //$scope.networkList =  NetworkManagerService.getNetworks()

      // Init Network List if the lab is running
      if(data.state === 'RUNNING') {
        initNetworkList();
      }
    });

  },function errorCallback(response) {})

$scope.clearLogs = function() {
  $scope.notify = "";
  $scope.responseError = "";
}

/************************** NETWORK INFO  **********************/
//Current network view

$scope.n = {
  name : "", subnet:"192.168.1.1/24", color:"black",
  more_validation : "###"
};

$scope.subnet = {
  first:"192",
  two:"168",
  three:"1",
  four:"1"
};
/* Array of
 *
 *	var networkPrototype = {
 *		name : "" ,
 *		subnet : "",
 *		color : "black"
 *	},
 *
 *
 */




/********************* CONTAINER  ********************/
//This is the container in the form used to add new container templates

//Load image list
$scope.currentContainer = containerManager.currentContainer
//The list of possible contaier choices to draw
$scope.containerListNotToDraw =  containerManager.containerListNotToDraw
//The list already created
$scope.containerListToDraw = containerManager.containerListToDraw
//This is the container to draw
$scope.containerToDraw = containerManager.containerToDraw

$scope.editContainerName = ''

function startLoad() {
  cfpLoadingBar.start();
};

function completeLoad() {
  cfpLoadingBar.complete();
}


function canvasClick() {
}
/** END MENU COMMAND ACTIONS HANDLING ****/


} /* END CONTROLLER  */



