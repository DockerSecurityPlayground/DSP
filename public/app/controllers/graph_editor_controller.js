DSP_GraphEditorController : function DSP_GraphEditorController(RegexService, $scope,$log, $http, $location, $window, NetworkManagerService,  portService, dockerAPIService, containerManager, infoService, Notification ) {


	$scope.labName= '';
	$scope.yamlfile='';
	const protoAddAction = 'New container',
		protoEditAction = 'Edit ';
	
	$scope.currentAction = protoAddAction;
	$scope.containerDescription; 


	//Regex 
	$scope.nameContainerRegex = RegexService.nameContainerRegex;

	//Param analysis
	var params = $location.search()
	console.log(params)
	if(params.namelab && params.nameRepo) 
	{
		$scope.repoName = params.nameRepo;
		$scope.labName= params.namelab;
		console.log('Received'+ $scope.nameRepo+ " "+ $scope.labName)
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
      if(params.action && (params.action==='edit' || params.action ==='new'))
      {
              if(params.action === 'edit') 
              {

              //When imageList it's loded load lab 
              dockerAPIService.loadLab($scope.repoName, $scope.labName, function(data) {
                              var canvasJSON = data.canvasJSON; 
                              gh.loadGraphicJSON(canvasJSON)
                              containerManager.loadContainers(data, {imageList : $scope.imageList})

                              var yamlcode = angular.element('#code_yaml')

                              yamlcode.text(data.yamlfile)
                              Prism.highlightAll();
                              $scope.yamlfile = data.yamlfile;	
                              if(data.networkList)
                                      NetworkManagerService.setNetworkList(data.networkList)		
                              $scope.networkList =  NetworkManagerService.getNetworks() 
                              })


              }
              else if(params.action === 'new') 
              {
              $scope.networkList =  NetworkManagerService.getNetworks() 
              }
      }
      //If params are not correct 
      else {
              redirectToMain() 
      }
},
    function errorCallback(response) {    
    Notification({message:"Sorry,  error in loading docker images"}, 'error');
    })	



	/** GRAPH INFOS **/
	var gh = GraphHandler()
	//Called when an element is drawed 
	var graphOkCallback = function graphOkCallback(currentToDraw) {

		containerManager.updateWhenToDraw(currentToDraw)
		//Reset containerDescription if currentToDraw equal to it
		if(currentToDraw=== $scope.containerDescription.name) 
		{
			console.log("DiStruzione in att")
			$scope.containerDescription = null
		}
		console.log(JSON.stringify($scope.containerListToDraw))
		//Delete current container drawer element , it cannot be more used 
		gh.setCurrent(null) 
		$scope.containerToDraw = null
			
		$scope.$apply(infoService.updateOK())


		
	}
	var graphErrorCallback = function graphErrorCallback(message) {

		$scope.$apply(canvasClick())

	}
	var graphDeleteCallback = function graphDeleteCallback(nameDeleted) {

		if(!nameDeleted)
			Notification({message:"Nothing to delete"}, 'error');
	    $scope.$apply(function() {
				containerManager.updateWhenNotToDraw(nameDeleted)
				})  
		console.log(nameDeleted)
	}
	
	gh.registerErrorCallback(graphErrorCallback)
	gh.registerOkCallback(graphOkCallback)
	gh.registerDeleteCallback(graphDeleteCallback)



	/************************** NETWORK INFO  **********************/
	//Current network view
	$scope.n = {
		name : "", subnet:"193.20.1.1/24", color:"black", 
			more_validation : "###"
	};
	$scope.subnet = { 
		first:"193",
		two:"20",
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


	$scope.deleteNetwork = function(name) {
		var containersName = containerManager.checkNetworkInToDraw(name)
		if(containersName)
			Notification({message:"Cannot delete an used network pls delete first the associated containers:"+containersName}, 'error'); 
		else {
			NetworkManagerService.removeNetwork(name)
			containerManager.deleteNetworkFromContainers(name)
			$scope.networkList = NetworkManagerService.getNetworks()	
		}
	};

	//Add a new network to list of networks
	$scope.addNetworkElement = function() {
		var s = $scope.subnet.first+"."+$scope.subnet.two+"."+$scope.subnet.three+"."+$scope.subnet.four
		console.log("three:") 
		console.log($scope.subnet.three) 
		//Increase the third cipher of form ip
		$scope.subnet.three =  (parseInt($scope.subnet.three)+1)%255
		 
		$scope.n.subnet = s
		var network = NetworkManagerService.newNetwork({name:$scope.n.name, subnet:$scope.n.subnet, color:$scope.n.color})
		
		$log.warn("TODO UPDATE OTHER")
		//Update subnet
		$log.warn("TODO UPDATE NAME")
		//Reset n 
		$scope.n.name = "" 
		//Update informations network of containers
		containerManager.newNetworkOccurred(network)
	};

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


		if(NetworkManagerService.hasNetwork(networkVal))
		{ 
			$scope.networkErrors.someError= true
			$scope.networkErrors.message="Network name already present"	
			//Disable form network with hidden field
			$scope.n.more_validation=""
		} 

		//Check subnet 
		else if(NetworkManagerService.hasSubnet(s))
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
          console.log('check '+v+' in '+exposedPorts);
          if(!_.contains(exposedPorts, v) && v != exposedPorts) {
            console.log('adding new');
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
		var found = containerManager.hasContainer() 
		console.log("found?"+found)

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

	$scope.editContainer = function editContainer() {
		//Add to current container infos about container list not drawed selected
	        $scope.optionalPorts = [];	
                $scope.optPort = { container: '', host: ''};

		var containerToEdit = _.findWhere($scope.containerListNotToDraw, {name: $scope.editContainerName});
		containerManager.setContainer($scope.currentContainer, containerToEdit);
		containerManager.resetCurrent($scope.imageList, $scope.networkList);
		$scope.isAddContainer = true;
		$scope.currentAction = protoAddAction;
		Notification({message: containerToEdit.name+ " modified!"}, 'success'); 
	}

	$scope.cancelEditContainer = function cancelEditContainer() {
		//Add 
                $scope.optPort = { container: '', host: ''};
                $scope.optionalPorts = [];
		containerManager.resetCurrent($scope.imageList, $scope.networkList)
		$scope.isAddContainer = true

	}

	// to update container list  when  submit clicked in form_add_container
	$scope.loadContainer = function loadContainer()
	{
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
	$scope.deleteContainer = function deleteContainer($index) {

		//Free networks
		var container=  $scope.containerListNotToDraw[$index]
		var networks = container.networks
                // IF is equl to removed container, delete selection 
                if ($scope.containerDescription === container) 
                  $scope.containerDescription = null;
		var checkedNetworks = _.where(networks, {isChecked:true})
			_.each(checkedNetworks, function(n) {
				NetworkManagerService.freeAddress(n.ip)
			})

		containerManager.deleteFromNotToDraw(container.name)
		//containerToDraw  
		if($scope.containerToDraw) 
			//if is selected must be deleted! 
			if($index === $scope.containerToDraw.name) 
			{
				gh.setCurrent(null)
				$scope.containerToDraw = null
			}

			
	}	

	$scope.checkNetworkClicked = function checkNewtorkClicked(nameNetwork, container) { 

		var isChecked = container.networks[nameNetwork].isChecked
		console.log("in checkNetwork")
		//If currentContainer network is unchecked , delete firstIP
			if(isChecked) 
			{

			console.log("sto occupando")
			var ip = NetworkManagerService.getFirst(nameNetwork)	
			container.networks[nameNetwork].ip = ip 
			container.networks[nameNetwork].position = 'right'
			NetworkManagerService.useAddress(ip)
			}
			//If isn't checked delete 
			else
			{	
				console.log("sto liberando")
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
				name:e.ip,
				color:n.color,
				position:e.position
			})
		}


		}) // End fill network list
		//Graph networkList : {name,color , position}
		if(eSelected) 	
		{
			console.log(eSelected)
			$scope.containerToDraw = {
				name : eSelected.name, 
				icon : eSelected.selectedImage.icon, 
				networkList : networkToDraw,
				ports : eSelected.ports

			}
			//UPDATE CONTAINER TO DRAW
			gh.setCurrent($scope.containerToDraw)	
			$scope.containerDescription = eSelected;	
		}

	}
	$scope.changeContainerIP = function changeContainerIP(e,c, networkName) {
		//Ip in option
		var ipSelected = e.currentTarget.value
		//Free ip used in form container
		console.log("in changeCOntainer")
		console.log(networkName)
	      var network = c.networks[networkName]
		//Only if it's defined free
		if(network && network.ip)
		{
			NetworkManagerService.freeAddress(network.ip)
			console.log("equality: "+network.ip === $scope.currentContainer.networks[networkName].ip)
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
		containerManager.addEnvironment() 

	}
	$scope.removeEnvironment = function() {
		containerManager.removeEnvironment()

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
                        console.log(i);
			var hasAction = (i.actions && !_.isEmpty(i.actions))
			return 	hasAction
		}
	else return false
	}	
        function setDefaultAction(image) {

          console.log(' in set default action');
          if($scope.imageHasActions(image)) 
          {
                  // Get action
                  $scope.selectedAction = image.actions[_.keys(image.actions)[0]]
                  console.log(' selectd action:');
                  console.log($scope.selectedAction);
                  $scope.defaultArgs($scope.selectedAction)
                  
          }
        }
	$scope.changedImage = function(image) {
          console.log('in changed image');
          console.log(image);
          //Every time delete actions form currentContainer 
          var oldActions = $scope.currentContainer.actions; 
          $scope.currentContainer.actions = [];
          $scope.currentContainer.ports = {};
          console.log('old actions:');
          console.log(oldActions);
          var imageActions = image.actions;
          // If contains the same action name copy in new image
          _.each(oldActions, function(act) {
            _.each(imageActions, function(ele, key) {
              if(act.name === key) {
                 var imageActionArgs = _.keys(ele.args);
                 var oldActionArgs = _.keys(act.args);
                 // Check all args are equal
                 if (_.isEqual(imageActionArgs, oldActionArgs)) {
                  console.log('action '+key+' will be copied!');
                  $scope.currentContainer.actions.push(act);
                 }
            }
              });
             
            });
            
          console.log('new actions:');
          console.log($scope.currentContainer.actions);
          // $scope.currentContainer.ports 
          //Set a selected image 
          setDefaultAction($scope.currentContainer.selectedImage);

	}
	//Set argument of action to default
	$scope.defaultArgs = function(action) {
          console.log('in default args:');
          console.log(action);
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
          console.log('IN ARGSS');
          console.log(args);
               // var rule = {
               //       email: true
               // };
               // var result = approve.value('userdomain.com', rule);
               // alert(result.approved);
		var allChecked = true;
		_.each(args, function(e, k) {
                    // If there is a rule
                    if(allChecked && e.rule)  {
                        console.log('Checking for rule');
                        console.log(e.rule);
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
	$scope.onClickEditContainer =  function(i) {
		$scope.isAddContainer = false;
	//	console.log($scope.containerListNotToDraw)
		//Eventually redirect to edit 


		var containerToEdit = $scope.containerListNotToDraw[i] ;
		$scope.editContainerName = containerToEdit.name;
               
                // It' the string EDIT LAB , no action of docker ! 
		$scope.currentAction = protoEditAction+ $scope.editContainerName;
                // Set the default
            
		//Update currentContainer

                
		containerManager.setContainer(containerToEdit, $scope.currentContainer);
                setDefaultAction($scope.currentContainer.selectedImage);
                // Load ports
                loadOptionalPorts($scope.currentContainer.ports, $scope.currentContainer.selectedImage);
		//Set actions
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
		$log.info("cliccato")
		switch(idElement) {
			case "addAction":
				$scope.graph_buttons.add="element-active"
				$scope.graph_buttons.remove=""
				$scope.graph_buttons.edit=""
				gh.setAddMode()
			break
				
			case "delAction": 
				$scope.graph_buttons.add=""
				$scope.graph_buttons.remove="element-active"
				$scope.graph_buttons.edit=""
				gh.setRemoveMode()
			break

			case "editAction": 
				$scope.graph_buttons.add=""
				$scope.graph_buttons.remove=""
				$scope.graph_buttons.edit="element-active"
				gh.setEditMode()
			break
			default:	
				$scope.graph_buttons.add="element-active"
				$scope.graph_buttons.remove=""
				$scope.graph_buttons.edit=""
				gh.setAddMode()
			break
		}
	}


	$scope.commandAction = function commanAction(e) 
	{
	$log.info("cliccato")
	var idElement = e.currentTarget.id
        if (! $scope.isAddContainer)
          Notification('Pls confirm or cancel the edit container operation on the bottom button first', 'warning');  
        else {
          //Which button presseed ? 
          switch(idElement) {
                  case "collapsedButton" : 
                          console.log("collapsed")
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
                          gh.setAddMode()
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

	$scope.saveLab = function saveLab() {
	//	console.log("info to save:") 
	//	console.log($scope.containerListToDraw) 
	//	console.log($scope.containerListNotToDraw) 
	//	console.log($scope.networkList) 
	//	console.log(gh.getGraphicJSON()) 
		dockerAPIService.saveLab($scope.labName, 
				$scope.containerListToDraw,
				$scope.containerListNotToDraw,
				$scope.networkList,
				gh.getGraphicJSON()
				)
			
					.then(function successCallback(response) {  

					Notification({message:"Save success!"}, 'success');
					$scope.yamlfile = response.data.data
					//Update yamlfile in interface
					var yamlcode = angular.element('#code_yaml')
					yamlcode.text($scope.yamlfile)
					Prism.highlightAll();
					},
						function errorCallback(response) {  
			
						Notification("Sorry some error") 
						console.log("error save") 
					})
	}	

	$scope.exitLab = function exitLab() {
		console.log("exit")
		$window.location.href="/lab/use/"+$scope.repoName+"/"+$scope.labName; 

	}

	function canvasClick() {
		//Network empty
		//	if($scope.networkList.length == 0)
		//		infoService.updateNeedNetwork()
			if(Object.keys($scope.containerListNotToDraw).length == 0)
			{
				infoService.updateNeedCreateContainer()
				console.log()
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
			console.log(currentFileToUpload) 
			console.log($scope.currentFileInContainer.data)
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
	$scope.nodeSelected = function(e, data){
var _l = data.node.li_attr;
//Current file to upload selected by user
	$scope.$apply(function(){
		currentFileToUpload = _l.id.trim()
		console.log(_l.id)
	})



}
	
  } /* END CONTROLLER  */ 



