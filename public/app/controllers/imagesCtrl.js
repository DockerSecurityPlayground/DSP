var dsp_ImagesCtrl= function($scope, $log, SafeApply,  WalkerService, RegexService, BreadCrumbs, SocketService, $uibModal, Constants, ServerResponse, Notification,$http,CurrentLabService , $location, AjaxService, dockerAPIService, FetchFileFactory) {
  console.log("in manage images")
  var imageList = [];
  $scope.imagePanel = "repo_images"
  // All images if query string is allimages
  if ($location.search().allimages && $location.search().allimages == 'true') {
    $scope.imagePanel = "all_images";
  }




  dockerAPIService.getDockerImages()
    .then(function successCallback(response) {
          $scope.allImages = response.data.data
          console.log($scope.allImages)
          $log.warn("TODO : CHECK SIZE DOCKER IMAGES == 0")
          /* DODCKER API INIT  : load docker images */
          dockerAPIService.getDSPImages(true)
            .then(function successCallback(response) {
              var images = response.data.data.images
              console.log(images)
              $log.warn("TODO : CHECK SIZE DOCKER IMAGES == 0")
              Object.keys(images).forEach(function(e) {
                // Get the key and assign it to `connector`
                images[e].repoName = e;
                // [ {lab, images}, {lab2, images2} ...
                let labImages = images[e].lab_images;
                _.each(labImages, function(li) {
                   li.images = colorImages(li.images, $scope.allImages)
                // images[e].lab_images= colorImages(images[e].lab_images, $scope.allImages)
                })
                imageList.push(images[e]);
            });
              $scope.imageList = imageList
              initAllImages()
            },
            function errorCallback(response) {
                Notification({message:"Sorry,  error in loading docker images"}, 'error');
            })
      },
    function errorCallback(response) {
        Notification({message:"Sorry,  error in loading docker images"}, 'error');
    })

  function initAllImages() {
    console.log("IN INIT ALL IMAGES")
    dockerLabImages = []
    _.each($scope.imageList, (il) => {
      ims = il.images.map(i => i.name)
      dockerLabImages = _.union(dockerLabImages, ims)
    })
      dockerLabImages = _.uniq(dockerLabImages)
    _.each($scope.allImages, (image) => {
      image.contains = true
      if(_.contains(dockerLabImages, image.name)) {
        image.textType = "text-success"
      }  else {
        image.textType = "text-warning"
      }

    })
  }


    function disableAllImages(iName, status=true) {
      _.each($scope.allImages, function (ims) {
        if (ims.name === iName) {
          console.log("CONTAINS")
          console.log(ims.name)
          ims.contains = status
        }
      })

      for (li in $scope.imageList) {
        labImages = $scope.imageList[li].lab_images
        for (i in labImages) {
          images = labImages[i].images
          for (ii in images)
            if (images[ii].name == iName)
            images[ii].disabled = status
        }
      }
    }
  function successAll(iName, success) {
      for (li in $scope.imageList) {
        labImages = $scope.imageList[li].lab_images
        for (i in labImages) {
          images = labImages[i].images
          for (ii in images)
            if (images[ii].name == iName) {
            images[ii].textType = success ? "text-success" : "text-danger"
            images[ii].contains = success
          }
        }
      }
  }

    $scope.delImage = function deleteImage(p) {
      var modalInstance = $uibModal.open({
        component: 'modalComponent',
        resolve: {
        lab: function () {
          return p;
          }
        }
      });
      //Cancel image
      modalInstance.result.then(function () {
        var nameToDelete = p.name;
        imageSep = nameToDelete.split(":")
        nameToDownload = imageSep[0]
        tagToDownload = imageSep[1]

        SocketService.manage(JSON.stringify({
          action : 'remove_image',
          params : {
          name : nameToDownload,
          tag : tagToDownload
          }
        }), function(event) {
            var data = JSON.parse(event.data);
            if(data.status === 'success')  {
              console.log("Success")
              disableAllImages(p.name, false)
              successAll(p.name, false)
              // Remove deleted image from allImages
              // for (i in $scope.allImages) {
              //   if ($scope.allImages[i].name === p.name)
              //     delete $scope.allImages[i]
              // }
              // p.textType = "text-success"
            }
            else if(data.status === 'error') {
                    Notification(data.message, 'error');
                    console.log(data)
                    // $scope.responseError = $scope.responseErrorHeader + data.message;
              }

        });
      },
     function errorCallback(response) {
       console.log("NO DELETE")
     });
    }

    $scope.downloadImage = function downloadImage(p) {
        if (p.disabled == true) {
          console.log(p.name + " already in downloading")
        } else {
        imageSep = p.name.split(":")
        nameToDownload = imageSep[0]
        tagToDownload = imageSep[1]
        // p.disabled = true
        disableAllImages(p.name, true)
        SocketService.manage(JSON.stringify({
          action : 'download_images',
          params : {
          name : nameToDownload,
          tag : tagToDownload
          }
        }), function(event) {
            var data = JSON.parse(event.data);
            if(data.status === 'success')  {
              console.log("Success")
              p.progress=""
              successAll(p.name, true)
              // p.textType = "text-success"
            }
            else if(data.status === 'error') {
                    Notification('Some error in download image', 'error');
                    console.log(data)
                    // $scope.responseError = $scope.responseErrorHeader + data.message;
              }
            // Notify
            else {
              p.progress += dockerAPIService.formatPullLog(data.message)+ "\n"
            }
      })
    }
  }
    $scope.downloadAll = function downloadAll(lab) {
      var images = lab.images

      _.each(images, (i) => {
        console.log("IMAGE")
        console.log(i)
        $scope.downloadImage(i)
      })


    }

    function colorImages(labImages, images) {
         retImages =  []
        // ims = _.pluck(images, 'name')
        // console.log(ims)
        _.each(labImages, function(i) {
            newI = {}
            newI.name = i.name
            newI.textType = i.contains ? "text-success" : "text-danger";
            newI.contains = i.contains
            newI.progress = ""
            newI.disabled = false
            retImages.push(newI);
        })
        return retImages
    }
}
