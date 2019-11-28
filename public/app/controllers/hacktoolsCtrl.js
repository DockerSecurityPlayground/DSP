var dsp_HackToolsCtrl = function($scope, ServerResponse, $log, SocketService, dockerImagesService, dockerAPIService, $routeParams, $sce, SafeApply, $document, $uibModal, $location, $http, cfpLoadingBar, CurrentLabService, CleanerService, BreadCrumbs, AjaxService, $sce, WalkerService, Notification) {
  console.log("=== INIT HACKTOOLS===");
  var userDir;
  var vm = this;
  $scope.interactiveImageList = [];
  $scope.listTools = [];
  $scope.imageList = []

  dockerAPIService.getListHackTools()
    .then(function successCallback(response){
      console.log("LIST TOOLS");
        $scope.imageList = response.data.data.images;
        $scope.listTools = response.data.data.images;
    });
  dockerImagesService.get(function(images) {
    $scope.interactiveImageList = images;
  });

  $scope.switchImages = function switchImages(hackToolMode) {
    console.log("Switch images");
    if (hackToolMode == "interactive") {
      $scope.imageList = $scope.interactiveImageList;
    } else {
      $scope.imageList = $scope.listTools;
    }
  }
}

