angular
    .module('md-steppers')
    .directive('mdStepItem', MdStepItem);

function MdStepItem() {
    return {
        require: '^?mdSteppers',
        link: function link(scope, element, attr, ctrl) {
            if (!ctrl) return;
            ctrl.attachRipple(scope, element);
        }
    };
}
