angular.module('md-steppers')
    .directive('mdStepScroll', MdStepScroll);

function MdStepScroll($parse) {
    return {
        restrict: 'A',
        compile: function ($element, attr) {
            var fn = $parse(attr.mdStepScroll, null, true);
            return function ngEventHandler(scope, element) {
                element.on('mousewheel', function (event) {
                    scope.$apply(function () { fn(scope, { $event: event }); });
                });
            };
        }
    }
}
