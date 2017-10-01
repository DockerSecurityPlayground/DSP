var SafeApply = function SafeApply() {
this.exec = function($scope, operation, args) {
  if(!$scope.$$phase) {
    $scope.$apply(function() { 
      operation(args);
    });
    //$digest or $apply
    } else operation(args);
}
}
