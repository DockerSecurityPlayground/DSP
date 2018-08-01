var dsp_copyInContainer =
{
    templateUrl: 'views/copyInContainer.html',
    bindings: {
      resolve: '<',
      close: '&',
      dismiss: '&'
    },
    controller: function ($http, Notification) {
      var $ctrl = this;
      $ctrl.hostPath = "/";
      $ctrl.containerPath = "/";

      $ctrl.$onInit = function () {
        $ctrl.lab = $ctrl.resolve.lab;
      };

      $ctrl.ok = function () {
        $ctrl.close();
      };

      $ctrl.cancel = function () {
        $ctrl.dismiss();
      };

      $ctrl.upload = function() {
          var body = {
           dockername: $ctrl.lab.namecontainer,
           hostPath :  $ctrl.hostPath,
           containerPath: $ctrl.containerPath,
         }
         $http.post('/dsp_v1/dockerupload', body)
        .then(
            function success(response) {
                Notification("File Uploaded");
            },
            function error(err) {
              // Lab running error
              Notification({message:"Server error: "+err.data.message,
                delay: 5000}, 'error');
            });
      }
    }
}
