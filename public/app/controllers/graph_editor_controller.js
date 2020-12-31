DSP_GraphEditorController : function DSP_GraphEditorController($scope,  $routeParams, AjaxService, $uibModal, RegexService, $log, $http, $location, $window, NetworkManagerService,  SocketService, portService, dockerAPIService, containerManager, infoService, safeApplyService, Notification, dependsFilter) {
  console.log("=== INIT GRAPH EDITOR ===");

  $scope.labName= '';
  $scope.showEditContainer = false;
  $scope.showEditNetwork   = false;
  $scope.yamlfile='';
  $scope.active = 0
  $scope.showYamlFile = false;
  $scope.isRestarting = false;
  $scope.isRunning = false;
  $scope.isCreated = false;
  $scope.log = ""
  $scope.imageDownload = {};
  $scope.environment = {name: "Name",
    value: "Value"
  };

  $scope.isComposeVisible = true;
  const protoAddAction = 'New container',
    protoEditAction = 'Edit ';

  $scope.currentAction = protoAddAction;
  $scope.containerDescription;


  //Regex
  $scope.nameContainerRegex = RegexService.nameContainerRegex;

  //Param analysis
  if($routeParams.namelab)
  {
    $scope.labName = $routeParams.namelab;
  }
  //Redirect to managment projects
  else redirectToMain()


  function redirectToMain() {
    $window.location.href="/index.html"
  }

  /* DODCKER API INIT  : load docker images */
  dockerAPIService.getDockerImages()
    .then(function successCallback(response) {
      var imageList = response.data.data
      $log.warn("TODO : CHECK SIZE DOCKER IMAGES == 0")

      $scope.imageList = imageList
      //If first image has action set selectedAction

      //Init container manager
      containerManager.init($scope.imageList)
      $scope.changedImage($scope.imageList[0])
      var createNew = $location.search().create ? true : false;
      // if(params.action && (params.action==='edit' || params.action ==='new')) {
      // Edit a lab
      if(!createNew) {
        ////When imageList it's loded load lab
        dockerAPIService.loadLab($scope.labName, true, function(data) {

          $scope.canvas = data.canvasJSON;
          $scope.isRunning = data.state === "RUNNING" ? true : false;
          $scope.isCreated = true;

          $scope.repoName = data.repoName;
          //TOREFACT gh.loadGraphicJSON(canvasJSON)
          containerManager.loadContainers(data, {imageList : $scope.imageList})

          var yamlcode = angular.element('#code_yaml')

          yamlcode.text(data.yamlfile)
          Prism.highlightAll();
          $scope.yamlfile = data.yamlfile;
          // If exists a networkList add the netwokr list
          if(data.networkList)
            NetworkManagerService.setNetworkList(data.networkList)
          $scope.networkList =  NetworkManagerService.getNetworks()
          // Set isComposeVisible
          if (data.isComposeVisible == false)
            $scope.isComposeVisible = false
          // Container created, update canvas
          if (Graph__isValidXML($scope.canvas)) {
            console.log("Is valid XML");
            var networkNames = $scope.networkList.map(a => a.name)
            var containerNames = containerManager.containerListToDraw.map( c => c.name);
            $scope.canvasLoadedCallback($scope.canvas, containerNames, networkNames);
          }
          // Try to create the structure
          else {
            Graph__CreateGraphFromStructure(data)
          }
        })
      }
      else {
        $scope.networkList =  NetworkManagerService.getNetworks()
      }
      // }
      //If params are not correct
      // else {
      //   redirectToMain()
      // }
    },
      function errorCallback(response) {
        Notification({message:"Sorry,  error in loading docker images"}, 'error');
      })



  /** GRAPH INFOS **/
  /**
   * Initialize the callbacks to call when the angular events terminate
   *
   */
  $scope.initGraphCallbacks = function(callbacks) {
    $scope.graphEditTerminatedCallback = callbacks[0];
    $scope.canvasLoadedCallback = callbacks[1];
  }



  /************************** NETWORK INFO  **********************/
  //Current network view
  $scope.n = {
    name : "", subnet:"193.20.1.1/24", color:"black",
    more_validation : "###"
  };
  $scope.subnet = {
    first:"193",
    two:"20",
    three:"0",
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


  $scope.isNetworkAttached = function(name) {
    return containerManager.checkNetworkInToDraw(name)
  }
  $scope.deleteNetwork = function(name) {
    if($scope.isNetworkAttached(name))
      Notification({message:"Cannot delete an used network pls delete first the associated containers:"+containersName}, 'error');
    else {
      NetworkManagerService.removeNetwork(name)
      containerManager.deleteNetworkFromContainers(name)
      $scope.networkList = NetworkManagerService.getNetworks()
    }
  };
  $scope.changeIpType = function(currentContainer, nameNetwork) {
    console.log("In change ip type");
    console.log(currentContainer.networks[nameNetwork]);
  }

  //Add a new network to list of networks
  $scope.addNetworkElement = function(networkName) {
    $scope.subnet.three =  (parseInt($scope.subnet.three)+1)%255
    var s = $scope.subnet.first+"."+$scope.subnet.two+"."+$scope.subnet.three+"."+$scope.subnet.four
    //Increase the third cipher of form ip
    $scope.n.subnet = s
    var network = NetworkManagerService.newNetwork({name:networkName, subnet:$scope.n.subnet})

    $log.warn("TODO UPDATE OTHER")
    //Update subnet
    $log.warn("TODO UPDATE NAME")
    //Reset n
    $scope.n.name = networkName
    //Update informations network of containers
    containerManager.newNetworkOccurred(network)
    return {name:networkName, subnet:$scope.n.subnet};
  };

  $scope.goBack = function() {
    var urlToGo = '/lab/use/'+ AjaxService.config.name +'/'+ $scope.labName;
window.location.href = urlToGo;
    // $location.url(urlToGo);
  }
  $scope.getNetwork = function(networkName) {
       return NetworkManagerService.getNetwork(networkName);
  }

  // Variable that contains old name of network is sent to networkElementCallback when the editNetwork is done
  var networkInEditing = null;
  // Called when the edit is finished
  $scope.editNetworkElement = function() {
    console.log("[graph_editor_controller] editNetworkElement");

    var s = $scope.subnet.first+"."+$scope.subnet.two+"."+$scope.subnet.three+"."+$scope.subnet.four

    // Update network in network list
    var networkToEdit = NetworkManagerService.getNetwork(networkInEditing.name);
    networkToEdit.name = $scope.n.name;
    networkToEdit.subnet = s;
    networkToEdit.listIP = NetworkManagerService.genList(networkToEdit.subnet)
    // Callback to graphedit
    $scope.graphEditTerminatedCallback(networkInEditing.name, networkInEditing, $scope.n);
    // Reset current container

    // Don't show the network panel
    $scope.showEditNetwork = false;
    MX__Save();
  }

  $scope.cancelNetworkElement = function() {
    $scope.showEditNetwork = false;
  }

  //PORTS
  portService.init()
  $scope.hostPorts =  portService
  // ERROR HANDLERS
  $scope.networkErrors = {
    someError : false,
    message : ""
  }
  //Check network duplicates on change text input
  $scope.checkNetworkDuplicates = function checkNetworkDuplicates(event)
  {
    var found=false
    var networkVal = formnetwork.nameNetwork.value

    var s = $scope.subnet.first+"."+$scope.subnet.two+"."+$scope.subnet.three+"."+$scope.subnet.four


    if(networkVal != networkInEditing.name && NetworkManagerService.hasNetwork(networkVal))
    {
      $scope.networkErrors.someError= true
      $scope.networkErrors.message="Network name already present"
      //Disable form network with hidden field
      $scope.n.more_validation=""
    }

    //Check subnet
    else if(networkInEditing.subnet != s && NetworkManagerService.hasSubnet(s))
    {

      $scope.networkErrors.someError= true
      $scope.networkErrors.message="Subnet  already present"
      //Disable form network with hidden field
      $scope.n.more_validation=""
    }

    else
    {
      $scope.networkErrors.someError=false
      $scope.networkErrors.message=""
      //Enable form network with hidden field
      $scope.n.more_validation="###"
    }


  }



  /********************* END NETWORK DESCR  ********************/



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
  // $scope.containerListToDrawFiltered = dependsFilter($scope.containerListToDraw, $scope.editContainerName)
  $scope.containerListToDrawFiltered = containerManager.containerToDraw;

  $scope.optPort = { container: '', host: ''};
  $scope.optionalPorts = [];
  $scope.addOptionalPort = function addOptionalPort() {
    // TODO Check conditions
    var optionalPort = angular.copy($scope.optPort);
    try {

      if(!optionalPort.container || !optionalPort.host)
        throw new Error('Empty value');
      var pc = parseInt(optionalPort.container);
      var ph = parseInt(optionalPort.host);

      if (pc < 1 || pc > 65535 || ph < 1 || ph > 65535) throw new Error('Out of range');
      $scope.optionalPorts.push(optionalPort);
      $scope.currentContainer.ports[optionalPort.container] = optionalPort.host;
    }
    catch (e) {
      Notification({message:"Pls insert correct values"}, 'error');
    }
  }

  $scope.removeOptionalPort = function removeOptionalPort($index) {
    var op = $scope.optionalPorts[$index];
    // Delete from currentContainer port
    delete $scope.currentContainer.ports[op.container];
    $scope.optionalPorts.splice($index, 1);

  }
  //On click edit load the ports by filtering port of image
  function loadOptionalPorts(ports, selectedImage) {
    var exposedPorts = selectedImage.exposedPorts;
    _.each(ports, function(k, v) {
      // If no port of image (required ports) add to optional ports
      if(!_.contains(exposedPorts, v) && v != exposedPorts) {
        $scope.optionalPorts.push({
          container:v,
          host:k
        });
      }
    });

  }

  //Containers  method
  $scope.containerErrors = {
    someError : false,
    message : "" ,
    more_validation:"###"
  }

  $scope.checkContainerChange = function checkContainerChange() {
    $scope.containerListToDrawFiltered = [];
    // Set depends on array
    _.each($scope.containerListToDraw, (c) => {
      if (c.name != $scope.editContainerName)
        $scope.containerListToDrawFiltered.push(c);
    });

    var found = containerManager.hasContainer()

    //If there already is a container with this name  and new

    if(found && $scope.isAddContainer)
    {
      $scope.containerErrors.someError= true
      $scope.containerErrors.message= "Container already present"
      //Disable form container with hidden field
      $scope.containerErrors.more_validation=""
    }
    else {
      $scope.containerErrors.someError= false
      $scope.containerErrors.message= ""
      //Disable form container with hidden field
      $scope.containerErrors.more_validation="###"

    }
  }
  $scope.getContainer = function getContainer(name) {
     return  _.findWhere($scope.containerListToDraw, {name: name});
  }

  /* Called when the container is edit
   *
   */
  $scope.editContainer = function editContainer() {
    //Add to current container infos about container list not drawed selected
    $scope.optionalPorts = [];
    $scope.optPort = { container: '', host: ''};

    var containerToEdit = _.findWhere($scope.containerListToDraw, {name: $scope.editContainerName});
    var oldName = containerToEdit.name;
    // If the name has been changed check if already exists
    if (oldName != $scope.currentContainer.name && _.findWhere($scope.containerListToDraw, {name: $scope.currentContainer.name})) {
      Notification({message:"Sorry, network element with this name already present"}, 'error');
    } else {
      containerManager.setContainer($scope.currentContainer, containerToEdit);
      // Callback to graphedit
      $scope.graphEditTerminatedCallback(oldName, containerToEdit, $scope.currentContainer);
      // Reset current container
      containerManager.resetCurrent($scope.imageList, $scope.networkList);
      $scope.isAddContainer = true;
      $scope.currentAction = protoAddAction;
      // Don't show the container panel
      $scope.showEditContainer = false;
      Notification({message: containerToEdit.name+ " modified!"}, 'success');
      MX__Save();
    }


  }

    $scope.cancelEditContainer = function cancelEditContainer() {
      //Add
      console.log("Cancel Edit Container");
      $scope.optPort = { container: '', host: ''};
      $scope.optionalPorts = [];
      containerManager.resetCurrent($scope.imageList, $scope.networkList)
      $scope.isAddContainer = true
      $scope.showEditContainer = false;
    }
  $scope.containerExists = function elementExists(nameContainer) {
    if(_.findWhere($scope.containerListToDraw, {name: nameContainer})) {
      return  true;
    } else {
      return false;
    }
  }

  $scope.newContainer = function newContainer(nameContainer) {
    if(_.findWhere($scope.containerListToDraw, {name: nameContainer})) {
      Notification({message:"Sorry, network element with this name already present"}, 'error');
    } else {
      $scope.optionalPorts = [];
      $scope.optPort = { container: '', host: ''};
      var c = {
        name: nameContainer,
        selectedImage: $scope.currentContainer.selectedImage,
        ports : $scope.currentContainer.ports,
        actions : angular.copy($scope.currentContainer.actions),
        volumes : angular.copy($scope.currentContainer.volumes),
        filesToCopy : angular.copy($scope.currentContainer.filesToCopy),
        networks: JSON.parse(JSON.stringify($scope.currentContainer.networks))
      };
      $
      var env = [];
      c.environments = env

      ////Add to not drawed new container
      containerManager.addToDraw(c)
      Notification({message: c.name+ " created!"}, 'success');
      return c;
    }
  }

  // to update container list  when  submit clicked in form_add_container
  $scope.loadContainer = function loadContainer() {
    $scope.optionalPorts = [];
    $scope.optPort = { container: '', host: ''};

    var c = {
      name:$scope.currentContainer.name,
      selectedImage: $scope.currentContainer.selectedImage,
      ports : $scope.currentContainer.ports,
      actions : angular.copy($scope.currentContainer.actions),
      volumes : angular.copy($scope.currentContainer.volumes),
      filesToCopy : angular.copy($scope.currentContainer.filesToCopy),
      networks: JSON.parse(JSON.stringify($scope.currentContainer.networks))
    };
    $
    var env = [];
    //Load environment
    _.each($scope.currentContainer.environments, function(e)
      {
        if(e.name && e.value && e.name !== '' && e.value !== '')
        {
          env.push(e)
        }
      })
    c.environments = env
    //	//Add currentIP  to resolve the problem of ng-change in select
    //	_.each(c.networks, function(e) {
    //		e.currentIP = e.ip
    //	})


    //Add to not drawed new container
    containerManager.addToNotToDraw(c)



    //Use network  address
    var networksSetted = _.where(c.networks, {isChecked:true})
    _.each(networksSetted, function(n) {
      NetworkManagerService.useAddress(n.ip)})
    //Zeroes currentContainer
    containerManager.resetCurrent($scope.imageList, $scope.networkList)
    Notification({message: c.name+ " created!"}, 'success');


  }
  $scope.copyContainer = function copyContainer($index) {
    //Free networks
    var container=  angular.copy($scope.containerListNotToDraw[$index]);
    var trail  = "_1";
    var lastChar = container.name.charAt(container.name.length -1);
    if(/^\d+$/.test(lastChar)) {
      trail = parseInt(lastChar) + 1;
      container.name = container.name.substring(0, container.name.length -1);
    }
    container.name = container.name+ trail;
    containerManager.addToNotToDraw(container);

  }
  //Delete a container from containerNotToDraw list
  $scope.deleteContainer = function deleteContainer(containerName) {

    //Free networks
    var container=  containerManager.getContainer(containerName);
    var networks = container.networks
    // IF is equl to removed container, delete selection
    if ($scope.containerDescription === container)
      $scope.containerDescription = null;
    var checkedNetworks = _.where(networks, {isChecked:true})
    _.each(checkedNetworks, function(n) {
      NetworkManagerService.freeAddress(n.ip)
    })

    containerManager.deleteFromToDraw(container.name)
    //containerToDraw
    if($scope.containerToDraw)
      //if is selected must be deleted!
      if($index === $scope.containerToDraw.name)
      {
        $scope.containerToDraw = null
      }
  }

  $scope.attachNetwork = function attachNetwork(nameNetwork, containerName) {
    var ip = NetworkManagerService.getFirst(nameNetwork)
    var container = containerManager.getContainer(containerName);
    container.networks[nameNetwork] = {
      ip: '',
      position: '',
      isVisible: '',
      isDynamic: true
    }

    container.networks[nameNetwork].ip = ip
    container.networks[nameNetwork].isChecked = true
    // To fix issue #65 we store newNetwork
    container.newNetwork = nameNetwork;

    NetworkManagerService.useAddress(ip)
  }
  $scope.detachNetwork = function detachNetwork(nameNetwork, containerName) {
    var container = containerManager.getContainer(containerName);
    if (container && container.networks && container.networks[nameNetwork]) {
      var ip = container.networks[nameNetwork].ip
      NetworkManagerService.freeAddress(ip)
      delete container.networks[nameNetwork];
      // container.networks[nameNetwork].ip = ""
      // container.networks[nameNetwork].isChecked = false;
    }
  }

  $scope.checkNetworkClicked = function checkNewtorkClicked(nameNetwork, container) {

    var isChecked = container.networks[nameNetwork].isChecked
    //If currentContainer network is unchecked , delete firstIP
    if(isChecked)
    {

      var ip = NetworkManagerService.getFirst(nameNetwork)
      container.networks[nameNetwork].ip = ip
      container.networks[nameNetwork].position = 'right'
      container.networks[nameNetwork].isVisible = true
      NetworkManagerService.useAddress(ip)
    }
    //If isn't checked delete
    else
    {
      var ip = container.networks[nameNetwork].ip
      NetworkManagerService.freeAddress(ip)
      container.networks[nameNetwork].ip = ""
    }
  }

  //Select a container to draw
  $scope.selectContainerAction = function selectContainerAction(e)
  {
    var nameSelected = e.currentTarget.id;
    var eSelected =_.where($scope.containerListNotToDraw, {name:nameSelected})[0];
    //Get networks
    var networks = eSelected.networks;
    var networkToDraw = [];
    _.each(networks, function(e)  {
      //Only if isChecked
      if(e.isChecked)
      {
        //Find color
        var subnet = NetworkManagerService.subnetOf(e.ip);
        var n=NetworkManagerService.getNetworkBySubnet(subnet);
        networkToDraw.push({
          nameNetwork : n.name,
          // Draw only if is visible
          name: (e.isVisible == false) ?  '' : e.ip,
          color:n.color,
          position:e.position,
          isDynamic: e.isDynamic
        })
      }


    }) // End fill network list
    //Graph networkList : {name,color , position}
    if(eSelected)
    {
      $scope.containerToDraw = {
        name : eSelected.name,
        icon : eSelected.selectedImage.icon,
        networkList : networkToDraw,
        ports : eSelected.ports

      }
      //UPDATE CONTAINER TO DRAW
      $scope.containerDescription = eSelected;
    }

  }
  $scope.changeContainerIP = function changeContainerIP(e,c, networkName) {
    //Ip in option
    var ipSelected = e.currentTarget.value
    //Free ip used in form container
    var network = c.networks[networkName]
    //Only if it's defined free
    if(network && network.ip)
    {
      NetworkManagerService.freeAddress(network.ip)
    }
    //Else define network
    else {
      //if it's not defined
      if(!network)
      {
        c.networks = { position:"right"}
        network = c.networks
      }

    }
    //now update the network ip of the container
    network.ip = ipSelected
    //and use this ip
    NetworkManagerService.useAddress(network.ip)
  }
  $scope.addEnvironment = function() {
    containerManager.addEnvironment($scope.environment.name, $scope.environment.value)

  }
  $scope.removeEnvironment = function(key) {
    containerManager.removeEnvironment(key)

  }

  $scope.volumeHost = ''
  $scope.volumeContainer = ''
  //True if no empty volumes

  $scope.removeVolume = function(index) {
    $scope.currentContainer.volumes.splice(index, 1)
  }
  //Volume host , volume container
  $scope.addVolume = function(vh, vc) {
    if (!$scope.currentContainer.volumes)
      $scope.currentContainer.volumes = []
    //Verify if exists and no errors
    if (vh && vc) {
      // Add / if doesn't contain it
      if (vc.charAt(0) !== '/') {
        vc = '/'+vc
      }

      var toInsert = {
        host: vh,
        container: vc
      };
      if(!_.contains($scope.currentContainer.volumes, toInsert))
        $scope.currentContainer.volumes.push(toInsert);
      else Notification('Path already setted!', 'error')
    }
    else Notification('No correct host and container volume', 'error')

  }



  /********************* END CONTAINER ********************/

  /********************** IMAGE ACTIONS ******************/
  $scope.selectedArgs = {}
  $scope.selectedAction = {}
  $scope.showEdit = false;
  $scope.actionToEdit = {
  }
  $scope.priorityToEdit=1;
  $scope.argsToEdit = {}


  $scope.listPriority = Array.apply(null, Array(99)).map(function (_, i) {return i+1;}); // [1,2,3,4,5,6,7,8,9]
  $scope.actionPriority = $scope.listPriority[0]
  $scope.imageHasActions = function(i) {
    if(i)
    {
      var hasAction = (i.actions && !_.isEmpty(i.actions))
      return 	hasAction
    }
    else return false
  }
  function setDefaultAction(image) {

    if($scope.imageHasActions(image))
    {
      // Get action
      $scope.selectedAction = image.actions[_.keys(image.actions)[0]]
      $scope.defaultArgs($scope.selectedAction)

    }
  }
  $scope.changedImage = function(image) {
    //Every time delete actions form currentContainer
    var oldActions = $scope.currentContainer.actions;
    $scope.currentContainer.actions = [];
    // $scope.currentContainer.ports = {};
    var imageActions = image.actions;
    // If contains the same action name copy in new image
    _.each(oldActions, function(act) {
      _.each(imageActions, function(ele, key) {
        if(act.name === key) {
          var imageActionArgs = _.keys(ele.args);
          var oldActionArgs = _.keys(act.args);
          // Check all args are equal
          if (_.isEqual(imageActionArgs, oldActionArgs)) {
            $scope.currentContainer.actions.push(act);
          }
        }
      });

    });

    // $scope.currentContainer.ports
    //Set a selected image
    setDefaultAction($scope.currentContainer.selectedImage);

  }

  $scope.downloadNewImage = function downloadNewImage(i) {
    var ni = {}
    ni.name = i;
    ni.disabled = false;
    $scope.downloadImage(ni);
  }

  $scope.downloadImage = function downloadImage(p) {
    $scope.imageDownload = p
    if ($scope.imageDownload.disabled == true) {
      console.log(p.name + " already in downloading")
    } else {
      $scope.imageDownload.isVisible = true;
      $scope.imageDownload.isExtracting = false;
      var ids = [];
      var total = 0;
      imageSep = p.name.split(":")
      nameToDownload = imageSep[0]
      if(imageSep.length === 1){
        tagToDownload = "latest";
        p.name = p.name + ":latest"
      }
      else {
        tagToDownload = imageSep[1];
      }
      SocketService.manage(JSON.stringify({
        action : 'download_images',
        params : {
          name : nameToDownload,
          tag : tagToDownload
        }
      }), function(event) {
        var data = JSON.parse(event.data);
        if(data.status === 'success')  {
          console.log("Success")
          //log.content = "";
          $scope.imageDownload.progress=""
          $scope.imageDownload.isVisible = false
          //successAll(p.name, true)
          $scope.imageDownload.textType = "text-success"
          Notification({message: " Image successfully downloaded!"}, 'success');
          $scope.updateImages(p);
          //$scope.changedImage(p)
        }
        else if(data.status === 'error') {
          Notification('Some error in download image', 'error');
          console.log(data)
          // $scope.responseError = $scope.responseErrorHeader + data.message;
        }
        else {
          console.log("IMAGES");
          //log.content += data.message;
          console.log(data.message);
          var message = JSON.parse(data.message);
          if(message.status == 'Pulling fs layer'){
            var obj = {'id': message.id,'percentage': 0};
            ids.push(obj);
          }
          if(message.status == 'Downloading'){
            _.each(ids, function(element){
              if(message.id == element.id){
                var normalized = (100 / ids.length);
                element.percentage = ((message.progressDetail.current * normalized) / message.progressDetail.total) - element.percentage;
                total += element.percentage;
              }
            })
          }
          if(message.status == 'Download complete'){

            _.each(ids, function(element){
              if(message.id == element.id){
                var normalized = (100 / ids.length)
                element.percentage = normalized - element.percentage;
                total += element.percentage;
              }
            })
          }
          if(total > 99)
          {
            $scope.imageDownload.isExtracting = true;
          }
          $scope.imageDownload.progress = total;
          console.log($scope.imageDownload.progress)
          //p.progress = dockerAPIService.formatPullLog(data.message);
        }
      })
    }
  }

  //Set argument of action to default
  $scope.defaultArgs = function(action) {
    if (action && action.args)
      $scope.selectedArgs = angular.copy(action.args)
    else $scope.selectedArgs = null;
    //	$scope.actionPriority = $scope.listPriority[0]
  }
  $scope.addAction = function(a, p) {
    if($scope.checkArgs($scope.selectedArgs))
    {
      $scope.currentContainer.actions.push({name:a.name, command: a.command, priority: angular.copy(p), args:angular.copy($scope.selectedArgs) })
      //Reset args
      $scope.defaultArgs(a)
    }
  }
  // When the user click on edit action
  $scope.editAction = function(index) {
    var action = $scope.currentContainer.actions[index];
    $scope.showEdit= true;
    $scope.actionToEdit = action;
    $scope.actionToEdit.index = index;
    $scope.argsToEdit = angular.copy($scope.actionToEdit.args);
    $scope.priorityToEdit = $scope.listPriority[_.indexOf($scope.listPriority, $scope.actionToEdit.priority)];


  }
  $scope.changePrio = function(index) {
    $scope.priorityToEdit = index;
  }
  $scope.cancelEditAction = function() {
    $scope.actionToEdit = {};
    $scope.showEdit= false;
  }
  $scope.checkArgs = function(args) {
    // var rule = {
    //       email: true
    // };
    // var result = approve.value('userdomain.com', rule);
    // alert(result.approved);
    var allChecked = true;
    _.each(args, function(e, k) {
      // If there is a rule
      if(allChecked && e.rule)  {
        // Get the rule
        var rule = RegexService.searchDockerWrapperImageRule(e.rule);
        // === THIS IS FOR TESTING SET !== REAL CHECK
        if (rule !== null) {
          var result = approve.value(e.val, rule);
          if (!result.approved) {
            var strErr = RegexService.getErrorString(result, e.rule);
            Notification("' "+e.val+" '" +strErr, 'error');
            allChecked = false;
            return;
          }
        }
      }
      if(allChecked && _.isEmpty(e.val))
      {
        allChecked =false;
        Notification({message:k+ " cannot be null!"}, 'error');
        return;
      }
    });
    return allChecked;
  }

  $scope.confirmEditAction =  function() {
    //Edit arguments

    if($scope.checkArgs($scope.argsToEdit))
    {
      $scope.currentContainer.actions[$scope.actionToEdit.index].args = angular.copy($scope.argsToEdit);
      $scope.currentContainer.actions[$scope.actionToEdit.index].priority = angular.copy($scope.priorityToEdit);
      $scope.actionToEdit= {} ;
      $scope.argsToEdit = {};
      $scope.showEdit = false;
    }
  }

  $scope.removeAction = function(index) {
    $scope.currentContainer.actions.splice(index, 1)
  }
  /** TEST **/
  function test(ctrl) {

  }

  //test($scope.


  /********************* COMMAND ACTION MENU HANDLING ********************/

  $scope.isAddContainer = true;


  $scope.isCurrentContainer = function isCurrentContainer(item) {

    return item.name !== $scope.currentContainer.name

  }

  //When click edit button show edit buttons and set name editContainer
  $scope.onClickEditContainer =  function(containerName) {

    $scope.containerListToDrawFiltered = [];
    _.each($scope.containerListToDraw, (c) => {
      if (containerName != c.name) {
        $scope.containerListToDrawFiltered.push(c);
      }
    })
    safeApplyService.exec($scope, function() {
      $scope.isAddContainer = false;
      // Fix filtered image
      //	console.log($scope.containerListNotToDraw)
      //Eventually redirect to edit


      var containerToEdit = _.findWhere($scope.containerListToDraw, {name: containerName})
      // THe OLD NAME
      $scope.editContainerName = containerToEdit.name;
      // It' the string EDIT LAB , no action of docker !
      $scope.currentAction = protoEditAction+ $scope.editContainerName;
      // Set the default

      //Update currentContainer


      containerManager.setContainer(containerToEdit, $scope.currentContainer);
      $scope.filterImage = ""
      setDefaultAction($scope.currentContainer.selectedImage);
      // Load ports
      loadOptionalPorts($scope.currentContainer.ports, $scope.currentContainer.selectedImage);
      $scope.showEditContainer = true;

    });
  }

  $scope.onClickEditNetwork = function(networkName) {
    safeApplyService.exec($scope, function() {
      $scope.showEditNetwork = true;
      if (NetworkManagerService.hasNetwork(networkName)) {
        var theNetwork = NetworkManagerService.getNetwork(networkName);
        // Save the name before that the user edit it
        networkInEditing = _.clone(theNetwork);
        $scope.n = _.clone(theNetwork);
        // Set subnet dotted
        var ss = $scope.n.subnet.split('.');
        $scope.subnet = {
          first: ss[0],
          two: ss[1],
          three: ss[2],
          four: ss[3]
        }
        $scope.n.more_validation = "###";
      } else {
        console.log("ERROR: why no network?" + networkName);
      }
    })
  }


  $scope.isNavCollapsed = true
  //Basic view to include into  collapse menu
  $scope.viewToInclude = "views/add_element.html"
  $scope.graph_buttons = {
    add:"element-active",
      remove:"",
      edit:""
  };
  //DEFAULT addC active
  $scope.command_buttons = {
    collapsed:{class:"element-active", view:""},
    addC:{class:"", view:""},
    addN:{class:"", view:""},
    save:{class:"", view:""},
    load:{class:"", view:""}
  };

  /* END COMMAND OPTIONS */
  $scope.graphAction=   function graphAction(e)
  {
    var idElement = e.currentTarget.id
    switch(idElement) {
      case "addAction":
        $scope.graph_buttons.add="element-active"
        $scope.graph_buttons.remove=""
        $scope.graph_buttons.edit=""
        break

      case "delAction":
        $scope.graph_buttons.add=""
        $scope.graph_buttons.remove="element-active"
        $scope.graph_buttons.edit=""
        break

      case "editAction":
        $scope.graph_buttons.add=""
        $scope.graph_buttons.remove=""
        $scope.graph_buttons.edit="element-active"
        break
      default:
        $scope.graph_buttons.add="element-active"
        $scope.graph_buttons.remove=""
        $scope.graph_buttons.edit=""
        break
    }
  }


  $scope.commandAction = function commanAction(e)
  {
    var idElement = e.currentTarget.id
    if (! $scope.isAddContainer)
      Notification('Pls confirm or cancel the edit container operation on the bottom button first', 'warning');
    else {
      //Which button presseed ?
      switch(idElement) {
        case "collapsedButton" :
          $scope.command_buttons.collapsed.class="element-active"
          $scope.command_buttons.addC.class=""
          $scope.command_buttons.addN.class=""
          $scope.command_buttons.save.class=""
          $scope.command_buttons.load.class=""
          //new option view to show
          $scope.isNavCollapsed = true
          $scope.graph_buttons.add="element-active"
          $scope.graph_buttons.remove=""
          $scope.graph_buttons.edit=""
          break

        case "addContainer":
          $scope.command_buttons.collapsed.class=""
          $scope.command_buttons.addC.class="element-active"
          $scope.command_buttons.addN.class=""
          $scope.command_buttons.save.class=""
          $scope.command_buttons.load.class=""
          $scope.isNavCollapsed = false

          //new option view to show
          $scope.viewToInclude = "views/add_element.html"
          break

        case "addNetwork":
          $scope.command_buttons.collapsed.class=""
          $scope.command_buttons.addC.class=""
          $scope.command_buttons.addN.class="element-active"
          $scope.command_buttons.save.class=""
          $scope.command_buttons.load.class=""
          $scope.isNavCollapsed = false

          //new option view to show
          $scope.viewToInclude = "views/add_network.html"
          break

        case "saveLab":
          $scope.command_buttons.collapsed.class=""
          $scope.command_buttons.addC.class=""
          $scope.command_buttons.addN.class=""
          $scope.command_buttons.save.class="element-active"
          $scope.command_buttons.load.class=""
          $scope.isNavCollapsed = false


          //new option view to show
          $scope.viewToInclude = "savelab"
          break
        case "openLab":
          $scope.command_buttons.collapsed.class=""
          $scope.command_buttons.addC.class=""
          $scope.command_buttons.addN.class=""
          $scope.command_buttons.save.class=""
          $scope.command_buttons.load.class="element-active"
          $scope.isNavCollapsed = true
          //new option view to show
          $scope.viewToInclude = "openlab"
          break
        default:
          $scope.command_buttons.collapsed.class=""
          $scope.command_buttons.addC.class=""
          $scope.command_buttons.addN.class=""
          $scope.command_buttons.save.class=""
          $scope.command_buttons.load.class=""
          $scope.isNavCollapsed=true
          //new option view to show
          $scope.viewToInclude = "views/add_element.html"
          break
      }
    }
  }

  $scope.saveLab = function saveLab(xmlGraphModel) {
    //	console.log("info to save:")
    //	console.log($scope.containerListToDraw)
    //	console.log($scope.containerListNotToDraw)
    //	console.log($scope.networkList)
    //	console.log(gh.getGraphicJSON())
    dockerAPIService.saveLab($scope.labName,
      $scope.containerListToDraw,
      $scope.containerListNotToDraw,
      $scope.networkList,
      xmlGraphModel,
      //				gh.getGraphicJSON(),
      $scope.isComposeVisible
    )

      .then(function successCallback(response) {

        Notification({message:"Save success!"}, 'success');
        $scope.isCreated = true;
        $scope.yamlfile = response.data.data
        //Update yamlfile in interface
        var yamlcode = angular.element('#code_yaml')
        yamlcode.text($scope.yamlfile)
        Prism.highlightAll();
      },
        function errorCallback(response) {

          Notification("Sorry some error")
        })
  }

  $scope.exitLab = function exitLab() {
    var urlExit = "/lab/use/"+$scope.repoName+"/"+$scope.labName;
    // console.log(urlExit);
    $window.location.href="/lab/use/"+$scope.repoName+"/"+$scope.labName;

  }

  function canvasClick() {
    //Network empty
    //	if($scope.networkList.length == 0)
    //		infoService.updateNeedNetwork()
    if(Object.keys($scope.containerListNotToDraw).length == 0)
    {
      infoService.updateNeedCreateContainer()
      Notification({message:infoService.currentState.current_state.message}, 'error');


    }
    else if(!$scope.containerToDraw)
    {
      infoService.updateSelectContainer()
      Notification({message:infoService.currentState.current_state.message}, 'error');
    }
    //else infoService.updateOK()
  }
  /** END MENU COMMAND ACTIONS HANDLING ****/
  /** DIR MANAGMENT PATHS **/
  var currentFileToUpload = ''
  $scope.currentFileInContainer = { data:'/', afterAction:false}

  $scope.uploadFile = function() {
    if(currentFileToUpload && $scope.currentFileInContainer.data) {
      $scope.currentContainer.filesToCopy.push({filename:currentFileToUpload, containerPath : $scope.currentFileInContainer.data, afterAction:$scope.currentFileInContainer.afterAction})
    }
    else
    {
      Notification('Incorrect values ', 'error')


    }
  }

  $scope.deleteFile = function(index) { 
$scope.currentContainer.filesToCopy.splice( index, 1 )

  }
  $scope.tree_core = {

    multiple: false,  // disable multiple node selection

    check_callback: function (operation, node, node_parent, node_position, more) {
      console.log("In check callback")
      // operation can be 'create_node', 'rename_node', 'delete_node', 'move_node' or 'copy_node'
      // in case of 'rename_node' node_position is filled with the new node name

      if (operation === 'move_node') {
        return false;   // disallow all dnd operations
      }
      return true;  // allow all other operations
    }
  };

  //Directory selection
  $scope.nodeSelected = function(e, data) {
    var _l = data.node.li_attr;
    //Current file to upload selected by user
    $scope.$apply(function(){
      currentFileToUpload = _l.id.trim()
      console.log(_l.id)
    })
  }
  // Tab managment
  $scope.tabs = ['active', '', '', '', '', '', ''];
  $scope.elementTabChange = function (tabId) {
    for (i = 0; i < $scope.tabs.length; i++) {
      $scope.tabs[i] = 0;
    }
    $scope.tabs[tabId] = 'active';

  }
  /* END CONTROLLER  */
  $scope.goToImageRepository = function() {
    window.open('/images', '_blank');
  }
  $scope.editDockerfile = function(iName) {
    var dockerName = iName.replace(":latest", "");
    window.open('/dockerfile/' + dockerName, '_blank');
  }
  $scope.updateImages = function(p) {
    dockerAPIService.getDockerImages()
      .then(function successCallback(response) {
        var imageList = response.data.data
        $scope.imageList = imageList
        console.log(imageList)
        var image = _.findWhere(imageList,{name: p.name})
        containerManager.update(image)
        Notification("Images updated", 'success');

      }, function errorCallback(response) {
        Notification({message:"Sorry,  error in loading docker images"}, 'error');
      })
  }




  // COMPOSE MANAGEMENT
  $scope.uploadCompose = function() {
    var file = document.getElementById('composeFile').files[0];
    r = new FileReader();

    r.onloadend = function(e) {
      var data = e.target.result;
      var yamlObj = YAML.parse(data);
      var yamlcode = angular.element('#code_yaml')
      yamlcode.text(data)
      Prism.highlightAll();
      $scope.yamlfile = data;
      NetworkManagerService.parseYaml(yamlObj);
      // containerManager.parseYaml(yamlObj);
      //send your binary data via $http or $resource or do anything else with it
    }

    r.readAsBinaryString(file);
  }
  $scope.exportDockerCompose = function() {
    $scope.toJSON = $scope.yamlfile;
    var blob = new Blob([$scope.toJSON], { type:"application/json;charset=utf-8;" });
    var downloadLink = angular.element('<a></a>');
    downloadLink.attr('href',window.URL.createObjectURL(blob));
    downloadLink.attr('download', 'docker-compose.yml');
    downloadLink[0].click();
  };

  $scope.viewCompose = function() {
    safeApplyService.exec($scope, function() {
      $scope.showYamlFile = !$scope.showYamlFile;
      var closeNode = document.createTextNode("Close");
      var viewNode = document.createTextNode("View");
      var item = document.getElementById("view");
      item.childNodes[1].nodeValue == "Close" ?
        item.replaceChild(viewNode, item.childNodes[1])
        :
        item.replaceChild(closeNode, item.childNodes[1]) ;
    });
  }
  $scope.addCustomImage = function (nameContainer, dc="true") {
    var modalInstance = $uibModal.open({
      animation: true,
      component: 'dockerfileComponent',
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
  }

  $scope.restart = function() {
    $scope.isRestarting = true;
    $scope.active = 2;
    $scope.stop($scope.run);
  }

  // Docker actions
  $scope.run = function() {
            // namerepo : $scope.nameRepo,
            // namelab : $scope.labName,

    $scope.isRunning = true;
    // Set Log
    $scope.active = 2;
      //Send
      SocketService.manage(JSON.stringify({
        action : 'docker_up',
        params : {
          // namerepo : $scope.repoName,
          namelab : $scope.labName
        }
      }), function(event) {
        var data = JSON.parse(event.data);
        switch (data.status) {
          case 'success':
            Notification("Run finished!", 'success');
            $scope.isRunning = true;
            $scope.isRestarting = false;
            break;
          case 'error':
            Notification({message: data.message}, 'error');
            $scope.isRunning = false;
            $scope.isRestarting = false;
            break;
          default:
            $scope.log += data.message;
            break
          };
      });
    }

  $scope.stop = function(cb) {
    // Set active tab on log
    $scope.active = 2;
    SocketService.manage(JSON.stringify({
      action : 'docker_down',
      params : {
        namerepo : $scope.repoName,
        namelab : $scope.labName
      }
    }),
      function(event) {
        var data = JSON.parse(event.data);
        switch (data.status) {
          case 'success':
            Notification("Stoppe!", 'success');
            $scope.isRunning = false;
            $scope.log = "";
            if (cb) cb();
            break;
          case 'error':
            Notification({message: data.message}, 'error');
            $scope.isRunning = true;
            break;
          default:
            $scope.log += data.message;
            break
          };
      });
  }
}
