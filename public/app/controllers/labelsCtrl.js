var dsp_LabelsCtrl = function($scope,$route, Notification, WalkerService, SafeApply, $uibModal, $http, BreadCrumbs, CurrentLabService, AjaxService, $location, $anchorScroll) {
  console.log("label controller") 
  CurrentLabService.resetLab() 
  AjaxService.init().dLabel.then(function(res) {
    $scope.loadedLabels = AjaxService.projectLabels.labels; 
  }, function(err) {
  })

  $scope.toEdit = ''
  cancelEdit();

  function cancelEdit() {
    $scope.toEdit= '';
    $scope.labelForm = {
      name:'', description:'', color:'#056C9F' , 
      action : {
      name:"Create Label" , css:"btn btn-success" },
      visibilityCancelEdit : 'hidden'
    };
          //AjaxService.cancelEditLabel() 
  }
  //loadStubs()
  $scope.initEdit = function initEdit(l) {
    $scope.labelForm  = {name:l.name, description:l.description, 
                            color:l.color} 
    $scope.toEdit = l.name
    $scope.labelForm.action = {	name:"Edit Label" , css:"btn btn-warning",
                                    visibilityCancelEdit : ''
                             }
    gotoAnchor("form-label-id")
  }

  $scope.cancelEdit = cancelEdit;
  $scope.removeLabel = function removeLabel(name) {
    var modalInstance = $uibModal.open({
      component: 'modalComponent',
      resolve: {
        lab: function() {
          return {name:name}
        }
      }
    });
    //Cancel lab
    modalInstance.result.then(function () {
      console.log("TODELETE");
      console.log(name);
      AjaxService.removeLabel(name)
            .then(function successCallback(response) {
              console.log("success delete")
              SafeApply.exec($scope, function() {
                WalkerService.removeLabelInLabs(name);
                //Notification({message: 'Label deleted!'}, 'success');
                AjaxService.removeFromProjectLabels(name)
              });
            },
            function errorCallback(response) { 
              Notification('Server error:'+ response.data.message, 'error');
              console.log("error:") 	
              console.log(response) 	
            });

      }, function() {});
  }

  $scope.addLabel = function addLabel(l) { 
    if($scope.toEdit !== "") {
      var label  = { 
              oldName : $scope.toEdit,
              name: l.name,
              description: l.description,
              color: l.color
      }
            AjaxService.editLabel(l, label) 
              .then(function successCallback(response) { 
                var newLabel = {
                        name:label.name,
                        description: label.description, 
                        color: label.color
                }
                Notification('Label edited', 'success');
                console.log("success: ")   
                AjaxService.changeToProjectLabels($scope.toEdit, newLabel)
                //Update walker service labels 
                WalkerService.updateLabelInLabs($scope.toEdit, newLabel)
                cancelEdit()
              }, 
              function errorCallback(response) {
                console.log("error" )    
                Notification('Server error:'+ response.data.message, 'error');
                console.log(response.data.message)
                cancelEdit()
              })
    }
    else {
            console.log("Add label");
            AjaxService.addLabel(l) 
            .then(function successCallback(response) {
              AjaxService.addToProjectLabels(response.data.data)
              $scope.cancelEdit()
            }, 
              function errorCallback(response) {
                  Notification('Server error:'+ response.data.message, 'error');
                  $scope.cancelEdit()
            });
    }
}
      function gotoAnchor(x) {
        var newHash = x;
          $location.hash(x);
          $anchorScroll()


  }




  }
        //if ($location.hash() !== newHash) {
  //	console.log("not loaded")
          // set the $location.hash to `newHash` and
          // $anchorScroll will automatically scroll to it
  //      } 
  //	else {
  //	// call $anchorScroll() explicitly,
  //	// since $location.hash hasn't changed
  //	$anchorScroll();
