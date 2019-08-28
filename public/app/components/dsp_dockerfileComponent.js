var dsp_dockerfileComponent  =
  {
    templateUrl: 'views/dockerfileComponent.html',
    bindings: {
      resolve: '<',
      close: '&',
      dismiss: '&'
    },
    controller: function ($http, $scope, Notification) {
      $scope.dockerfile = "test";
      $scope.nodeSelected = function(e, data) {
        var _l = data.node.li_attr;
        alert(_l.id)
      }

      $scope.treeModel = [{
        "id": "root",
        "parent": "#",
        "text": "root",
        'state' : {
          'opened' : true,
          'selected' : true
        }
      },
        {
          "id": "dockerfile",
          "parent": "root",
          "text": "Dockerfile",
          "icon": "jstree-file"
        }
      ]
      // {
      // "id": "ajson2",
      // "parent": "#",
      // "text": "Root node 2"
      // }, {
      // "id": "ajson3",
      // "parent": "ajson2",
      // "text": "Child 1"
      // }, {
      // "id": "ajson4",
      // "parent": "ajson2",
      // "text": "Child 2"
      // }]

      // $ctrl.hostPath = "/";
      // $ctrl.containerPath = "/";

      $scope.$onInit = function () {
        // $ctrl.lab = $ctrl.resolve.lab;
      };

      $scope.ok = function () {
        $ctrl.close();
      };

      $scope.cancel = function () {
        $ctrl.dismiss();
      };

      $scope.upload = function() {
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
