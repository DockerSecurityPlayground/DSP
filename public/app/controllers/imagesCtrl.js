var dsp_ImagesCtrl= function($scope, $log, SafeApply,  WalkerService, RegexService, BreadCrumbs, SocketService, $uibModal, Constants, ServerResponse, Notification,$http,CurrentLabService , $location, $anchorScroll, $timeout, AjaxService, dockerAPIService, FetchFileFactory) {
  var imageList = [];
  // $scope.imagePanel = "repo_images"
  $scope.imagePanel = "all_images"
  $scope.dockerFilterName = "";
  $scope.dockerFiles = [];
  $scope.typeImports = ["None", "Dockerfile", "Git"];
  $scope.selectedImport = "None";
  // {
  //   content: "Hello"
  // }
  $scope.changeTypeImport = function(t) {
    $scope.selectedImport = t;
  };
  $scope.dockerFileToCreate = { name : "testdocker"};
  function init() {
    // All images if query string is allimages
    $scope.showSpinner = true
    if ($location.search().allimages && $location.search().allimages == 'true') {
      $scope.imagePanel = "all_images";
    }
    dockerAPIService.getDockerImages()
      .then(function successCallback(response) {
        $scope.allImages = response.data.data
        console.log("IMAGES");
        console.log($scope.allImages)
        $log.warn("TODO : CHECK SIZE DOCKER IMAGES == 0")
        /* DODCKER API INIT  : load docker images */
        console.log("IMAGESCTRL GETDSPIMAGES");
        dockerAPIService.getDSPImages(true)
          .then(function successCallback(response) {
            var images = response.data.data.images
            $log.warn("TODO : CHECK SIZE DOCKER IMAGES == 0")
            Object.keys(images).forEach(function(e) {
              // Get the key and assign it to `connector`
              images[e].repoName = e;
              let labImages = images[e].lab_images;
              _.each(labImages, function(li) {
                li.images = colorImages(li.images, $scope.allImages)
                // // Add build parameter
                // _.each(li.images, function(i) {
                //   var dockerImage = _.findWhere($scope.allImages, { name : i.name });
                //   i.toBuild = dockerImage.toBuild;
                // });

              })
              imageList.push(images[e]);
            });
            $scope.imageList = imageList
            $scope.showSpinner = false
            initAllImages()
            $timeout(function(){$anchorScroll()});
          },
            function errorCallback(response) {
              Notification({message:"Sorry,  error in loading docker images"}, 'error');
            })
      },
        function errorCallback(response) {
          Notification({message:"Sorry,  error in loading docker images"}, 'error');
        })
        
    dockerAPIService.getDockerFiles()
    .then(function success(response) {
      $scope.dockerFiles = response.data.data.dockerfiles;

    }, function err(response) {
      Notification({message: response.data.message}, 'error');
    });
  }

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
    // Set log for download info
    _.each($scope.imageList, function(i) {
      _.each(i.lab_images, function(li) {
        li.log = {content : ""};
      })
    })
  }
  function disableAllImages(iName, status=true) {
    _.each($scope.allImages, function (ims) {
      if (ims.name === iName) {
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
  function colorImages(labImages, images) {
    retImages =  []
    // ims = _.pluck(images, 'name')
    // console.log(ims)
    _.each(labImages, function(i) {
      newI = {}
      newI.name = i.name
      newI.textType = i.contains ? "text-success" : "text-danger";
      newI.contains = i.contains;
      newI.toBuild = i.toBuild;
      newI.progress = ""
      newI.disabled = false
      retImages.push(newI);
    })
    return retImages
  }


  // Initialization
  init();
  // End Initialization

  /* Scope methods */
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

  $scope.downloadNewImage = function downloadNewImage(i) {
    var ni = {}
    ni.name = i;
    ni.disabled = false;
    $scope.downloadImage(ni);
  }

  $scope.buildImage = function buildImage(p, repoName, log) {
    if (p.disabled == true) {
      console.log(p.name + " already in build")
    } else {
      p.isVisible = true;
      p.isExtracting = false;
      var ids = [];
      var total = 0;
      var imageSep = p.name.split(":")
      var nameToBuild = imageSep[0]
      disableAllImages(p.name, true)
      SocketService.manage(JSON.stringify({
        action : 'docker_build',
        params : {
          repo : repoName,
          dockerfile : nameToBuild
        }
      }), function(event) {
    var data = JSON.parse(event.data);
    switch (data.status) {
      case 'success':
        console.log("Success");
        p.progress = ""
        p.isVisible = false;
        log.content = "";
        successAll(p.name, true);
        p.textType = "text-success"
        Notification({message: "Build done"}, 'success');
        break;
      case 'error':
        Notification({message: data.message}, 'error');
        break;
      default:
        console.log("Update");
        log.content += data.message;
        // if (data.message.startsWith("Step "))
        // Indeterminate bar
        p.isExtracting=true;
        break
        }
      });
    }
  }

  $scope.downloadImage = function downloadImage(p, log) {
    if (p.disabled == true) {
      console.log(p.name + " already in downloading")
    } else {
      p.isVisible = true;
      p.isExtracting = false;
      var ids = [];
      var total = 0;
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
          log.content = "";
          p.progress=""
          p.isVisible = false
          successAll(p.name, true)
          p.textType = "text-success"
        }
        else if(data.status === 'error') {
          Notification('Some error in download image', 'error');
          console.log(data)
          // $scope.responseError = $scope.responseErrorHeader + data.message;
        }
        // Notify
        else {
          console.log("IMAGES");
          log.content += data.message;
          console.log(data.message);
          var message = JSON.parse(data.message);
          if(message.status == 'Pulling fs layer'){
            var obj = {'id': message.id,'percentage': 0};
            ids.push(obj);
          }
          if(message.status == 'Downloading'){
            _.each(ids, function(element){
              if(message.id == element.id){
                var normalized = (100 / ids.length);
                element.percentage = ((message.progressDetail.current * normalized) / message.progressDetail.total) - element.percentage;
                total += element.percentage;
              }
            })
          }
          if(message.status == 'Download complete'){

            _.each(ids, function(element){
              if(message.id == element.id){
                var normalized = (100 / ids.length)
                element.percentage = normalized - element.percentage;
                total += element.percentage;
              }
            })
          }
          if(total > 99)
          {
            p.isExtracting = true;
          }
          p.progress = total;
          //p.progress = dockerAPIService.formatPullLog(data.message);
        }
      })
    }
  }
  $scope.downloadAll = function downloadAll(lab, repoName, log) {
    var images = lab.images

    _.each(images, (i) => {
      if (!i.toBuild) {
        $scope.downloadImage(i, log)
      } else {
        $scope.buildImage =(i, repoName, log)
      }
    })
  }
  /** Dockerfiles scope methods  */
  $scope.createDockerFile = function() {
    var options = {};
    // Function to create
    if ($scope.selectedImport == "Dockerfile") {
      options.typeImport = "Dockerfile";
      options.name = $scope.dockerFileToCreate.baseDockerfile;
    } else if ($scope.selectedImport === "Git") {
      options.typeImport = "Git";
      options.gitUrl = $scope.dockerFileToCreate.github;
    }
    dockerAPIService.createDockerFile($scope.dockerFileToCreate.name, options)
    .then(function successCallback(response) {
      Notification("Success");
      $location.url('/dockerfile/' + $scope.dockerFileToCreate.name);
    },function errorCallback(response) {
      Notification({message: "Error in Create Dockerfile (are you using - in name?)"}, 'error');
    })
  }

  $scope.editDockerFile = function(d) {
    $location.url('/dockerfile/' + d);
  }

  $scope.deleteDockerFile = function(d) {
    var modalInstance = $uibModal.open({
      component: 'modalComponent',
      resolve: {
        lab: function () {
          return {name: d};
        }
      }
    });
    //Cancel lab
    //Success
    modalInstance.result.then(function () {
      // Ok delete
    dockerAPIService.deleteDockerFile(d)
    .then(function successCallback(response) {
      Notification("Deleted", 'success');
      $scope.dockerFiles = _.without($scope.dockerFiles, d);
      // TBD Remove

    }, function error(response) {
      Notification({message: response.data.message}, 'error');
    });
    }, function() {console.log("No Delete");});
  }
}
