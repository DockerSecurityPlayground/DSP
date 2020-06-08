var dsp_WalkerService = function($log) {
  var self = this;
  self.repos;
  self.username; 
  self.currentLabName;

  self.init = function init(repos, username, version) {
    self.repos = repos;
    self.username = username;
    self.version = version
  }

  self.update = function(repos) {
    self.repos = repos;
  }

  self.repoNewLab = function(newLab) {
    var repoUser = self.getUserRepo()  
    if (!repoUser) {
      $log.error("repo not found!") 	
    }
    else {
      repoUser.labs.push(newLab)
    }
  }


  self.getRepo = function(nameRepo) {
    return _.findWhere(self.repos, {name:nameRepo})
  }


  self.getUserRepo = function() {
    return _.findWhere(self.repos, {name:self.username})
  }

  self.repoRemoveLab = function(nameLab) {
    var repoUser = self.getUserRepo() 
    if (!repoUser) {
      $log.error("repo not found!") 	
    } else { 
      //Find lab by name 
      var indexLab = _.findIndex(repoUser.labs, {name:nameLab}) 	
      if(indexLab === -1)  $log.error("lab not found!") 	
      else { 
      // Remove element from repoUser
      repoUser.labs.splice(indexLab, 1)
      }
    }	
  }

  self.repoChangeLab = function(oldName, newLab) {
    console.log(self.repos)
    //get repo user
    var repoUser = self.getUserRepo()
    if(!repoUser) {
    $log.error("repo not found!") 	
    }

    else { 
      //Find lab by name 
      var lab = _.findWhere(repoUser.labs, {name:oldName}) 	
      if(!lab)  $log.error("lab not found!") 	
      else { 
      console.log("OLD LAB:") 
      console.log(lab) 
      lab = _.extend(lab, newLab) 
      console.log("new lab:") 
      console.log(lab)  
      }

    }	
  } 


  self.findLab = function(repoName, labName) {

    var repo = self.getRepo(repoName);	
    var labs = repo.labs;
    return _.findWhere(labs, {name:labName})
  }

  self.removeLabelInLabs = function(labelname) {

    var userRepo = self.getUserRepo() 
    if(!userRepo) {
      $log.error("repo not found!") 					
    }
    else {
      var labs = userRepo.labs
      _.each(labs, function(l) {
        var labels = l.labels 	
        //find index of label with labelname 	
        var index = _.findIndex(labels, {name:labelname}) 
        //Ok it was defined in this lab
        if(index !== -1) 
        {
          //Remove label
          labels.splice(index, 1)
        }
      })
    }
  }


  self.updateLabelInLabs = function updateLabelInLabs(labelName, labelNew) {
    console.log("in updateLabel walker service") 
    console.log("labelname: "+labelName)
    var userRepo = self.getUserRepo() 
    if(!userRepo) {
      $log.error("repo not found!") 					
    }
    else {
      var labs = userRepo.labs
      _.each(labs, function(l) {
          var labels = l.labels 	
          console.log("labels:") 
          console.log(labels) 
          //find index of label with labelname 	
          var index = _.findIndex(labels, {name:labelName}) 
          //Ok it was defined in this lab
          if(index !== -1) 
          {
            $log.log("label found:")
            //Replace the label
            labels[index] = labelNew

          }
      })
    }
  }
}

