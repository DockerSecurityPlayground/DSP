DSP_infoService : function DSP_infoService() {
  // State manager for notify in graph_editor
  var sm = new gp_StateManager("OK", "Hi, I'll notify here","alert alert-info")	
  sm.addState("NeedCreateNetwork", "Before drawing you have to <strong>create a network </strong>! Go to <strong>Add Network</strong> and create a network", "alert alert-warning")
  sm.addState("NeedCreateContainer", "Pls go to <strong>Container Manager</strong> and create a container", "alert alert-warning")
  sm.addState("NeedSelectContainer", "Pls <strong>select a container</strong>! ", "alert alert-warning")
  
  return {
    currentState : sm, 
    updateOK() {
            sm.updateState("OK")	
    },
    updateNeedCreateContainer() {
            sm.updateState("NeedCreateContainer")	
    },
    updateNeedNetwork() {
            sm.updateState("NeedCreateNetwork")	
    },
    updateSelectContainer() {
            sm.updateState("NeedSelectContainer")	
    }, 
    getNothigDeleteMessage() {
            return "Nothing to delete"
    },
    safeApply(operation, args) {
      if(!$scope.$$phase) {
        $scope.$apply(function() { 
          operation(args);
        });
        //$digest or $apply
        } else
          operation(args);
    }
  }
}

