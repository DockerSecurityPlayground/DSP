var dsp_AjaxService= function($http, $q, $log, WalkerService, Notification, $location) {
  var name_repo= ''
  var apiUrl = "/dsp_v1/"
  var self = this
  
  self.config
  self.loaded = false
  self.projectLabels = { labels : [] }
  self.removeFromProjectLabels= function(name) {
    var i = _.findIndex(self.projectLabels.labels, {name:name})
    if(i !== -1)
            self.projectLabels.labels.splice(i, 1)
  }
  self.addToProjectLabels= function(label) {
      self.projectLabels.labels.push(label)
  }

  self.changeToProjectLabels= function(name, label) {
    var i = _.findIndex(self.projectLabels.labels, {name:name})
    if(i !== -1)
            self.projectLabels.labels[i] = label;
  }

  var dLabel = $q.defer()
  var dConfig = $q.defer();
  var dAll = $q.defer();
  /** LABELS **/
  //Load user labels
  function loadUserLabels() {
    //Load labels of user repo
    if(self.projectLabels.labels.length === 0)
    {
      $http.get(apiUrl+"labels/"+name_repo)
      .then(function successCallback(response) {
        self.projectLabels.labels = response.data.data.labels
        self.loaded = true
        dLabel.resolve() },
      function errorCallback(response) {
        console.log("Error in label service")
        console.log(response)
      })
    }
  }

self.configExists = function() {
  return (self.config !== undefined);

}

self.update = function() {

  $http.get(apiUrl+"all")
  .then(
    function successCallback(response) {
  
            console.log("Update AjaxService")
            console.log(response.data)
            WalkerService.update(response.data.data.repos)
    },
    function errorCallback(response) {
            console.log("Error in acquisition all")
            Notification('Server error:'+ response.data.message, 'error');
    })
}

self.init = function(onSuccess) {
  //Load user configuration
  if(!self.config) {
  console.log("to initiate config")
  //Get user configuration
  $http.get(apiUrl+"config")
  .then(
    function successCallback(response) {
            self.config = response.data.data.config
            console.log(self.config);
            name_repo = self.config.name
            dConfig.resolve(self.config)
            loadUserLabels()
            if(typeof onSuccess === 'function')
              onSuccess(self.config);
    },
            function errorCallback(response) {
                    console.log("Error in acquisition config")
                    console.log(response)
    })

  //Load the impossible
  $http.get(apiUrl+"all")
  .then(
    function successCallback(response) {

            console.log("corrected")
            console.log(response.data)
            dAll.resolve(response.data)
            //Repos
            WalkerService.init(response.data.data.repos, name_repo, response.data.data.version)
    },
    function errorCallback(response) {
            console.log("Error in acquisition all")
            Notification('Server error:'+ response.data.message, 'error');
    })
  } //End config

  return { dAll : dAll.promise, dConfig: dConfig.promise, dLabel: dLabel.promise}
}


  self.removeLabel = function(name) {
    //Only repo of username
    return $http.delete(apiUrl+"labels/"+self.config.name+"/"+name)
  }

  self.addLabel = function(l)  {
           return $http.post(apiUrl+"labels/"+ name_repo, {name: l.name, description: l.description, color:l.color})
  }

  self.editLabel = function(l, label, toEdit, finishCallback) {
    //Call put method
    return $http({
              method: "PUT",
              headers: { 'content-type': "application/json;charset=UTF-8"},
              url: apiUrl+"labels/"+name_repo,
              data: label
              })
  }

  self.updateConfig = function(newConfig) {
  //	if(file)
  //	{
  //	console.log("file is not null")
  //	return $http.post(apiUrl+"config", {avatar:file, config: newConfig})
  //	}
  //	else  {
  ////		console.log("file is null")
  ////		console.log(file)
      return $http.post(apiUrl+"config", {config: newConfig})
  }

  self.checkExistenceLab = function(reponame,labname) {
  var url = apiUrl+'docker_network/'+reponame+"/"+labname+'?exists=1';
  //alert(url)
          //Check creation
  return 	$http.get(url)
  }

  self.getUserLab = function(nameLab) {
   return $http.get(apiUrl+"userlab/"+nameLab)
  }
  self.getLabInfo = function(nameRepo, nameLab) {
    console.log("[+] AjaxService Get Lab Info");
   return $http.get(apiUrl+"labs/"+nameRepo + "/" + nameLab)
  }

  self.isReadOnlyLab = function(reponame, labname) {
    return $http.get(apiUrl + 'docker_network/is-imported/' + reponame + "/" + labname);
  }


  self.deleteLab = function(nameToDelete) {
   return $http.delete(apiUrl+"labs/"+nameToDelete)
  }
  self.newLab = function(l, labels) {

          return $http.post('/dsp_v1/labs/'+l.name,
                  {
                     informations:
                          { description : l.description,
                            goal : l.goal ,
                            solution : l.solution
                          },
                  //Selected labels
                     labels : labels
                  }
                  )

  }
  self.copyLab = function(labName) {
    return $http.post('/dsp_v1/labs/'+labName+'?wantToCopy=1');
  }

  self.editLab = function(lab, toEditName, labels) {
    var iToSend = {
    labels : labels,
    informations:  {
            description : lab.description || '',
            goal : lab.goal || '',
            solution : lab.solution || '',
            readme: lab.readme 
    },
    name: lab.name
    }
    //Call put method
    return $http({
            method: "PUT",
            headers: { 'content-type': "application/json;charset=UTF-8"},
            url: '/dsp_v1/labs/'+toEditName ,
            data: iToSend	})
  }

  self.importLab = function(repoName, labName) {
    return $http.post('/dsp_v1/all/', {
      repoName: repoName,
      labName : labName
      })

  }


  self.getProjects = function() {
      return $http.get(apiUrl+'git-repos');
  }
  self.removeProject = function(repo, repoUrl) {
      return $http.delete(apiUrl+'git-repos'+'/'+repo);
  }
  self.addProject = function(repoName, repoUrl) {
      return $http.post(apiUrl+'git-repos', {
        repoName: repoName,
        repoUrl: repoUrl
      });
  }
}


