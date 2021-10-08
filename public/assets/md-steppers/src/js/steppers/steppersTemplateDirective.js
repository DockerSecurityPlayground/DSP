angular
    .module('md-steppers')
    .directive('mdSteppersTemplate', MdSteppersTemplate);

function MdSteppersTemplate($compile, $mdUtil) {
    return {
        restrict: 'A',
        link: link,
        scope: {
            template: '=mdSteppersTemplate',
            connected: '=?mdConnectedIf',
            compileScope: '=mdScope'
        },
        require: '^?mdSteppers'
    };
    function link(scope, element, attr, ctrl) {
        if (!ctrl) return;
        var compileScope = ctrl.enableDisconnect ? scope.compileScope.$new() : scope.compileScope;
        element.html(scope.template);
        $compile(element.contents())(compileScope);
        element.on('DOMSubtreeModified', function () {
            ctrl.updatePagination();
            ctrl.updateInkBarStyles();
        });
        return $mdUtil.nextTick(handleScope);

        function handleScope() {
            scope.$watch('connected', function (value) { value === false ? disconnect() : reconnect(); });
            scope.$on('$destroy', reconnect);
        }

        function disconnect() {
            if (ctrl.enableDisconnect) $mdUtil.disconnectScope(compileScope);
        }

        function reconnect() {
            if (ctrl.enableDisconnect) $mdUtil.reconnectScope(compileScope);
        }
    }
}
