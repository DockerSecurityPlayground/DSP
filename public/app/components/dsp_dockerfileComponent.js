var dsp_dockerfileComponent = {
  templateUrl: 'views/dockerfileComponent.html',
  bindings: {
    resolve: '<',
    close: '&',
    dismiss: '&'
  },
  controller: function ($http, Notification) {
    var $ctrl = this;
    $ctrl.pathSelected = "/"
    $ctrl.fileDownload = ""

    $ctrl.$onInit = function () {
      console.log("INIZIALIZAT");
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
