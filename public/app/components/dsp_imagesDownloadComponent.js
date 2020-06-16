var dsp_imagesDownloadComponent  =
{
    templateUrl: 'views/imagesDownloadComponent.html',
    bindings: {
      download: '='
    },
    controller: function ($scope, ServerResponse, $log, SocketService, dockerImagesService, dockerAPIService, $routeParams, $sce, SafeApply, $document, $uibModal, $location, $http, cfpLoadingBar, CurrentLabService, CleanerService, BreadCrumbs, AjaxService, $sce, containerManager, WalkerService, Notification) {
      function init() {
        $scope.images = [];
        dockerImagesService.getByLab($routeParams.repo, $routeParams.namelab, function (images){
          $scope.images = images;
          $scope.images = colorImages($scope.images)
          initAllImages()
          console.log($scope.images)
        });

      }

      function initAllImages() {
        /*console.log("IN INIT ALL IMAGES")
        _.each($scope.allImages, (image) => {
          image.contains = true
          if(_.contains(dockerLabImages, image.name)) {
            image.textType = "text-success"
          }  else {
            image.textType = "text-warning"
          }
        })*/
        // Set log for download info
        _.each($scope.images, function(li) {
          li.log = {content : ""};
        })
      }

    
      function successAll(iName, success) {
            for (ii in $scope.images)
              if ($scope.images[ii].name == iName) {
                $scope.images[ii].textType = success ? "text-success" : "text-danger"
                $scope.images[ii].contains = success
              }
      }
      function colorImages(labImages) {
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
      init();
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
              dockerImagesService.areImagesInstalled($routeParams.repo, $routeParams.namelab)
              .then(function success(data) {
                var areInstalled = data.data.data.areInstalled;
                if(!areInstalled) {
                  CurrentLabService.noImages = true;
                }
                else {
                  CurrentLabService.noImages = false;
                }
              })
              
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
      $scope.downloadAll = function downloadAll() {
        var images = $scope.images
    
        _.each(images, (i) => {
          if (!i.toBuild) {
            $scope.downloadImage(i, i.log)
          } else {
            $scope.buildImage =(i, $routeParams.repo, i.log)
          }
        })
      }
    }
}