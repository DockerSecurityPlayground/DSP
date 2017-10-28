var dsp_copyFromContainer = 
{
    templateUrl: 'views/copyFromContainer.html',
    bindings: {
      resolve: '<',
      close: '&',
      dismiss: '&'
    },
    controller: function () {
      var $ctrl = this;
      $ctrl.pathSelected = "/"

      $ctrl.$onInit = function () {
        $ctrl.lab = $ctrl.resolve.lab;
      };

      $ctrl.ok = function () {
        $ctrl.close();
      };

      $ctrl.cancel = function () {
        $ctrl.dismiss();
      };

      $ctrl.download = function() {
        console.log($ctrl.pathSelected)
      }
    }	
}
