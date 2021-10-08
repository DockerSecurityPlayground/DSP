(function () {
    'use strict';

    /**
   * @ngdoc service
   * @name $mdStepInkRipple
   * @module md-steppers
   *
   * @description
   * TODO DOCS
   *
   */

    angular.module('md-steppers')
      .factory('$mdStepInkRipple', MdStepInkRipple);

    /**
    * @ngInject
    */
    function MdStepInkRipple($mdInkRipple) {
        return {
            attach: attach
        };

        function attach(scope, element, options) {
            return $mdInkRipple.attach(scope, element, angular.extend({
                center: false,
                dimBackground: true,
                outline: false,
                rippleSize: 'full'
            }, options));
        };
    };
})();
