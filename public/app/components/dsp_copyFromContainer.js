var dsp_copyFromContainer =
{
    templateUrl: 'views/copyFromContainer.html',
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

      $ctrl.getFile = function() {
        console.log("GET FILE")
         window.open($ctrl.fileDownload, '_blank');
      }
      $ctrl.download = function() {
          var body = {
           namelab: $ctrl.lab.namelab,
           namerepo: $ctrl.lab.namerepo,
           dockername: $ctrl.lab.namecontainer,
           pathContainer: $ctrl.pathSelected,
           dockercompose : $ctrl.lab.dockercompose
         }
          console.log(body)
         $http.post('/dsp_v1/dockercopy', body)
      .then(
            function success(response) {
              var ret= response.data.data;
              ret = ret.substring("public/".length, ret.length)
              console.log(ret)
              $ctrl.fileDownload  =ret
            },
            function error(err) {
              // Lab running error
              Notification({message:"Server error: "+err.data.message,
                delay: 5000}, 'error');
            });

      }
    }
}
