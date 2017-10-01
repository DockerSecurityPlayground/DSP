var dsp_MainCtrl = function($scope, $location, BreadCrumbs, AjaxService,CurrentLabService, WalkerService)  {
  $scope.breads = BreadCrumbs;
  $scope.repos; 
  $scope.currentLab = CurrentLabService.currentLab;

  AjaxService.init()
    .dAll.then(function(res) {
      $scope.repos = WalkerService.repos;
    },
    function(err) {

    })

  $scope.updateBreadCrumbs = function(path) {
    BreadCrumbs.breadCrumbs(path);
    console.log(BreadCrumbs.breads);
  }
  $scope.getClass = function (path) {
    return ($location.path().substr(0, path.length) === path) ? 'active' : '';
  }
}
