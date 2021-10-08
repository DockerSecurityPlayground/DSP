
/**
 * @ngdoc directive
 * @name mdSteppers
 * @module md-steppers
 *
 * @restrict E
 *
 * @description
 * TODO DOCS
 *
 */
angular
  .module('md-steppers')
  .directive('mdSteppers', MdSteppers);

function MdSteppers() {
  return {
    scope: {
      selectedIndex: '=?mdSelected',
      busyText: '=?mdBusyText',
      busy: '=?mdBusy',
      disableTabsBehavior: '=?mdDisableTabsBehavior'
    },
    template: function(element, attr) {
      attr["$mdSteppersTemplate"] = element.html();

      var ngClick = attr.mdDisableTabsBehavior ?
        '' :
        'ng-click="$mdSteppersCtrl.select(step.getIndex())" ';
        var mdStepClass = attr.mdDisableTabsBehavior ? 'class="md-step md-step-nopointer" ': 'class="md-step" ';
      return ['',
        '<md-steppers-wrapper> ',
        '<md-step-data></md-step-data> ' ,
        // '<md-prev-button ' ,
        //     'tabindex="-1" ' ,
        //     'role="button" ' ,
        //     'aria-label="Previous Page" ' ,
        //     'aria-disabled="{{!$mdSteppersCtrl.canPageBack()}}" ' ,
        //     'ng-class="{ \'md-disabled\': !$mdSteppersCtrl.canPageBack() }" ' ,
        //     'ng-if="$mdSteppersCtrl.shouldPaginate" ' ,
        //     'ng-click="$mdSteppersCtrl.previousPage()"> ' ,
        //   '<md-icon md-svg-icon="md-tabs-arrow"></md-icon> ' ,
        // '</md-prev-button> ' ,
        // '<md-next-button ' ,
        //     'tabindex="-1" ' ,
        //     'role="button" ' ,
        //     'aria-label="Next Page" ' ,
        //     'aria-disabled="{{!$mdSteppersCtrl.canPageForward()}}" ' ,
        //     'ng-class="{ \'md-disabled\': !$mdSteppersCtrl.canPageForward() }" ' ,
        //     'ng-if="$mdSteppersCtrl.shouldPaginate" ' ,
        //     'ng-click="$mdSteppersCtrl.nextPage()"> ' ,
        //   '<md-icon md-svg-icon="md-tabs-arrow"></md-icon> ' ,
        // '</md-next-button> ' ,
        '<md-steppers-canvas ',
        'tabindex="{{ $mdSteppersCtrl.hasFocus ? -1 : 0 }}" ',
        'aria-activedescendant="step-item-{{$mdSteppersCtrl.steppers[$mdSteppersCtrl.focusIndex].id}}" ',
        'ng-focus="$mdSteppersCtrl.redirectFocus()" ',
        'ng-class="{ ',
        '\'md-paginated\': $mdSteppersCtrl.shouldPaginate, ',
        '\'md-center-steppers\': $mdSteppersCtrl.shouldCenterSteppers ',
        '}" ',
        'ng-keydown="$mdSteppersCtrl.keydown($event)" ',
        'role="tablist"> ',
        '<md-busy ng-show="$mdSteppersCtrl.busy">{{$mdSteppersCtrl.busyText}}</md-busy>',
        '<md-pagination-wrapper ',
        'ng-class="{ \'md-center-steppers\': $mdSteppersCtrl.shouldCenterSteppers }" ',
        'md-step-scroll="$mdSteppersCtrl.scroll($event)"> ',
        '<md-step-item ',
        'tabindex="-1" ',
        mdStepClass,
        'style="max-width: {{ $mdSteppersCtrl.maxStepWidth + \'px\' }}" ',
        'ng-repeat="step in $mdSteppersCtrl.steppers" ',
        'role="tab" ',
        'aria-controls="step-content-{{::step.id}}" ',
        'aria-selected="{{step.isActive()}}" ',
        'aria-disabled="{{step.scope.disabled || \'false\'}}" ',
        ngClick,
        'ng-class="{ ',
        '\'md-active\':    step.isActive(), ',
        '\'md-focused\':   step.hasFocus(), ',
        '\'md-disabled\':  step.scope.disabled, ',
        '\'md-complete\':  step.scope.complete ',
        '}" ',
        'ng-disabled="step.scope.disabled" ',
        'md-swipe-left="$mdSteppersCtrl.nextPage()" ',
        'md-swipe-right="$mdSteppersCtrl.previousPage()" ',
        'md-scope="::step.parent"><md-step-label-wrapper ',
        'stepindex="{{::$index+1}}" ',
        'md-steppers-template="::step.label" ',
        'md-scope="::step.parent" ',
        '></md-step-label-wrapper>',
        '</md-step-item> ',
        //'<md-ink-bar></md-ink-bar> ' ,
        '</md-pagination-wrapper> ',
        '<div class="md-visually-hidden md-dummy-wrapper"> ',
        '<md-dummy-step ',
        'class="md-step" ',
        'tabindex="-1" ',
        'stepindex="{{::$index+1}}" ',
        'id="step-item-{{::step.id}}" ',
        'role="tab" ',
        'aria-controls="step-content-{{::step.id}}" ',
        'aria-selected="{{step.isActive()}}" ',
        'aria-disabled="{{step.scope.disabled || \'false\'}}" ',
        'ng-focus="$mdSteppersCtrl.hasFocus = true" ',
        'ng-blur="$mdSteppersCtrl.hasFocus = false" ',
        'ng-repeat="step in $mdSteppersCtrl.steppers" ',
        'md-scope="::step.parent"><md-step-label-wrapper ',
        'stepindex="{{::$index+1}}" ',
        'md-steppers-template="::step.label" ',
        'md-scope="::step.parent" ',
        '></md-step-label-wrapper></md-dummy-step> ',
        '</div> ',
        '</md-steppers-canvas> ',
        '</md-steppers-wrapper> ',
        '<md-steppers-content-wrapper ng-show="$mdSteppersCtrl.hasContent && $mdSteppersCtrl.selectedIndex >= 0"> ',
        '<md-step-content ',
        'id="step-content-{{::step.id}}" ',
        'role="tabpanel" ',
        'aria-labelledby="step-item-{{::step.id}}" ',
        'md-swipe-left="$mdSteppersCtrl.swipeContent && $mdSteppersCtrl.incrementIndex(1)" ',
        'md-swipe-right="$mdSteppersCtrl.swipeContent && $mdSteppersCtrl.incrementIndex(-1)" ',
        'ng-if="$mdSteppersCtrl.hasContent" ',
        'ng-repeat="(index, step) in $mdSteppersCtrl.steppers" ',
        'ng-class="{ ',
        '\'md-no-transition\': $mdSteppersCtrl.lastSelectedIndex == null, ',
        '\'md-active\':        step.isActive(), ',
        '\'md-left\':          step.isLeft(), ',
        '\'md-right\':         step.isRight(), ',
        '\'md-no-scroll\':     $mdSteppersCtrl.dynamicHeight ',
        '}"> ',
        '<div ',
        'md-steppers-template="::step.template" ',
        'md-connected-if="step.isActive()" ',
        'md-scope="::step.parent" ',
        'ng-if="$mdSteppersCtrl.enableDisconnect || step.shouldRender()"></div> ',
        '</md-step-content> ',
        '</md-steppers-content-wrapper>'].join('');
    },
    controller: 'MdSteppersController',
    controllerAs: '$mdSteppersCtrl',
    bindToController: true
  };
}
