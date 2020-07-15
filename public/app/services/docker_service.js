DockerAPIService : function DockerAPIService($log, $http, containerManager, Notification)
{
var api = '/dsp_v1/docker_network/' ;
	var api_docker = '/dsp_v1/docker_images/' ;
	var dsp_images_docker = '/dsp_v1/dsp_images/' ;
	var dsp_running_services = '/dsp_v1/services/' ;
	var dsp_dockerfile_service = '/dsp_v1/dockerfiles/' ;
  var dsp_hack_tools = '/dsp_v1/hack_tools';
  var dsp_service_network = '/dsp_v1/networkservices' ;
  var dsp_snippets_service = '/dsp_v1/snippets/';
  var url = 'http://' + location.host + '/';

  var i=0;

  const runButton = "<button type='button' class='btn btn-success'>Run</button>";

  const successStatus = "<b class='text-success'>Running </b>";
  const stoppedStatus = "<b class='text-warning'>Stopped </b>";
  const unknownStatus = "<b class='text-danger'>Unknown </b>";

  var listServices;

  function getServices() {
        return $http.get(dsp_running_services);
  }

  function _initServices(listServ) {
    listServices.length = 0;
    _.each(listServ, function(s) {
      var o = {}
      o.name = s.name;
      o.networks = s.networks;
      o.command = s.command;
      o.ports = s.ports;
      o.image = s.image;
      o.status = s.state;
      switch (s.state) {
        case "running" :
          o.state = successStatus;
          o.showRun = false;
          break;
        case "exited" :
          o.state = stoppedStatus;
          o.action = runButton;
          o.showRun = true;
          break;

        default :
          o.state = unknownStatus;
      }

      listServices.push(o)
    });
  }


	// Returns a stub rappresentation of images
	function stubImages()
	{
		return [
	{
	name: 'daindragon2/debian_networking',
	description: 'a Debian networking image',
	//exposedPorts : [22,80],
	icon: url+'assets/docker_image_icons/host.png' ,
	action: "NOT ALREADY IMPLEMENTED"
	},
	{
	name: 'daindragon2/debian_telnet',
	description: 'a Debian ftp server ',
	//exposedPorts : [21],
	icon: url+'assets/docker_image_icons/server.png',
	action: "NOT ALREADY IMPLEMENTED"

	},
	{
	name: 'daindragon2/debian_ftp',
	description: 'a Debian ftp server ',
	//exposedPorts : [21],
	icon: url+'assets/docker_image_icons/server.png',
	action: "NOT ALREADY IMPLEMENTED"

	}
		]

	};



	return {
    kaliService : {"isRun" : false},
    httpdService : {"isRun": false},
    browserService : {"isRun": false},
		saveLab:function saveLab(labName, cld, clnd, nl, graphJSON, icv) {
			var data = {
				networkList : nl,
				canvasJSON : graphJSON,
				clistToDraw : cld,
				clistNotToDraw : clnd,
                                isComposeVisible: icv
			}
			return $http.post(api+labName,
				data
				)

		},
    setServices : function setServices(arrayService) {
      listServices = arrayService;
    },
		useLab : function useLab(repoName,labName, isEdit, successCB) {
                        isEditing = (isEdit) ? 1 : 0;
                        sendReq = api+repoName+"/"+labName+"?isEditing="+isEditing
			$http.get(sendReq)
				.then(function successCallback(response) {
					successCB(response.data.data)
				},
					function errorCallback(response) {
						Notification({message:"Error loading lab!"}, 'error');
				})
		},
		loadGeneralLab: function loadLab(repoName, labName, isEdit, successCB) {
                        isEditing = (isEdit) ? 1 : 0;
                        sendReq = api+repoName + "/" + labName+"?isEditing="+isEditing
			$http.get(sendReq)
				.then(function successCallback(response) {
					successCB(response.data.data)
				},
					function errorCallback(response) {
						Notification({message:"Error loading lab!"}, 'error');
				})
		},
		loadLab : function loadLab(labName, isEdit, successCB) {
                        isEditing = (isEdit) ? 1 : 0;
                        sendReq = api+labName+"?isEditing="+isEditing
			$http.get(sendReq)
				.then(function successCallback(response) {
					successCB(response.data.data)
				},
					function errorCallback(response) {
						Notification({message:"Error loading lab!"}, 'error');
				})
		},
    getNetworkList : function getNetworkList(namerepo, namelab) {
      return $http.get(dsp_service_network+"/"+namerepo+"/"+namelab);
    },
		getDockerImages : function getDockerImages(completeDescription)
		{
			return $http.get(api_docker+"?completeDescription="+completeDescription);
			//return stubImages()
		},
    areImagesInstalled : function areImagesInstalled(repoName, labName) {
      return $http.get(dsp_images_docker + repoName + "/" + labName + "?checkInstallation=true")
    },
    getLabImages : function getLabImages(repoName, labName) {
      return $http.get(dsp_images_docker + repoName + "/" + labName)
    },
    getDSPImages : function getDSPImages() {
            return $http.get(dsp_images_docker)
    },
    getListHackTools : function getListHackTools(){
          return $http.get(dsp_hack_tools);
    },
    formatPullLog: function formatPullLog(json) {
   //  ss = JSON.parse(json);
   //  console.log(ss);
   //    if(ss.status == 'Pulling fs layer'){
   //      var obj = {'id': ss.id, 'percentage': 0};
   //      ids.push(obj);
   //      console.log(ids);
   //    }
   //    if(ss.status == 'Downloading'){
   //	  _.each(ids, function(element){
   //	    if(ss.id == element.id){
   //		  var normalized = (100 / ids.length);
   //		  element.percentage = ((ss.progressDetail.current * normalized) / ss.progressDetail.total);
   //		}
   //	  })
   //    }
   //	if(ss.status == 'Download complete'){
   //	  _.each(ids, function(element){
   //	    if(ss.id == element.id){
   //		  var normalized = (100 / ids.length)
   //		  element.percentage = normalized;
   //		}
   //	  })
   //	}
   //	_.each(ids,function(element){
   //	  ret += element.percentage;
   //	})
   //    return ret
      var retStr = ""
      splitted = json.split(/\r\n|\r|\n/)
      for (i = 0; i < splitted.length-1; i++) {
       s = splitted[i];
       ss = JSON.parse(s)
       if (!ss.progress)
         ss.progress=""
       const status = ss.status
       const progress = ss.progress
       const id = ss.id
       retStr = status + "\t" + progress +"\t" + id
       return retStr
       }
    },
    runService : function runService(container) {
      return $http.post(dsp_running_services+container.name, container)
    },
    stopService: function stopService(containerName) {
      return $http.put(dsp_running_services+"stop/"+containerName);
    },
    isWiresharkRun: function() {
      return $http.get(dsp_running_services+ "wireshark");
    },
    stopWireshark: function() {
      return $http.delete(dsp_running_services+ "wireshark");
    },
    isRun: function(serviceName) {
      return $http.get(dsp_running_services + serviceName);
    },
    updateManagedServices: function() {
      const self = this;
      self.isRun("kali")
        .then(function successCb(data) {
          self.kaliService.isRun = data.data.data.isRun;
        }, function errorCb() {
          Notification("Error in check kali status", 'error');
        })
      self.isRun("httpd")
        .then(function successCb(data) {
          self.httpdService.isRun = data.data.data.isRun;
        }, function errorCb() {
          Notification("Error in check httpd status", 'error');
        })
      self.isRun("browser")
        .then(function successCb(data) {
          console.log("IN LOG SERVICE")
          console.log(data.data);
          
          self.browserService.isRun = data.data.data.isRun;
        }, function errorCb() {
          Notification("Error in check browser status", 'error');
        })
    },
    stopHackTool: function(serviceName) {
      return $http.delete(dsp_running_services+ serviceName);
    },
    stopCapture: function() {
      return this.stopHackTool("tcpdump")
    },
    stopKali: function() {
      return this.stopHackTool("kali")
    },
    stopBrowser: function() {
      return this.stopHackTool("browser")
    },
    isBrowserRun: function() {
      return this.isRun("browser");
    },
    isKaliRun: function() {
      return this.isRun("kali")
    },
    isTcpdumpRun: function() {
      return this.isRun("tcpdump")
    },
    deleteHackTool: function(containerName) {
      return $http.delete(dsp_hack_tools + "/" + containerName);
    },
    deleteService: function deleteService(containerName) {
      return $http.delete(dsp_running_services+containerName);
    },
    deleteLocalService: function deleteLocalService(containerName) {
      listServices = _.without(listServices, _.findWhere(listServices, {
        name: containerName
      }));
      return listServices;
    },
    startService: function startService(containerName) {
      return $http.put(dsp_running_services+"start/"+containerName);
    },
    detachAllServices: function detachAllServices() {
      _.each(listServices, function(e) {
        e.networks = [];
      });
    },
    getServices :     getServices,
    initServices : function initServices(cb) {
      
      getServices()
        .then(function successCallback(response) {
          _initServices(response.data.data)
          cb(response.data.data);

        }, function errorCallback(error) {
          Notification({message:"Sorry,  error in loading docker services"}, 'error');
        });
    },
    serviceDefaultNetwork(containerName, networkName) {
      console.log(networkName);
      console.log("NETWORKNAME");
      return $http.post(dsp_running_services+"defaultnetwork/"+containerName, {
        networkname: networkName
      });
    },
    attachNetwork : function attachNetwork(c, n) {
      console.log("ATTACH SERVICE");
      var data = {
        networkname : n,
        servicename : c
      };
      return $http.post(dsp_service_network, data);
    },
    detachNetwork : function detachNetwork(c, n) {
      console.log("DETACH SERVICE");
      var data = {
        networkname : n,
        servicename : c
      };
      return $http.delete(dsp_service_network+ "?networkname="+n+"&servicename="+c, data);
    },
    deleteDockerFile : function deleteDockerFile(imageName) {
      return $http.delete(dsp_dockerfile_service + imageName)
    },
    // Dockerfile functions
    createDockerFile : function createDockerFile(imageName, type) {
      return $http.post(dsp_dockerfile_service + imageName, type);
    },

    getDockerfile : function getDockerfile(name) {
      return $http.get(dsp_dockerfile_service + name);
    },
    editDockerfile : function editDockerfile(data) {
      return $http(
        {url: dsp_dockerfile_service + data.name,
        method: 'PUT',
        data: data,
        headers: {
          'Content-Type' :  'application/json; charset=UTF-8'
        }
        });
    },
    getDockerFiles : function getDockerImages() {
      return $http.get(dsp_dockerfile_service);
    },

    getSnippets : function getSnippets() {
      return $http.get(dsp_snippets_service);
    }
	}
}
