angular
    .module('md-steppers')
    .directive('mdStepLabel', MdStepLabel);

function MdStepLabel() {
    return { terminal: true };
}

