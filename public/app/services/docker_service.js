DockerAPIService : function DockerAPIService($log, $http, containerManager, Notification)
{

	var api = '/dsp_v1/docker_network/' ;
	var api_docker = '/dsp_v1/docker_images/' ;
	var dsp_images_docker = '/dsp_v1/dsp_images/' ;
        var url = 'http://' + location.host + '/';

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

    }
	}
}
