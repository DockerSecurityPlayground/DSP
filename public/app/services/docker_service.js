DockerAPIService : function DockerAPIService($log, $http, containerManager, Notification)
{
var api = '/dsp_v1/docker_network/' ;
	var api_docker = '/dsp_v1/docker_images/' ;
	var dsp_images_docker = '/dsp_v1/dsp_images/' ;
	var dsp_running_services = '/dsp_v1/services/' ;
	var dsp_service_network = '/dsp_v1/networkservices' ;
  var url = 'http://' + location.host + '/';

  const successStatus = "<b class='text-success'>Running </b>";
  const stoppedStatus = "<b class='text-warning'>Stopped </b>";
  const unknownStatus = "<b class='text-danger'>Unknown </b>";

  var listServices;

  function getRunningServices() {
        return $http.get(dsp_running_services);
  }

  function _initServices(listServ) {
    listServices.length = 0;
    console.log(listServ);
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
		loadLab : function loadLab(repoName,labName, isEdit, successCB) {
                        isEditing = (isEdit) ? 1 : 0;
                        sendReq = api+repoName+"/"+labName+"?isEditing="+isEditing
			$http.get(sendReq)
				.then(function successCallback(response) {
					successCB(response.data.data)
					console.log(response.data.data)
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
    getDSPImages : function getDSPImages() {
            return $http.get(dsp_images_docker)
    },
    formatPullLog: function formatPullLog(json) {
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
    getRunningServices :     getRunningServices,
    initServices : function initServices() {
      getRunningServices()
        .then(function successCallback(response) {
          console.log("RUNNING SERVICES");
          _initServices(response.data.data)

        }, function errorCallback(error) {
          Notification({message:"Sorry,  error in loading docker services"}, 'error');
        });
    },
    serviceDefaultNetwork(containerName, networkName) {
      return $http.put(dsp_running_services+"defaultnetwork/"+containerName, {
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
    }
	}
}
