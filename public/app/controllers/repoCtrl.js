var dsp_RepoCtrl= function($scope, $log, SafeApply,  WalkerService, RegexService, BreadCrumbs, SocketService, $uibModal, Constants, ServerResponse, Notification,$http,CurrentLabService , $location, AjaxService, dockerAPIService, FetchFileFactory, $anchorScroll) {
  console.log("In repositories")
  var imageList = [];
  //$scope.urlPattern = RegexService.urlRegex;
  $scope.repos = [];
  $scope.repo = {
    name: "",
    url: ""
  }

  $scope.isRepoUploading = false;

  $scope.addRepository = function() {
      $scope.isRepoUploading = true;
      if ($scope.repo.name  == '') {
        $theUrl = $scope.repo.url;
        $scope.repo.name = $theUrl.substring($theUrl.lastIndexOf('/') + 1, $theUrl.length - 4);
      }

      SocketService.manage(
        JSON.stringify({
          action: 'add_project',
          body: $scope.repo
      }), function (event) {
        var data = JSON.parse(event.data);
        if(data.status === 'success')  {
          window.location.href = '/repositories';
      } else if (data.status === 'error') {
          Notification(data.message, 'error');
          $scope.isRepoUploading = false;
      };
    });
  }


  $scope.updateRepository = function(repo) {
      $scope.isRepoUploading = true;

      SocketService.manage(
        JSON.stringify({
          action: 'update_project',
          body: repo
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
  }
  $scope.removeRepository = function(p) {
      var modalInstance = $uibModal.open({
        component: 'modalComponent',
        resolve: {
        lab: function () {
          return p;
          }
        }
    });
      modalInstance.result.then(function yes() {
        console.log("DELETE");
        AjaxService.removeProject(p.name)
        .then(function success() {
          Notification({message:"Project deleted"}, 'success');
          for (var i = 0; i < $scope.repos.length; i++) {
            if ($scope.repos[i].name == p.name) {
              $scope.repos.splice(i, 1);
            }
          }
        }, function exception(data) {
          Notification("Error in delete", 'error');
        });
      }, function no() {
    });
  }

  AjaxService.getProjects()
    .then(function successCallback(response) {
      $scope.repos = response.data.data;
      console.log(response.data.data);
    }, function errorCallback(err) {
      Notification('Server error:'+ response.data.message, 'error');
    });

  $scope.updateAll= function() {
    $scope.isReposUploading = true;

      SocketService.manage(
            JSON.stringify({
              action : 'update_projects'
       }),
      function(event) {
        var data = JSON.parse(event.data);
        if(data.status === 'success')  {
                console.log("Success")
                Notification({message:"Projects uploaded!"}, 'success');
                $scope.isReposUploading = false;
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
  }

  $scope.isPrivateCheckbox = false;
  $scope.readOnlyUsername = false;
  $scope.readOnlyToken = false;
  $scope.readOnlyFields = false;
  $scope.isEditing = false;
  $scope.updateAddButton = {
    text: "Add repo",
  };
  $scope.githubFormHeader = "Add Git Repository";
  $scope.usernamePlaceholder = "Username";
  $scope.tokenPlaceholder = "Token";


  $scope.checkRepoPrivate = function () {
    $scope.isPrivateCheckbox = !$scope.isPrivateCheckbox;
  }

  $scope.editRepositoryClick = function (repo) {
    // Go to gitform
    $location.hash("gitform");
    $anchorScroll();
    $scope.clearGithubForm();
    $scope.repo.name = repo.name;
    $scope.repo.url = repo.url;
    $scope.repo.isPrivate = repo.isPrivate;
    if(repo.isPrivate) {
      $scope.isPrivateCheckbox = true;
      $scope.usernamePlaceholder = 'New Username';
      $scope.tokenPlaceholder = 'New Token';
      $scope.repo.sshKeyPath = repo.sshKeyPath;
      //$scope.readOnlyUsername = true;
      //$scope.readOnlyToken = true;
    }else
      $scope.isPrivateCheckbox = false;
    $scope.readOnlyFields = true;
    $scope.githubForm.$dirty = true;
    $scope.updateAddButton.text="Update repo";
    $scope.githubFormHeader = "Edit Git Repository";
  }

  $scope.clearGithubForm = function () {
    $scope.repo.name = '';
    $scope.repo.url = '';
    $scope.repo.isPrivate = false;
    $scope.repo.username = null;
    $scope.repo.token = null;
    $scope.repo.sshKeyPath = null;
    $scope.githubForm.$dirty = false;
    $scope.isPrivateCheckbox = false;
    $scope.readOnlyUsername = false;
    $scope.readOnlyToken = false;
    $scope.readOnlyFields = false;
    $scope.usernamePlaceholder = 'Username';
    $scope.tokenPlaceholder = 'Token';
    $scope.updateAddButton.text="Add repo";
    $scope.githubFormHeader = "Add Git Repository";
  }

  $scope.editRepository = function() {
    console.log("Update");
    $scope.isEditing = true;
    if ($scope.repo.name  == '') {
      $theUrl = $scope.repo.url;
      $scope.repo.name = $theUrl.substring($theUrl.lastIndexOf('/') + 1, $theUrl.length - 4);
    }

    SocketService.manage(
      JSON.stringify({
        action: 'edit_repository',
        body: $scope.repo
      }), function (event) {
        var data = JSON.parse(event.data);
        if(data.status === 'success')  {
          Notification(data.message, 'success');
          window.location.href = '/repositories';
        } else if (data.status === 'error') {
          Notification(data.message, 'error');
          $scope.isEditing = false;
        };
      });
  }

  $scope.pushRepository = function(repo){
    if(!repo.isPrivate){
      Notification('Make repo private and add credentials', 'error' );
      $scope.editRepositoryClick(repo);

    }

  }
//  dockerAPIService.getDockerImages()
//    .then(function successCallback(response) {
//          $scope.allImages = response.data.data
//          console.log($scope.allImages)
//          $log.warn("TODO : CHECK SIZE DOCKER IMAGES == 0")
//          /* DODCKER API INIT  : load docker images */
//          dockerAPIService.getDSPImages(true)
//            .then(function successCallback(response) {
//              var images = response.data.data.images
//              console.log(images)
//              $log.warn("TODO : CHECK SIZE DOCKER IMAGES == 0")
//              Object.keys(images).forEach(function(e) {
//                // Get the key and assign it to `connector`
//                images[e].repoName = e;
//                // [ {lab, images}, {lab2, images2} ...
//                let labImages = images[e].lab_images;
//                _.each(labImages, function(li) {
//                   li.images = colorImages(li.images, $scope.allImages)
//                // images[e].lab_images= colorImages(images[e].lab_images, $scope.allImages)
//                })
//                imageList.push(images[e]);
//            });
//              $scope.imageList = imageList
//              initAllImages()
//            },
//            function errorCallback(response) {
//                Notification({message:"Sorry,  error in loading docker images"}, 'error');
//            })
//      },
//    function errorCallback(response) {
//        Notification({message:"Sorry,  error in loading docker images"}, 'error');
//    })
//
//  function initAllImages() {
//    console.log("IN INIT ALL IMAGES")
//    dockerLabImages = []
//    _.each($scope.imageList, (il) => {
//      ims = il.images.map(i => i.name)
//      dockerLabImages = _.union(dockerLabImages, ims)
//    })
//      dockerLabImages = _.uniq(dockerLabImages)
//    _.each($scope.allImages, (image) => {
//      image.contains = true
//      if(_.contains(dockerLabImages, image.name)) {
//        image.textType = "text-success"
//      }  else {
//        image.textType = "text-warning"
//      }
//
//    })
//  }
//
//
//    function disableAllImages(iName, status=true) {
//      _.each($scope.allImages, function (ims) {
//        if (ims.name === iName) {
//          console.log("CONTAINS")
//          console.log(ims.name)
//          ims.contains = status
//        }
//      })
//
//      for (li in $scope.imageList) {
//        labImages = $scope.imageList[li].lab_images
//        for (i in labImages) {
//          images = labImages[i].images
//          for (ii in images)
//            if (images[ii].name == iName)
//            images[ii].disabled = status
//        }
//      }
//    }
//  function successAll(iName, success) {
//      for (li in $scope.imageList) {
//        labImages = $scope.imageList[li].lab_images
//        for (i in labImages) {
//          images = labImages[i].images
//          for (ii in images)
//            if (images[ii].name == iName) {
//            images[ii].textType = success ? "text-success" : "text-danger"
//            images[ii].contains = success
//          }
//        }
//      }
//  }
//
//    $scope.delImage = function deleteImage(p) {
//      var modalInstance = $uibModal.open({
//        component: 'modalComponent',
//        resolve: {
//        lab: function () {
//          return p;
//          }
//        }
//      });
//      //Cancel image
//      modalInstance.result.then(function () {
//        var nameToDelete = p.name;
//        imageSep = nameToDelete.split(":")
//        nameToDownload = imageSep[0]
//        tagToDownload = imageSep[1]
//
//        SocketService.manage(JSON.stringify({
//          action : 'remove_image',
//          params : {
//          name : nameToDownload,
//          tag : tagToDownload
//          }
//        }), function(event) {
//            var data = JSON.parse(event.data);
//            if(data.status === 'success')  {
//              console.log("Success")
//              disableAllImages(p.name, false)
//              successAll(p.name, false)
//              // Remove deleted image from allImages
//              // for (i in $scope.allImages) {
//              //   if ($scope.allImages[i].name === p.name)
//              //     delete $scope.allImages[i]
//              // }
//              // p.textType = "text-success"
//            }
//            else if(data.status === 'error') {
//                    Notification(data.message, 'error');
//                    console.log(data)
//                    // $scope.responseError = $scope.responseErrorHeader + data.message;
//              }
//
//        });
//      },
//     function errorCallback(response) {
//       console.log("NO DELETE")
//     });
//    }
//
//    $scope.downloadImage = function downloadImage(p) {
//        if (p.disabled == true) {
//          console.log(p.name + " already in downloading")
//        } else {
//        imageSep = p.name.split(":")
//        nameToDownload = imageSep[0]
//        tagToDownload = imageSep[1]
//        // p.disabled = true
//        disableAllImages(p.name, true)
//        SocketService.manage(JSON.stringify({
//          action : 'download_images',
//          params : {
//          name : nameToDownload,
//          tag : tagToDownload
//          }
//        }), function(event) {
//            var data = JSON.parse(event.data);
//            if(data.status === 'success')  {
//              console.log("Success")
//              p.progress=""
//              successAll(p.name, true)
//              // p.textType = "text-success"
//            }
//            else if(data.status === 'error') {
//                    Notification('Some error in download image', 'error');
//                    console.log(data)
//                    // $scope.responseError = $scope.responseErrorHeader + data.message;
//              }
//            // Notify
//            else {
//              p.progress += dockerAPIService.formatPullLog(data.message)+ "\n"
//            }
//      })
//    }
//  }
//    $scope.downloadAll = function downloadAll(lab) {
//      var images = lab.images
//
//      _.each(images, (i) => {
//        console.log("IMAGE")
//        console.log(i)
//        $scope.downloadImage(i)
//      })
//
//
//    }
//
//    function colorImages(labImages, images) {
//         retImages =  []
//        // ims = _.pluck(images, 'name')
//        // console.log(ims)
//        _.each(labImages, function(i) {
//            newI = {}
//            newI.name = i.name
//            newI.textType = i.contains ? "text-success" : "text-danger";
//            newI.contains = i.contains
//            newI.progress = ""
//            newI.disabled = false
//            retImages.push(newI);
//        })
//        return retImages
//    }
}
