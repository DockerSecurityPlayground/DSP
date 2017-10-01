var dsp_changeGithub = 
{
  templateUrl: 'views/changeGithub.html',
  bindings: {
    resolve: '<',
    close: '&',
    dismiss: '&'
  },
  controller: function () {
    var $ctrl = this;

    $ctrl.$onInit = function () {
      $ctrl.lab = $ctrl.resolve.lab;
    };

    $ctrl.ok = function () {
      $ctrl.close();
    };

    $ctrl.cancel = function () {
      $ctrl.dismiss();
    };
  }	
}
