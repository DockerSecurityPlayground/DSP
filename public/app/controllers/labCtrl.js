var dsp_LabCtrl = function($scope, ServerResponse, dockerAPIService, $routeParams, $sce, SafeApply, $document, $uibModal, $location, $http, CurrentLabService, CleanerService, BreadCrumbs, AjaxService, $sce, WalkerService, Notification) {
var userDir;
var vm = this;
var buttonDeleteProto = { action:openConfirmDelete, label:"Delete Lab" , class: "btn btn-danger"}
var buttonImportProto = { action:importLab, label:"Import lab in your repo" , class: "btn btn-success"}
var buttonGoProto = { action:goToUseNetwork, label : "Go", class: "btn btn-lg btn-blue"}
var buttonGoDisabledProto = {action:goToUseNetwork, label: "Go", class: "btn btn-lg btn-blue disabled"}
var buttonGoImage = { action:goToImages, label : "Images", class: "btn btn-lg btn-blue"}
var buttonCreateProto = { action:goToCreateNetwork, label:"Create Docker Network" , class: "btn  btn-lg btn-success"}


$scope.tinymceOptions = {
  onChange: function(e) {
  // put logic here for keypress and cut/paste changes
  },
  inline: false,
  plugins : 'advlist autolink link image lists charmap print preview',
  skin: 'lightgray',
  theme : 'modern'
};

vm.tinymceHtmlGoal=''
vm.tinymceHtmlSolution=''
//Button action create or go
vm.buttonAction = buttonCreateProto
//Button action import or delete
vm.deleteImportButton = buttonDeleteProto
vm.editVisible = false
vm.repos,
vm.lab = {} ,
vm.labels=[],
// Preview on the labs
vm.previewSolution = '';
vm.previewGoal = '';
vm.isRunning;
vm.isGoalEditShowed = true;
vm.isSolutionEditShowed = true;
vm.isSolutionPreviewOpen = false;
vm.isGoalPreviewOpen= false;
vm.noImages = false;
vm.actionVisible = true,
toEditName = ''	;
AjaxService.init()
  .dLabel
  .then(function(res) {
    vm.labelProjects = AjaxService.projectLabels.labels
  },
  function(err) {

  })

var action = $routeParams.action ;
if(action === 'new') {
  //		console.log("action new")
  $scope.lab_action_btn = { text : "Create", class:"btn btn-success" }
  $scope.lab_action = 'New lab '
  BreadCrumbs.breadCrumbs('/lab/new')
  $scope.lab_action_form = 'newlab'
}
else if (action === 'edit') {

  //BreadCrumbs.breadCrumbs('/lab/edit/$routeParams.namelab')
  $scope.lab_action_btn = { text : "Edit", class:"btn btn-warning" }
  $scope.lab_action = 'Edit '+ $routeParams.namelab;
  $scope.lab_action_form = 'editlab'
  //Update in edit breadcrumbs
  BreadCrumbs.breadCrumbs('/lab/edit', $routeParams.namelab);
  AjaxService.init()
  .dAll
  .then(function(res) {
    //User can only edit his labs (repo= username)
    vm.repos = WalkerService.repos
    userDir = AjaxService.config.name;
    var labname = $routeParams.namelab;
    var repo=  WalkerService.getUserRepo();

    if(repo) {
      var lab =  WalkerService.findLab(repo.name, $routeParams.nameLab);
      CurrentLabService.updateLab(lab);
      //User labs repos
      var labs = repo.labs
      if(labs) {
      var labToUse = _.findWhere(labs, {name:labname})
      if(labToUse) {
        toEditName = labToUse.name
        vm.lab.name= labToUse.name;
        vm.lab.description = labToUse.informations.description;
        //vm.lab.goal = CleanerService.parse(labToUse.informations.goal);
        vm.lab.goal = labToUse.informations.goal;
        vm.lab.solution = labToUse.informations.solution;
        vm.previewSolution = vm.lab.solution;
        vm.previewGoal = vm.lab.goal;
        vm.updatePreviewSolution();
        vm.updatePreviewGoal();
        vm.labels = labToUse.labels || []
        }
      }
    }
  },
  function(err) {

  })
}
//Use
else if (action ==='use') {
  vm.buttonAction = '';
  BreadCrumbs.breadCrumbs('/lab/use', $routeParams.namelab);
  AjaxService.init()
  .dAll
  .then(function(res) {
  vm.repos = WalkerService.repos
  var labname = $routeParams.namelab
  var rname = $routeParams.repo;
  var username = AjaxService.config.name;
  CurrentLabService.updateLab(rname, labname);
 //  AjaxService.checkExistenceLab(rname, labname)
 //        .then(function successCallback(response) {
 //          var exists = response.data.data
/// /					console.log("EXISTS?")
/// /					console.log(exists)
 //          //If doesn't exists create new network button
 //          if(!exists)  {
 //            vm.buttonAction = buttonCreateProto
 //            vm.editVisible = false
 //          }
 //          //Else go button
 //          else	{
 //            vm.buttonAction = buttonGoProto
 //            vm.editVisible = true
 //          }
 //        },
 //        function errorCallback(response) {

 //        })
//If username = repo name it's the user repo and it' possible to edit
if(username === rname)
{
      vm.actionVisible= true;
      vm.deleteImportButton = buttonDeleteProto;
}
//Don't edit if it's not a user repo
else
{
      vm.actionVisible = false;
      vm.deleteImportButton = buttonImportProto;
}
var repo = _.findWhere(vm.repos, {name:rname})
var labs = repo.labs
if(labs)
{
var labToUse = _.findWhere(labs, {name:labname})
if(labToUse) {
    vm.isRunning = labToUse.state === 'RUNNING' ? true : false;
    // Repo name
    vm.repoName = rname
    vm.lab.name= labToUse.name;
    // Check the state
    if(labToUse.state === 'NO_NETWORK') {
      vm.buttonAction = buttonCreateProto
      vm.editVisible = false
    }
    // Else go button or images
    else {
      vm.buttonAction = buttonGoProto
      vm.editVisible = true
    }

    if(labToUse.informations) {
      vm.lab.description = labToUse.informations.description;
      //vm.lab.goal = labToUse.informations.goal;
      vm.lab.goal = CleanerService.parse(labToUse.informations.goal);
      vm.lab.solution = CleanerService.parse(labToUse.informations.solution);
      vm.tinymceHtmlGoal= $sce.trustAsHtml(vm.lab.goal);
      vm.tinymceHtmlSolution = $sce.trustAsHtml(vm.lab.solution);

    }
    else {
      vm.lab.description = '';
      vm.lab.goal = '';
      vm.lab.solution = '';
      vm.tinymceHtmlGoal= '';
      vm.tinymceHtmlSolution = '';
    }
  }
  dockerAPIService.getDSPImages()
    .then(function successCallback(response) {
    var images = response.data.data.images;
    labsImages = images[repo.name].lab_images
    labImages = _.findWhere(labsImages, {nameLab:labToUse.name})
    console.log(repo)
    console.log(labToUse)
    console.log(labImages);
    var imagesToInstall = _.where(labImages.images, {contains:false});
    console.log(imagesToInstall);

    if(imagesToInstall.length > 0) {
      vm.noImages = true;
      vm.buttonAction = buttonGoDisabledProto;
    }
      //Notification({message: "Some images are not installed. Go to the Image Manager"},'error');
    },
    function errorCallback(error) {
      Notification({message:"Sorry,  error in loading docker images"}, 'error');
    });
}
},
function(err) {

})

}
vm.copyLab = function copyLab() {
  AjaxService.copyLab(vm.lab.name)
  .then(function successCallback(response) {
    Notification('Lab copied!', 'success');
    var newLabName = response.data.data;
    var urlToGo = '/lab/use/'+ vm.repoName+'/'+ newLabName;
    window.location.href= urlToGo;

  },
    function errorCallback(resp) {
    Notification('Server error:'+ resp.data.message, 'error');
  });

}

vm.labAction = function labAction() {
  var l = vm.lab ;
  //New lab
  if($scope.lab_action_form === 'newlab')
  {
    AjaxService.newLab(l, vm.labels)
    .then(function successCallback(response) {
      window.location.href='/labs';
//    SafeApply.exec($scope, function() {
//      WalkerService.repoNewLab({
//        name:l.name,
//        informations: {
//          description: l.description,
//          goal : l.goal,
//          solution : l.solution
//        },
//        state: 'NO_NETWORK',
//        labels:[]
//    });
//    vm.repos = WalkerService.repos;
//  });
//  $location.url('/labs')

},

function errorCallback(response) {
Notification('Server error:'+ response.data.message, 'error');

});

}
//Edit lab
else if($scope.lab_action_form === 'editlab') {
  AjaxService.editLab(vm.lab, toEditName, vm.labels)
    .then(function successCallback(response) {

          //Update walk object
          WalkerService.repoChangeLab(toEditName, {
          //Lab object
          name: vm.lab.name,
          informations : {
                  description : vm.lab.description || '',
                  goal : vm.lab.goal || '',
                  solution : vm.lab.solution || ''
          },
          labels:vm.labels
          })

          //Redirect to usage
          var urlRet = '/lab/use/'+AjaxService.config.name+"/"+vm.lab.name;
          $location.url(urlRet)
      },
      function errorCallback(response) {
              Notification('Server error:'+ response.data.message, 'error');
      })
    }
}



function goToCreateNetwork() {
window.location.href='docker_graph_editor.html?nameRepo='+ vm.repoName +'&namelab='+vm.lab.name+'&action=new'
}

function goToImages() {
  window.location.href='images.html'
}

function goToUseNetwork() {

window.location.href='docker_graph_action.html?nameRepo='+ vm.repoName +'&namelab='+vm.lab.name+'&reponame='+vm.repoName

}
vm.goToEditNetwork = function goToEditNetwork() {
 $location.url('/lab/edit/'+vm.lab.name);
}
vm.goToNetwork = function goToNetwork() {

  if (vm.isRunning)
    Notification('Cannot edit a running lab! Pls stop first', 'warning');
  else window.location.href='docker_graph_editor.html?nameRepo='+ vm.repoName+ '&namelab=' + vm.lab.name + '&action=edit';

}

function openConfirmDelete() {
  if (vm.isRunning)
    Notification('Cannot delete a running lab! Pls stop first', 'warning');
  else {
    var modalInstance = $uibModal.open({
      component: 'modalComponent',
      resolve: {
      lab: function () {
        return vm.lab;
        }
      }
    });
    //Cancel lab
    modalInstance.result.then(function () {
      var nameToDelete = vm.lab.name;
      AjaxService.deleteLab(nameToDelete)
          .then(function successCallback(response) {
              //Remove from ajaxRepos
              SafeApply.exec($scope, function() {
                WalkerService.repoRemoveLab(nameToDelete)
                vm.repos = WalkerService.repos;
              });
              //Return to labs
              $location.url('/labs')
          },function errorCallback(response) {});
      }, function() {});
  }
}

function importLab() {
  AjaxService.importLab(vm.repoName, vm.lab.name)
  .then(
  function successCallback(response) {
    Notification('Lab imported!', 'success');
    SafeApply.exec($scope, function() { WalkerService.repoNewLab(vm.lab); });
  },
  function errorCallback(resp) {
    Notification('Server error:'+ resp.data.message, 'error');
}
);


}
//Managment of tinyMCE area
vm.updatePreviewSolution = function() {
   vm.previewSolution = $sce.trustAsHtml(vm.lab.solution);
}
vm.updatePreviewGoal = function() {
   vm.previewGoal = $sce.trustAsHtml(vm.lab.goal);
}
vm.updateHtml = function() {
vm.tinymceHtml = $sce.trustAsHtml(vm.lab.solution);
};

}

