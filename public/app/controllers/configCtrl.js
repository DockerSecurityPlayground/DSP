var dsp_ConfigCtrl = function($scope, SafeApply, RegexService, BreadCrumbs, SocketService, $uibModal, Constants, ServerResponse, Notification,$http,CurrentLabService , $location, AjaxService, FetchFileFactory) {
  console.log("in config")

  var file;
  var urlRepoTree = '/api/tree/repo';
  $scope.labTreeModel = [];
  $scope.isRepoSynchronized;
  $scope.isReposUploading = false;
  $scope.isAppUpdating = false;
  $scope.isAppRestarting = false;
  $scope.isUserRepoUpdating = false;
  $scope.filetypePattern = RegexService.nameRegex;
  $scope.urlPattern = RegexService.urlRegex;
  $scope.isLoadingGit = false;

  $scope.githubError = {
    show: false,
    message: ''
  };
  $scope.errorDelete = '';

  (function init() {
    if(AjaxService.configExists()) {
      $scope.config = angular.copy(AjaxService.config);
      $scope.gitUrlToEdit = angular.copy($scope.config.githubURL);
      if($scope.config.githubURL !== '')
        $scope.isRepoSynchronized = true;

    }
    else {
      AjaxService.init(function onSuccess() {
        $scope.config = angular.copy(AjaxService.config);
        $scope.gitUrlToEdit = angular.copy($scope.config.githubURL);
        if($scope.config.githubURL !== '')
          $scope.isRepoSynchronized = true;
      });
  }

          CurrentLabService.resetLab()
          uploadTreeLabModel()
  }())


  $scope.updateConfig= function() {
  AjaxService.updateConfig($scope.config)
  .then(
          function success(response) {
                  Notification({message:"Success upload"}, 'success');
                  // Success, update inside ajaxaservice the config
                  AjaxService.config = $scope.config;
                  $location.url('/labs');
          },
          function error(err) {
            // Lab running error
            if (err.data.error == 1005) {
              Notification('Cannot update, pls stop following labs: '+ err.data.message, 'error');
            }
            else Notification({message:"Server error: "+err.data.message}, 'error');
        }
  );
  }

  $scope.setFiles = function(element) {
          console.log(element.files)
          if(element.files.length > 0)
          {
                  console.log("update:")
                  file = element.files[0]
          }

  }
  // EDIT USER GITHUB //
  $scope.openEditGithub = function() {
    console.log($scope.config.githubURL);
    if($scope.repo.gitUrlToEdit !== $scope.config.githubURL) {
      var modalInstance = $uibModal.open({
        component: 'changeGithubComponent',
      });
    //Cancel lab
    modalInstance.result.then(function () {
      console.log("CONFIRM");
      $scope.isLoadingGit = true;
      SocketService.manage(
        JSON.stringify({
          action : 'synchronize_github',
          body: {
            repo: $scope.repo
          }
        }),
        function(event) {
          var data = JSON.parse(event.data);
          if(data.status === 'success')  {
            console.log("Success")
            window.location.href = '/labs';
          }
          else if (data.status === 'error') {
              $scope.isLoadingGit = false;
              Notification('Server error: '+ data.message, 'error');
            }
          }
      );
      //var socket = new WebSocket('ws://localhost:8080');
      //socket.onopen = function() {
      //  socket.send(
      //  JSON.stringify({
      //  action : 'synchronize_github',
      //  body: {
      //    githubURL: $scope.gitUrlToEdit
      //  }
      //}));

//      socket.onmessage =
//      function(event) {
//        var data = JSON.parse(event.data);
//        if(data.status === 'success')  {
//          console.log("Success")
//          window.location.href = '/labs';
//        }
//        else if (data.status === 'error') {
//            $scope.isLoadingGit = false;
//            Notification('Server error: '+ data.message, 'error');
//          }
//        }
//      }
    }, function() {});
  }
      else Notification('You haven\'t changed repo *_*', 'info');
}


  //Directory data lab managment
  function uploadTreeLabModel() {
    console.log(urlRepoTree+'?id=1')
    $http.get(urlRepoTree+'?id=1')
      .then(function successCallback(response) {
              console.log("successs")
              $scope.labTreeModel = response.data
              console.log($scope.labTreeModel)
      },
      function errorCallback(response) {
              console.log("error in upload")
      })

  }
$scope.currentFileToUpload = ''
$scope.currentFileInLab = ''

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


$scope.deleteFile = function() {
	console.log($scope.currentFileInLab)
	$http.delete(urlRepoTree+"?id="+$scope.currentFileInLab )
		.then(function successCallback(response) {
                  $scope.errorDelete = '';
                  Notification({message:"Deleted"}, 'success');
                  uploadTreeLabModel()
		},
		function errorCallback(response) {
                  if(response.data.error === 1007)
                    $scope.errorDelete = response.data.message;
                  else {
                    Notification({message:"Server error:"+ response.data.message}, 'error');
                  }

		})

}
//Upload a file in the lab directory
$scope.uploadFile = function() {

  var body = {file:$scope.currentFileToUpload}
  if(!$scope.currentFileToUpload || $scope.currentFileToUpload === '')
    {
    Notification({message:"Pls select first a file"}, 'error');
    }
    else
    {
    console.log(urlRepoTree)
    console.log(body)
    $http.post(urlRepoTree, body)
            .then(function successCallback(response) {
                    Notification({message:"File uploaded!"}, 'success');
                    uploadTreeLabModel()
            },

            function errorCallback(response) {
                    Notification({message:"Upload error"}, 'error');
            })
    }


  }

$scope.nodeSelected = function(e, data) {
var _l = data.node.li_attr;
//Current file to upload selected by user
$scope.currentFileToUpload = _l.id
console.log(_l.id)
if (_l.isLeaf) {
  FetchFileFactory.fetchFile(_l.base).then(function(data) {
    var _d = data.data;
    if (typeof _d == 'object') {

      //http://stackoverflow.com/a/7220510/1015046//
      _d = JSON.stringify(_d, undefined, 2);
    }
  });
}
else {
  //http://jimhoskins.com/2012/12/17/angularjs-and-apply.html//
  $scope.$apply(function() {
  });
}
}

$scope.restartApplication = function() {
  alert("TBD")
}
$scope.updateApplication = function() {
  $scope.isAppUpdating = true;
  SocketService.manage(
        JSON.stringify({
          action : 'update_application'
      }),
    function(event) {
      var data = JSON.parse(event.data);
      if(data.status === 'success')  {
              console.log("Success")
              Notification({message:"Application uploaded!"}, 'success');
          // Your application has indicated there's an error
          window.setTimeout(function(){
        // Move to a new location or you can do something else
        window.location.href = "/configuration";
      }, 2000)
    }
    else {
      Notification('Error in update application');
    }
  })
}

$scope.manageImages = function() {
  window.location.href = "/images";
}
$scope.manageRepos = function() {
  window.location.href = "/repositories";
}
$scope.updateProjects = function() {
  $scope.isReposUploading = true;

    SocketService.manage(
          JSON.stringify({
            action : 'update_projects'
     }),
    function(event) {
      var data = JSON.parse(event.data);
      if(data.status === 'success')  {
              console.log("Success")
              Notification({message:"Project uploaded!"}, 'success');
              $scope.isReposUploading = false;
              window.location.href = '/configuration';
      } else if (data.status === 'error') {
          console.log(data.status);
          console.log(data.code);

          if (data.code === Constants.RUNNING_CODE_ERROR) {

            SafeApply.exec($scope, function() {
              $scope.githubError.show = true;
              $scope.githubError.message = 'Pls stop all running labs first! <br>\
              Running labs: <b>'+ data.message + '</b>';
              $scope.isReposUploading = false;
            });
          }
          else {
          Notification('Server error: '+ data.code, 'error');
          }
          $scope.isReposUploading = false;
      }
      else {
          Notification('Some error in uploading...', 'error');
          $scope.isReposUploading = false;
        }
    }
  );

  //var socket = new WebSocket('ws://localhost:8080');
  //socket.onopen = function() {
  //  socket.send(
  //      JSON.stringify({
  //    action : 'update_projects' }));

  //  socket.onmessage =
  //    function(event) {
  //    var data = JSON.parse(event.data);
  //    if(data.status === 'success')  {
  //            console.log("Success")
  //            Notification({message:"Project uploaded!"}, 'success');
  //            $scope.isReposUploading = false;
  //            window.location.href = '/configuration';
  //    } else if (data.status === 'error') {
  //        console.log(data.status);
  //        console.log(data.code);

  //        if (data.code === Constants.RUNNING_CODE_ERROR) {
  //
  //          SafeApply.exec($scope, function() {
  //            $scope.githubError.show = true;
  //            $scope.githubError.message = 'Pls stop all running labs first! <br>\
  //            Running labs: <b>'+ data.message + '</b>';
  //            $scope.isReposUploading = false;
  //          });
  //        }
  //        else {
  //        Notification('Server error: '+ data.code, 'error');
  //        }
  //        $scope.isReposUploading = false;
  //    }
  //    else {
  //        Notification('Some error in uploading...', 'error');
  //        $scope.isReposUploading = false;
  //      }
  //    }
  //}
}


$scope.nodeLabSelected = function(e, data) {
var _l = data.node.li_attr;
//File current in lab
$scope.currentFileInLab = _l.id
console.log(_l.id)
if (_l.isLeaf) {
  FetchFileFactory.fetchFile(_l.base).then(function(data) {
    var _d = data.data;
    if (typeof _d == 'object') {

      //http://stackoverflow.com/a/7220510/1015046//
      _d = JSON.stringify(_d, undefined, 2);
    }
  });
}
else {
  //http://jimhoskins.com/2012/12/17/angularjs-and-apply.html//
  $scope.$apply(function() {
  });
}
};

  $scope.pullPersonalRepo = function() {
    $scope.isRepoUploading = true;

    SocketService.manage(
      JSON.stringify({
        action: 'pull_personal_repo',
      }), function (event) {
        var data = JSON.parse(event.data);
        if(data.status === 'success')  {
          Notification("Repository updated", 'success');
          $scope.isRepoUploading = false;
        } else if (data.status === 'error') {
          Notification(data.message, 'error');
          $scope.isRepoUploading = false;
        };
      });
  };

  $scope.pushPersonalRepo = function() {
    $scope.isUserRepoUpdating = true;

    SocketService.manage(
      JSON.stringify({
        action: 'push_personal_repo',
        body: $scope.commitMessage
      }), function (event) {
        var data = JSON.parse(event.data);
        if(data.status === 'success')  {
          Notification("Remote repository updated", 'success');
          $scope.isUserRepoUpdating = false;
        } else if (data.status === 'error') {
          Notification(data.message, 'error');
          $scope.isUserRepoUpdating = false;
        };
      });
  };

}
