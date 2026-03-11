function dsp_ContainerManagerService() {

var currentContainer = {
		name : "",
		selectedImage : null,
		networks : { }, // ip, position , isChecked -> ng-model form add_container
		actions  : [],
    scale : {
      isEnabled : false,
      num : 1
    },
		environments : [],
		some_network_selected:false,
		volumes : [],
		filesToCopy : [],
                isShellEnabled: true,
                keepAlive: false
	}

var containerToDraw = null

//The list of possible contaier choices to draw
var clnd =  []
//var clnd =  {}
//The list already created
var cld = []
//var cld = {}

function init(imageList)
{
	currentContainer.selectedImage  = imageList[0]

}

function update(image)
{
	currentContainer.selectedImage = image;
}

function setContainer(container, dest) {
		 angular.copy(container, dest)
		dest.selectedImage =container.selectedImage
		var env = []
		_.each(container.environments, function(e)
		{
			if(e.name && e.value && e.name !== '' && e.value !== '')
			{
				env.push(e)
			}
		})
		dest.environments = env
}
function resetCurrent(imageList, networkList)
{
	//var c = c || $scope.currentContainer
	//Zero name
	currentContainer.name=""
	currentContainer.ports = {}
	currentContainer.environments = []
	currentContainer.actions = []
	currentContainer.volumes = []
  currentContainer.scale = {
    isEnabled : false,
    num : 1
  };
	currentContainer.filesToCopy = []
        currentContainer.isShellEnabled = true
	currentContainer.keepAlive = false

	//Zero select image
	currentContainer.selectedImage = imageList[0]
	console.log(currentContainer)
	networkList.forEach(function(e,i) {
		//get first ip
	//	var firstIP = e.listIP[0]
	//	console.log("sono in loop")
	//	console.log(firstIP)
	//	console.log(currentContainer.networks[e.subnet])
		//Add a network ip , isChecked = false, position right
		currentContainer.networks[e.name] = {
			//First subnet
			ip :  "",
			isChecked : false,
			position : 'right'
		}

	})

}


function addToNotToDraw(n) {
	var s = n.name
	clnd.push(n)
}
function addToDraw(n) {
	//cld[n.name]  = n
	cld.push(n)

}
function deleteObj(arr, n)
{

	var ele = _.where(arr, {name : n })[0]
	if(ele)
	{
		var i = _.indexOf(arr, ele)
		//Remove element
		arr.splice(i,1)
	}


}
function shift(arr_one, arr_two, n)
{
	console.log("name : "+n)
	//console.log(arr_one)
	var element = _.where(arr_one, {name:n})[0]
	//find element
	if(!element)
	// if not found throw exception
	throw new Error("Not found in containerManager")
	//var string = JSON.parse(JSON.stringify(arr_one))
	//Insert into arr-two
	arr_two.push(element)
	//console.log("arr two: "+JSON.stringify(arr_two))
	var i =_.indexOf(arr_one,element)
	//Delete element
	arr_one.splice(i, 1)

}


//	$scope.checkbox_network_container= function checkbox_network_container() {
//		var ns = $scope.currentContainer.networks
//		var nobodyChecked = true
//		Object.keys(ns).forEach(function(k) {
//		//If someone is checked have to check
//		if(ns[k].isChecked)
//		{
//			nobodyChecked = false
//			return
//		}
//		})
//		$scope.currentContainer.some_network_selected = !nobodyChecked
//
//
//	}
//

return {

	/** VARS **/
	currentContainer : currentContainer,
	containerListNotToDraw : clnd,
	containerListToDraw : cld,
	containerToDraw : containerToDraw,

	/** METHODS **/
	init : init,
	loadContainers : function loadContainers(data, contextData) {
		var imageList = contextData.imageList;
		var clistToDraw = data.clistToDraw || [],
		    clistNotToDraw = data.clistNotToDraw || []
		var composeServices = {};
		if (data.yamlfile) {
			try {
				var parsedCompose = YAML.parse(data.yamlfile) || {};
				composeServices = parsedCompose.services || {};
			} catch (e) {
				composeServices = {};
			}
		}

		function resolveImage(ele) {
			var selectedImageName = ele && ele.selectedImage && ele.selectedImage.name;
			if (!selectedImageName && ele && ele.name && composeServices[ele.name] && composeServices[ele.name].image) {
				selectedImageName = composeServices[ele.name].image;
				ele.selectedImage = ele.selectedImage || {};
				ele.selectedImage.name = selectedImageName;
			}
			if (!selectedImageName) {
				return imageList && imageList.length ? imageList[0] : null;
			}
			var imageSelected = _.findWhere(imageList, {name: selectedImageName});
			if (!imageSelected && selectedImageName.indexOf(':') !== -1) {
				imageSelected = _.findWhere(imageList, {name: selectedImageName.split(':')[0]});
			}
			return imageSelected || (imageList && imageList.length ? imageList[0] : null);
		}

		function isKeepAliveService(serviceDef) {
			if (!serviceDef || !serviceDef.entrypoint) {
				return false;
			}

			var entrypoint = serviceDef.entrypoint;
			if (typeof entrypoint === 'string') {
				return entrypoint.indexOf('tail') !== -1 && entrypoint.indexOf('/dev/null') !== -1;
			}

			if (Array.isArray(entrypoint)) {
				return entrypoint.join(' ').indexOf('tail -f /dev/null') !== -1;
			}

			return false;
		}

		function parseComposePorts(serviceDef) {
			var ports = {};
			_.each((serviceDef && serviceDef.ports) || [], function(portDef) {
				if (typeof portDef === 'number') {
					ports[String(portDef)] = String(portDef);
					return;
				}

				if (portDef && typeof portDef === 'object') {
					if (portDef.target != null && portDef.published != null) {
						ports[String(portDef.target)] = String(portDef.published);
					}
					return;
				}

				if (typeof portDef !== 'string') {
					return;
				}

				var sanitized = portDef.split('/')[0];
				var parts = sanitized.split(':');
				if (parts.length === 1) {
					ports[parts[0]] = parts[0];
					return;
				}

				var containerPort = parts[parts.length - 1];
				var hostPort = parts[parts.length - 2];
				ports[String(containerPort)] = String(hostPort);
			});
			return ports;
		}

		function parseComposeDependencies(definition) {
			var dependencies = {};
			if (Array.isArray(definition)) {
				_.each(definition, function(name) {
					dependencies[name] = true;
				});
				return dependencies;
			}

			_.each(definition || {}, function(value, name) {
				if (value === false) {
					return;
				}
				dependencies[name] = true;
			});
			return dependencies;
		}

		function parseComposeNetworks(serviceDef) {
			var networks = {};
			var serviceNetworks = serviceDef && serviceDef.networks;

			if (Array.isArray(serviceNetworks)) {
				_.each(serviceNetworks, function(networkName) {
					networks[networkName] = {
						ip: '',
						isChecked: true,
						position: 'right',
						isVisible: true,
						isDynamic: true
					};
				});
				return networks;
			}

			_.each(serviceNetworks || {}, function(networkDef, networkName) {
				var staticIp = networkDef && networkDef.ipv4_address ? networkDef.ipv4_address : '';
				networks[networkName] = {
					ip: staticIp,
					isChecked: true,
					position: 'right',
					isVisible: true,
					isDynamic: !staticIp
				};
			});

			return networks;
		}

		function parseComposeVolumes(serviceDef) {
			var volumes = [];
			_.each((serviceDef && serviceDef.volumes) || [], function(volumeDef) {
				if (typeof volumeDef === 'string') {
					var parts = volumeDef.split(':');
					if (parts.length >= 2) {
						volumes.push({
							host: parts[0],
							container: parts[1]
						});
					}
					return;
				}

				if (volumeDef && typeof volumeDef === 'object' && volumeDef.source && volumeDef.target) {
					volumes.push({
						host: volumeDef.source,
						container: volumeDef.target
					});
				}
			});
			return volumes;
		}

		function parseComposeEnvironments(serviceDef) {
			var environments = [];
			var serviceEnvironment = serviceDef && (serviceDef.environment || serviceDef.environments);

			if (Array.isArray(serviceEnvironment)) {
				_.each(serviceEnvironment, function(envDef) {
					if (typeof envDef === 'string') {
						var separatorIndex = envDef.indexOf('=');
						if (separatorIndex !== -1) {
							environments.push({
								name: envDef.substring(0, separatorIndex),
								value: envDef.substring(separatorIndex + 1)
							});
						} else if (envDef) {
							environments.push({name: envDef, value: ''});
						}
						return;
					}

					if (envDef && typeof envDef === 'object') {
						_.each(envDef, function(value, key) {
							environments.push({name: key, value: value == null ? '' : String(value)});
						});
					}
				});
				return environments;
			}

			_.each(serviceEnvironment || {}, function(value, key) {
				environments.push({name: key, value: value == null ? '' : String(value)});
			});

			return environments;
		}

		function hydrateFromCompose(ele) {
			if (!ele || !ele.name || !composeServices[ele.name]) {
				return;
			}

			var serviceDef = composeServices[ele.name];
			if (!ele.dependsOn || _.isEmpty(ele.dependsOn)) {
				ele.dependsOn = parseComposeDependencies(serviceDef && serviceDef.depends_on);
			}
			if (!ele.links || _.isEmpty(ele.links)) {
				ele.links = parseComposeDependencies(serviceDef && serviceDef.links);
			}
			if (!ele.networks || _.isEmpty(ele.networks)) {
				ele.networks = parseComposeNetworks(serviceDef);
			}
			if (!ele.ports || _.isEmpty(ele.ports)) {
				ele.ports = parseComposePorts(serviceDef);
			}
			if (!ele.volumes || _.isEmpty(ele.volumes)) {
				ele.volumes = parseComposeVolumes(serviceDef);
			}
			if (!ele.environments || _.isEmpty(ele.environments)) {
				ele.environments = parseComposeEnvironments(serviceDef);
			}
		}

		// Imported compose projects can contain services that are not mirrored yet in clist arrays.
		// Ensure they are available in the graph editor instead of silently disappearing.
		var listedServices = {};
		_.each(clistToDraw, function(ele) {
			if (ele && ele.name) {
				listedServices[ele.name] = true;
			}
		});
		_.each(clistNotToDraw, function(ele) {
			if (ele && ele.name) {
				listedServices[ele.name] = true;
			}
		});

		_.each(composeServices, function(serviceDef, serviceName) {
			if (listedServices[serviceName]) {
				return;
			}

			var synthesizedService = {
				name: serviceName,
				actions: [],
				dependsOn: parseComposeDependencies(serviceDef && serviceDef.depends_on),
				links: parseComposeDependencies(serviceDef && serviceDef.links),
				networks: parseComposeNetworks(serviceDef),
				ports: parseComposePorts(serviceDef),
				volumes: parseComposeVolumes(serviceDef),
				filesToCopy: [],
				environments: parseComposeEnvironments(serviceDef),
				isShellEnabled: true,
				keepAlive: isKeepAliveService(serviceDef),
				selectedImage: {
					name: serviceDef && serviceDef.image ? serviceDef.image : ''
				}
			};

			clistToDraw.push(synthesizedService);
		});

		_.each(clistNotToDraw, function(ele) {
			hydrateFromCompose(ele);
			ele.selectedImage = resolveImage(ele);
			if (typeof ele.keepAlive === 'undefined') {
				ele.keepAlive = false;
			}
			clnd.push(ele)
		})

		_.each(clistToDraw, function(ele) {
			hydrateFromCompose(ele);
			ele.selectedImage = resolveImage(ele);
			if (typeof ele.keepAlive === 'undefined') {
				ele.keepAlive = false;
			}
		   cld.push(ele)
		})
	},
	addToDraw : addToDraw,   //function addToToDraw(n)
	addToNotToDraw : addToNotToDraw,
	deleteFromNotToDraw : function deleteFromNotToDraw(name) {
		deleteObj(clnd, name)
	},
	deleteFromToDraw : function deleteFromToDraw(name) {
		deleteObj(cld, name)
	},
	resetCurrent, resetCurrent ,
	sizeToDraw : function sizeToDraw() {
	return cld.length
	} ,
	sizeNotToDraw : function sizeNotToDraw() {
		var size = clnd.length
		return size
	},
	update: update,
	newNetworkOccurred : function newNetworkOccurred(n) {

	//update networkList of currentContainer
	this.currentContainer.networks[n.name] = {
		ip: n.listIP[0] , //The first ip,
		isChecked: false,
		position : 'right'
	}

	_.each(clnd, function(e) {
		//only if it's not defined
		if(!e.networks)
			e.networks[n.name] = {
				ip: n.listIP[0] , //The first ip,
				isChecked: false,
				position : 'right'
		}
	})


	},
	addEnvironment: function newEnvironment(name, value) {
		currentContainer.environments.push({name, value})
	},
	removeEnvironment: function removeEnvironment(key) {
    currentContainer.environments.splice(key, 1);
		// var length = currentContainer.environments.length
		// if(length > 0)
		// 	currentContainer.environments.splice(length-1, 1)
	},
	deleteNetworkFromContainers : function(name) { 

			_.each(clnd, function(ele) {
				var ns = ele.networks
				if(_.has(ns, name) )
				{
					delete ns[name]
				}
			})


	},
	//Returns a string of container names associated with the network, null if no
	//containers are associated
	checkNetworkInToDraw: function checkNetworkInToDraw(name) {
			var ret = []
			_.each(clnd, function(ele) {
				var ns = (ele.networks) ? ele.networks : {};
				console.log(ns)
				if(_.has(ns, name) && ns[name].isChecked)
				{
					ret.push(ele.name)
				}
			})
			_.each(cld, function(ele) {
				var ns = (ele.networks) ? ele.networks : {};
				console.log(ns)
				if(_.has(ns, name) && ns[name].isChecked)
				{
					ret.push(ele.name)
				}
			})
			if (_.isEmpty(ret)) return null
			else return JSON.stringify(ret)
	},
	setContainer : setContainer,
	updateWhenNotToDraw : function updateWhenNotToDraw (n)  {  shift(cld, clnd, n)  },
	//Move a contaienr from list not drawed to list drawed
	updateWhenToDraw : function updateWhenToDraw(n)  { shift( clnd,cld, n) },
	//Return true if currentContainer.name === some container in lists
	hasContainer () {
		var found = false
		_.each(this.containerListNotToDraw, function(e) {
			if(e.name === currentContainer.name)
				found = true
		})

		_.each(this.containerListToDraw, function(e) {
			if(e.name === currentContainer.name)
				found = true
		})

		return found
    },
  getContainer : function getContainer(e) {
      return _.findWhere(cld, {name: e});
   },
  parseYaml : function parseYaml(yamlFile) {
    console.log(this.containerListToDraw);
    var newContainerList = [];
    // Take services
    _.each(yamlFile.services, function(s, id) {
      var newService = {}
      newService.actions = []
      newService.dependsOn = {}
      newService.links = {}
      newService.networks = {}
      newService.ports = {}
      newService.volumes = []
      newService.name = id;
      // newService.selectedImage = s.image;
      _.each(s.links, function(l) {
        newService.links[l] = true
      })
      _.each(s.depends_on, function(l) {
        newService.dependsOn[l] = true
      })
      // var name = s.
    });
  }
  } //End return
}
