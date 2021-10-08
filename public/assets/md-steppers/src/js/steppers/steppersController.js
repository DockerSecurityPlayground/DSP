angular
  .module('md-steppers')
  .controller('MdSteppersController', MdSteppersController);

/**
 * @ngInject
 */
function MdSteppersController($scope, $element, $window, $mdConstant, $mdStepInkRipple,
  $mdUtil, $animateCss, $attrs, $compile, $mdTheming) {
  // define private properties
  var ctrl = this,
    locked = false,
    elements = getElements(),
    queue = [],
    destroyed = false,
    loaded = false;

  // define one-way bindings
  defineOneWayBinding('stretchSteppers', handleStretchSteppers);

  // define public properties with change handlers
  defineProperty('focusIndex', handleFocusIndexChange, ctrl.selectedIndex || 0);
  defineProperty('offsetLeft', handleOffsetChange, 0);
  defineProperty('hasContent', handleHasContent, false);
  defineProperty('maxStepWidth', handleMaxStepWidth, getMaxStepWidth());
  defineProperty('shouldPaginate', handleShouldPaginate, false);

  // define boolean attributes
  defineBooleanAttribute('noInkBar', handleInkBar, true);
  defineBooleanAttribute('dynamicHeight', handleDynamicHeight);
  defineBooleanAttribute('noPagination');
  defineBooleanAttribute('swipeContent');
  defineBooleanAttribute('noDisconnect');
  defineBooleanAttribute('autoselect');
  defineBooleanAttribute('centerSteppers', handleCenterSteppers, true);
  defineBooleanAttribute('enableDisconnect');

  // define public properties
  ctrl.scope = $scope;
  ctrl.parent = $scope.$parent;
  ctrl.steppers = [];
  ctrl.lastSelectedIndex = null;
  ctrl.hasFocus = false;
  ctrl.lastClick = true;
  ctrl.shouldCenterSteppers = shouldCenterSteppers();

  // define public methods
  ctrl.updatePagination = $mdUtil.debounce(updatePagination, 100);
  ctrl.redirectFocus = redirectFocus;
  ctrl.attachRipple = attachRipple;
  ctrl.insertStep = insertStep;
  ctrl.removeStep = removeStep;
  ctrl.select = select;
  ctrl.scroll = scroll;
  ctrl.nextPage = nextPage;
  ctrl.previousPage = previousPage;
  ctrl.keydown = keydown;
  ctrl.canPageForward = canPageForward;
  ctrl.canPageBack = canPageBack;
  ctrl.refreshIndex = refreshIndex;
  ctrl.incrementIndex = incrementIndex;
  ctrl.getStepElementIndex = getStepElementIndex;
  ctrl.updateInkBarStyles = $mdUtil.debounce(updateInkBarStyles, 100);
  ctrl.updateStepOrder = $mdUtil.debounce(updateStepOrder, 100);

  init();

  /**
   * Perform initialization for the controller, setup events and watcher(s)
   */
  function init() {
    ctrl.selectedIndex = ctrl.selectedIndex || 0;
    compileTemplate();
    configureWatchers();
    bindEvents();
    $mdTheming($element);
    $mdUtil.nextTick(function() {
      updateHeightFromContent();
      adjustOffset();
      updateInkBarStyles();
      ctrl.steppers[ctrl.selectedIndex] && ctrl.steppers[ctrl.selectedIndex].scope.select();
      loaded = true;
      updatePagination();
    });
  }

  /**
   * Compiles the template provided by the user.  This is passed as an attribute from the steppers
   * directive's template function.
   */
  function compileTemplate() {
    var template = $attrs.$mdSteppersTemplate,
      element = angular.element(elements.data);
    element.html(template);
    $compile(element.contents())(ctrl.parent);
    delete $attrs.$mdSteppersTemplate;
  }

  /**
   * Binds events used by the steppers component.
   */
  function bindEvents() {
    angular.element($window).on('resize', handleWindowResize);
    $scope.$on('$destroy', cleanup);
  }

  /**
   * Configure watcher(s) used by Steppers
   */
  function configureWatchers() {
    $scope.$watch('$mdSteppersCtrl.selectedIndex', handleSelectedIndexChange);
  }

  /**
   * Creates a one-way binding manually rather than relying on Angular's isolated scope
   * @param key
   * @param handler
   */
  function defineOneWayBinding(key, handler) {
    var attr = $attrs.$normalize('md-' + key);
    if (handler) defineProperty(key, handler);
    $attrs.$observe(attr, function(newValue) {
      ctrl[key] = newValue;
    });
  }

  /**
   * Defines boolean attributes with default value set to true.  (ie. md-stretch-steppers with no value
   * will be treated as being truthy)
   * @param key
   * @param handler
   */
  function defineBooleanAttribute(key, handler) {
    var attr = $attrs.$normalize('md-' + key);
    if (handler) defineProperty(key, handler);
    if ($attrs.hasOwnProperty(attr)) updateValue($attrs[attr]);
    $attrs.$observe(attr, updateValue);
    function updateValue(newValue) {
      ctrl[key] = newValue !== 'false';
    }
  }

  /**
   * Remove any events defined by this controller
   */
  function cleanup() {
    destroyed = true;
    angular.element($window).off('resize', handleWindowResize);
  }

  // Change handlers

  /**
   * Toggles stretch steppers class and updates inkbar when step stretching changes
   * @param stretchSteppers
   */
  function handleStretchSteppers(stretchSteppers) {
    angular.element(elements.wrapper).toggleClass('md-stretch-steppers', shouldStretchSteppers());
    updateInkBarStyles();
  }

  function handleCenterSteppers(newValue) {
    ctrl.shouldCenterSteppers = shouldCenterSteppers();
  }

  function handleMaxStepWidth(newWidth, oldWidth) {
    if (newWidth !== oldWidth) {
      $mdUtil.nextTick(ctrl.updateInkBarStyles);
    }
  }

  function handleShouldPaginate(newValue, oldValue) {
    if (newValue !== oldValue) {
      ctrl.maxStepWidth = getMaxStepWidth();
      ctrl.shouldCenterSteppers = shouldCenterSteppers();
      $mdUtil.nextTick(function() {
        ctrl.maxStepWidth = getMaxStepWidth();
        adjustOffset(ctrl.selectedIndex);
      });
    }
  }

  /**
   * Add/remove the `md-no-step-content` class depending on `ctrl.hasContent`
   * @param hasContent
   */
  function handleHasContent(hasContent) {
    $element[hasContent ? 'removeClass' : 'addClass']('md-no-step-content');
  }

  /**
   * Apply ctrl.offsetLeft to the paging element when it changes
   * @param left
   */
  function handleOffsetChange(left) {
    var newValue = ctrl.shouldCenterSteppers ? '' : '-' + left + 'px';
    angular.element(elements.paging).css($mdConstant.CSS.TRANSFORM, 'translate3d(' + newValue + ', 0, 0)');
    $scope.$broadcast('$mdSteppersPaginationChanged');
  }

  /**
   * Update the UI whenever `ctrl.focusIndex` is updated
   * @param newIndex
   * @param oldIndex
   */
  function handleFocusIndexChange(newIndex, oldIndex) {
    if (newIndex === oldIndex) return;
    if (!elements.steppers[newIndex]) return;
    adjustOffset();
    redirectFocus();
  }

  /**
   * Update the UI whenever the selected index changes. Calls user-defined select/deselect methods.
   * @param newValue
   * @param oldValue
   */
  function handleSelectedIndexChange(newValue, oldValue) {
    if (newValue === oldValue) return;

    ctrl.selectedIndex = getNearestSafeIndex(newValue);
    ctrl.lastSelectedIndex = oldValue;
    ctrl.updateInkBarStyles();
    updateHeightFromContent();
    adjustOffset(newValue);
    $scope.$broadcast('$mdSteppersChanged');
    ctrl.steppers[oldValue] && ctrl.steppers[oldValue].scope.deselect();
    ctrl.steppers[newValue] && ctrl.steppers[newValue].scope.select();
  }

  function getStepElementIndex(stepEl) {
    var steppers = $element[0].getElementsByTagName('md-step');
    return Array.prototype.indexOf.call(steppers, stepEl[0]);
  }

  /**
   * Queues up a call to `handleWindowResize` when a resize occurs while the steppers component is
   * hidden.
   */
  function handleResizeWhenVisible() {
    // if there is already a watcher waiting for resize, do nothing
    if (handleResizeWhenVisible.watcher) return;
    // otherwise, we will abuse the $watch function to check for visible
    handleResizeWhenVisible.watcher = $scope.$watch(function() {
      // since we are checking for DOM size, we use $mdUtil.nextTick() to wait for after the DOM updates
      $mdUtil.nextTick(function() {
        // if the watcher has already run (ie. multiple digests in one cycle), do nothing
        if (!handleResizeWhenVisible.watcher) return;

        if ($element.prop('offsetParent')) {
          handleResizeWhenVisible.watcher();
          handleResizeWhenVisible.watcher = null;

          handleWindowResize();
        }
      }, false);
    });
  }

  // Event handlers / actions

  /**
   * Handle user keyboard interactions
   * @param event
   */
  function keydown(event) {
    switch (event.keyCode) {
      case $mdConstant.KEY_CODE.LEFT_ARROW:
        event.preventDefault();
        incrementIndex(-1, true);
        break;
      case $mdConstant.KEY_CODE.RIGHT_ARROW:
        event.preventDefault();
        incrementIndex(1, true);
        break;
      case $mdConstant.KEY_CODE.SPACE:
      case $mdConstant.KEY_CODE.ENTER:
        event.preventDefault();
        if (!locked)
          ctrl.selectedIndex = ctrl.focusIndex;
        break;
    }
    ctrl.lastClick = false;
  }

  /**
   * Update the selected index and trigger a click event on the original `md-step` element in order
   * to fire user-added click events.
   * @param index
   */
  function select(index) {
    if (!locked)
      ctrl.focusIndex = ctrl.selectedIndex = index;
    ctrl.lastClick = true;
    // nextTick is required to prevent errors in user-defined click events
    $mdUtil.nextTick(function() {
      ctrl.steppers[index].element.triggerHandler('click');
    }, false);
  }

  /**
   * When pagination is on, this makes sure the selected index is in view.
   * @param event
   */
  function scroll(event) {
    if (!ctrl.shouldPaginate) return;
    event.preventDefault();
    ctrl.offsetLeft = fixOffset(ctrl.offsetLeft - event.wheelDelta);
  }

  /**
   * Slides the steppers over approximately one page forward.
   */
  function nextPage() {
    var viewportWidth = elements.canvas.clientWidth,
      totalWidth = viewportWidth + ctrl.offsetLeft,
      i,
      step;
    for (i = 0; i < elements.steppers.length; i++) {
      step = elements.steppers[i];
      if (step.offsetLeft + step.offsetWidth > totalWidth) break;
    }
    ctrl.offsetLeft = fixOffset(step.offsetLeft);
  }

  /**
   * Slides the steppers over approximately one page backward.
   */
  function previousPage() {
    var i,
      step;
    for (i = 0; i < elements.steppers.length; i++) {
      step = elements.steppers[i];
      if (step.offsetLeft + step.offsetWidth >= ctrl.offsetLeft) break;
    }
    ctrl.offsetLeft = fixOffset(step.offsetLeft + step.offsetWidth - elements.canvas.clientWidth);
  }

  /**
   * Update size calculations when the window is resized.
   */
  function handleWindowResize() {
    ctrl.lastSelectedIndex = ctrl.selectedIndex;
    ctrl.offsetLeft = fixOffset(ctrl.offsetLeft);
    $mdUtil.nextTick(function() {
      ctrl.updateInkBarStyles();
      updatePagination();
    });
  }

  function handleInkBar(hide) {
    angular.element(elements.inkBar).toggleClass('ng-hide', hide);
  }

  /**
   * Toggle dynamic height class when value changes
   * @param value
   */
  function handleDynamicHeight(value) {
    $element.toggleClass('md-dynamic-height', value);
  }

  /**
   * Remove a step from the data and select the nearest valid step.
   * @param stepData
   */
  function removeStep(stepData) {
    if (destroyed) return;
    var selectedIndex = ctrl.selectedIndex,
      step = ctrl.steppers.splice(stepData.getIndex(), 1)[0];
    refreshIndex();
    // when removing a step, if the selected index did not change, we have to manually trigger the
    //   step select/deselect events
    if (ctrl.selectedIndex === selectedIndex) {
      step.scope.deselect();
      ctrl.steppers[ctrl.selectedIndex] && ctrl.steppers[ctrl.selectedIndex].scope.select();
    }
    $mdUtil.nextTick(function() {
      updatePagination();
      ctrl.offsetLeft = fixOffset(ctrl.offsetLeft);
    });
  }

  /**
   * Create an entry in the steppers array for a new step at the specified index.
   * @param stepData
   * @param index
   * @returns {*}
   */
  function insertStep(stepData, index) {
    var hasLoaded = loaded;
    var proto = {
        getIndex: function() {
          return ctrl.steppers.indexOf(step);
        },
        isActive: function() {
          return this.getIndex() === ctrl.selectedIndex;
        },
        isLeft: function() {
          return this.getIndex() < ctrl.selectedIndex;
        },
        isRight: function() {
          return this.getIndex() > ctrl.selectedIndex;
        },
        shouldRender: function() {
          return !ctrl.noDisconnect || this.isActive();
        },
        hasFocus: function() {
          return !ctrl.lastClick
            && ctrl.hasFocus && this.getIndex() === ctrl.focusIndex;
        },
        id: $mdUtil.nextUid()
      },
      step = angular.extend(proto, stepData);
    if (angular.isDefined(index)) {
      ctrl.steppers.splice(index, 0, step);
    } else {
      ctrl.steppers.push(step);
    }
    processQueue();
    updateHasContent();
    $mdUtil.nextTick(function() {
      updatePagination();
      // if autoselect is enabled, select the newly added step
      if (hasLoaded && ctrl.autoselect) $mdUtil.nextTick(function() {
          $mdUtil.nextTick(function() {
            select(ctrl.steppers.indexOf(step));
          });
        });
    });
    return step;
  }

  // Getter methods

  /**
   * Gathers references to all of the DOM elements used by this controller.
   * @returns {{}}
   */
  function getElements() {
    var elements = {};

    // gather step bar elements
    elements.wrapper = $element[0].getElementsByTagName('md-steppers-wrapper')[0];
    elements.data = $element[0].getElementsByTagName('md-step-data')[0];
    elements.canvas = elements.wrapper.getElementsByTagName('md-steppers-canvas')[0];
    elements.paging = elements.canvas.getElementsByTagName('md-pagination-wrapper')[0];
    elements.steppers = elements.paging.getElementsByTagName('md-step-item');
    elements.dummies = elements.canvas.getElementsByTagName('md-dummy-step');
    elements.inkBar = elements.paging.getElementsByTagName('md-ink-bar')[0];

    // gather step content elements
    elements.contentsWrapper = $element[0].getElementsByTagName('md-steppers-content-wrapper')[0];
    elements.contents = elements.contentsWrapper.getElementsByTagName('md-step-content');

    return elements;
  }

  /**
   * Determines whether or not the left pagination arrow should be enabled.
   * @returns {boolean}
   */
  function canPageBack() {
    return ctrl.offsetLeft > 0;
  }

  /**
   * Determines whether or not the right pagination arrow should be enabled.
   * @returns {*|boolean}
   */
  function canPageForward() {
    var lastStep = elements.steppers[elements.steppers.length - 1];
    return lastStep && lastStep.offsetLeft + lastStep.offsetWidth > elements.canvas.clientWidth +
      ctrl.offsetLeft;
  }

  /**
   * Determines if the UI should stretch the steppers to fill the available space.
   * @returns {*}
   */
  function shouldStretchSteppers() {
    switch (ctrl.stretchSteppers) {
      case 'always':
        return true;
      case 'never':
        return false;
      default:
        return !ctrl.shouldPaginate
          && $window.matchMedia('(max-width: 600px)').matches;
    }
  }

  /**
   * Determines if the steppers should appear centered.
   * @returns {string|boolean}
   */
  function shouldCenterSteppers() {
    return ctrl.centerSteppers && !ctrl.shouldPaginate;
  }

  /**
   * Determines if pagination is necessary to display the steppers within the available space.
   * @returns {boolean}
   */
  function shouldPaginate() {
    if (ctrl.noPagination || !loaded) return false;
    var canvasWidth = $element.prop('clientWidth');
    angular.forEach(getElements().dummies, function(step) {
      canvasWidth -= step.offsetWidth;
    });
    return canvasWidth < 0;
  }

  /**
   * Finds the nearest step index that is available.  This is primarily used for when the active
   * step is removed.
   * @param newIndex
   * @returns {*}
   */
  function getNearestSafeIndex(newIndex) {
    if (newIndex === -1) return -1;
    var maxOffset = Math.max(ctrl.steppers.length - newIndex, newIndex),
      i,
      step;
    for (i = 0; i <= maxOffset; i++) {
      step = ctrl.steppers[newIndex + i];
      if (step && (step.scope.disabled !== true)) return step.getIndex();
      step = ctrl.steppers[newIndex - i];
      if (step && (step.scope.disabled !== true)) return step.getIndex();
    }
    return newIndex;
  }

  // Utility methods

  /**
   * Defines a property using a getter and setter in order to trigger a change handler without
   * using `$watch` to observe changes.
   * @param key
   * @param handler
   * @param value
   */
  function defineProperty(key, handler, value) {
    Object.defineProperty(ctrl, key, {
      get: function() {
        return value;
      },
      set: function(newValue) {
        var oldValue = value;
        value = newValue;
        handler && handler(newValue, oldValue);
      }
    });
  }

  /**
   * Updates whether or not pagination should be displayed.
   */
  function updatePagination() {
    if (!shouldStretchSteppers()) updatePagingWidth();
    ctrl.maxStepWidth = getMaxStepWidth();
    ctrl.shouldPaginate = shouldPaginate();
  }

  function updatePagingWidth() {
    var width = 1;
    angular.forEach(getElements().dummies, function(element) {
      width += Math.ceil(element.offsetWidth);
    });
    angular.element(elements.paging).css('width', width + 'px');
  }

  function getMaxStepWidth() {
    return $element.prop('clientWidth');
  }

  /**
   * Re-orders the steppers and updates the selected and focus indexes to their new positions.
   * This is triggered by `stepDirective.js` when the user's steppers have been re-ordered.
   */
  function updateStepOrder() {
    var selectedItem = ctrl.steppers[ctrl.selectedIndex],
      focusItem = ctrl.steppers[ctrl.focusIndex];
    ctrl.steppers = ctrl.steppers.sort(function(a, b) {
      return a.index - b.index;
    });
    ctrl.selectedIndex = ctrl.steppers.indexOf(selectedItem);
    ctrl.focusIndex = ctrl.steppers.indexOf(focusItem);
  }

  /**
   * This moves the selected or focus index left or right.  This is used by the keydown handler.
   * @param inc
   */
  function incrementIndex(inc, focus) {
    var newIndex,
      key = focus ? 'focusIndex' : 'selectedIndex',
      index = ctrl[key];
    for (newIndex = index + inc;
      ctrl.steppers[newIndex] && ctrl.steppers[newIndex].scope.disabled;
      newIndex += inc) {
    }
    if (ctrl.steppers[newIndex]) {
      ctrl[key] = newIndex;
    }
  }

  /**
   * This is used to forward focus to dummy elements.  This method is necessary to avoid animation
   * issues when attempting to focus an item that is out of view.
   */
  function redirectFocus() {
    getElements().dummies[ctrl.focusIndex].focus();
  }

  /**
   * Forces the pagination to move the focused step into view.
   */
  function adjustOffset(index) {
    if (index == null)
      index = ctrl.focusIndex;
    if (!elements.steppers[index]) return;
    if (ctrl.shouldCenterSteppers) return;
    var step = elements.steppers[index],
      left = step.offsetLeft,
      right = step.offsetWidth + left;
    ctrl.offsetLeft = Math.max(ctrl.offsetLeft, fixOffset(right - elements.canvas.clientWidth + 32 * 2));
    ctrl.offsetLeft = Math.min(ctrl.offsetLeft, fixOffset(left));
  }

  /**
   * Iterates through all queued functions and clears the queue.  This is used for functions that
   * are called before the UI is ready, such as size calculations.
   */
  function processQueue() {
    queue.forEach(function(func) {
      $mdUtil.nextTick(func);
    });
    queue = [];
  }

  /**
   * Determines if the step content area is needed.
   */
  function updateHasContent() {
    var hasContent = false;
    angular.forEach(ctrl.steppers, function(step) {
      if (step.template)
        hasContent = true;
    });
    ctrl.hasContent = hasContent;
  }

  /**
   * Moves the indexes to their nearest valid values.
   */
  function refreshIndex() {
    ctrl.selectedIndex = getNearestSafeIndex(ctrl.selectedIndex);
    ctrl.focusIndex = getNearestSafeIndex(ctrl.focusIndex);
  }

  /**
   * Calculates the content height of the current step.
   * @returns {*}
   */
  function updateHeightFromContent() {
    if (!ctrl.dynamicHeight) return $element.css('height', '');
    if (!ctrl.steppers.length) return queue.push(updateHeightFromContent);

    var stepContent = elements.contents[ctrl.selectedIndex],
      contentHeight = stepContent ? stepContent.offsetHeight : 0,
      steppersHeight = elements.wrapper.offsetHeight,
      newHeight = contentHeight + steppersHeight,
      currentHeight = $element.prop('offsetHeight');

    // Adjusts calculations for when the buttons are bottom-aligned since this relies on absolute
    // positioning.  This should probably be cleaned up if a cleaner solution is possible.
    if ($element.attr('md-align-steppers') === 'bottom') {
      currentHeight -= steppersHeight;
      newHeight -= steppersHeight;
      // Need to include bottom border in these calculations
      if ($element.attr('md-border-bottom') !== undefined) ++currentHeight;
    }

    // Lock during animation so the user can't change steppers
    locked = true;

    var fromHeight = {
        height: currentHeight + 'px'
      },
      toHeight = {
        height: newHeight + 'px'
      };

    // Set the height to the current, specific pixel height to fix a bug on iOS where the height
    // first animates to 0, then back to the proper height causing a visual glitch
    $element.css(fromHeight);

    // Animate the height from the old to the new
    $animateCss($element, {
      from: fromHeight,
      to: toHeight,
      easing: 'cubic-bezier(0.35, 0, 0.25, 1)',
      duration: 0.5
    }).start().done(function() {
      // Then (to fix the same iOS issue as above), disable transitions and remove the specific
      // pixel height so the height can size with browser width/content changes, etc.
      $element.css({
        transition: 'none',
        height: ''
      });

      // In the next tick, re-allow transitions (if we do it all at once, $element.css is "smart"
      // enough to batch it for us instead of doing it immediately, which undoes the original
      // transition: none)
      $mdUtil.nextTick(function() {
        $element.css('transition', '');
      });

      // And unlock so step changes can occur
      locked = false;
    });
  }

  /**
   * Repositions the ink bar to the selected step.
   * @returns {*}
   */
  function updateInkBarStyles() {
    if (!elements.steppers[ctrl.selectedIndex]) {
      angular.element(elements.inkBar).css({
        left: 'auto',
        right: 'auto'
      });
      return;
    }
    if (!ctrl.steppers.length) return queue.push(ctrl.updateInkBarStyles);
    // if the element is not visible, we will not be able to calculate sizes until it is
    // we should treat that as a resize event rather than just updating the ink bar
    if (!$element.prop('offsetParent')) return handleResizeWhenVisible();
    var index = ctrl.selectedIndex,
      totalWidth = elements.paging.offsetWidth,
      step = elements.steppers[index],
      left = step.offsetLeft,
      right = totalWidth - left - step.offsetWidth,
      stepWidth;
    if (ctrl.shouldCenterSteppers) {
      stepWidth = Array.prototype.slice.call(elements.steppers).reduce(function(value, element) {
        return value + element.offsetWidth;
      }, 0);
      if (totalWidth > stepWidth) $mdUtil.nextTick(updateInkBarStyles, false);
    }
    updateInkBarClassName();
    //angular.element(elements.inkBar).css({ left: left + 'px', right: right + 'px' });
    angular.element(elements.inkBar).css({
      left: 32 + 'px',
      right: totalWidth - left + 'px'
    });
  }

  /**
   * Adds left/right classes so that the ink bar will animate properly.
   */
  function updateInkBarClassName() {
    var newIndex = ctrl.selectedIndex,
      oldIndex = ctrl.lastSelectedIndex,
      ink = angular.element(elements.inkBar);
    if (!angular.isNumber(oldIndex)) return;
    ink
      .toggleClass('md-left', newIndex < oldIndex)
      .toggleClass('md-right', newIndex > oldIndex);
  }

  /**
   * Takes an offset value and makes sure that it is within the min/max allowed values.
   * @param value
   * @returns {*}
   */
  function fixOffset(value) {
    if (!elements.steppers.length || !ctrl.shouldPaginate) return 0;
    var lastStep = elements.steppers[elements.steppers.length - 1],
      totalWidth = lastStep.offsetLeft + lastStep.offsetWidth;
    value = Math.max(0, value);
    value = Math.min(totalWidth - elements.canvas.clientWidth, value);
    return value;
  }

  /**
   * Attaches a ripple to the step item element.
   * @param scope
   * @param element
   */
  function attachRipple(scope, element) {
    if (!ctrl.disableTabsBehavior) {
      var options = {
        colorElement: angular.element(elements.inkBar)
      };
      $mdStepInkRipple.attach(scope, element, options);
    }
  }
}
