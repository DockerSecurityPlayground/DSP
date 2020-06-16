function dsp_imagesService(dockerAPIService, Notification) {
  this.images;
  this.LabImages;
  this.onDownloadCallbacks = {};

  this.registerCallback = function(index, cb) {
    onDownloadCallbacks[index] = cb;
  }
  this.unregisterCallback = function(index) {
    delete this.onDownloadCallbacks[index];
  }
  this.areImagesInstalled = function(repoName, labName, cb) {
      return dockerAPIService.areImagesInstalled(repoName, labName, cb)
  }
  this.getByLab = function(repoName, labName, cb, refresh = false) {
    console.log("GET DSP IMAGES");
    if (this.LabImages && !refresh) {
      cb(this.LabImages);
    } else {
      dockerAPIService.getLabImages(repoName, labName)
      .then(function successCallback(response) {
        this.LabImages = response.data.data.images;
        // var cbs = this.onDownloadCallbacks.values();
        // cbs.forEach(function(c) {
          // c(images)
        // })
        cb(this.LabImages);

       }, function errorCallback(error) {
         cb(error);
         Notification({message:"Sorry,  error in loading docker images"}, 'error');
        });
    }
  }

  this.get = function(cb, refresh = false) {
    console.log("IN GET");
    var currentImages = this.images;
    if (currentImages && !refresh) {
      cb(currentImages);
    } else {
      dockerAPIService.getDockerImages()
      .then(function successCallback(response) {
        this.images = response.data.data;
        // var cbs = this.onDownloadCallbacks.values();
        // cbs.forEach(function(c) {
          // c(images)
        // })
        cb(this.images);

       }, function errorCallback(error) {
         cb(null);
         Notification({message:"Sorry,  error in loading docker images"}, 'error');
        });
      }
  }
}
