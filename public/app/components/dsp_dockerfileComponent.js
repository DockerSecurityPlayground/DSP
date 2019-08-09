var dsp_dockerfileComponent  =
  {
    templateUrl: 'views/dockerfileComponent.html',
    bindings: {
      resolve: '<',
      close: '&',
      dismiss: '&'
    },
    controller: function ($http, $scope, Notification, Upload, $timeout) {
      $scope.dockerfile = "test";
      $scope.log = '';
      $scope.$watch('files', function () {
        $scope.upload($scope.files);
      });

      $scope.$watch('file', function () {
        if ($scope.file != null) {
          $scope.files = [$scope.file];
        }
      });
      $scope.upload = function (files) {
        if (files && files.length) {
          for (var i = 0; i < files.length; i++) {
            var file = files[i];
            console.log("FILE");
            console.log(file);
            // if (!file.$error) {
            //   Upload.upload({
            //     url: 'dockupload',
            //     data: {
            //       username: $scope.username,
            //       file: file
            //     }
            //   }).then(function (resp) {
            //     $timeout(function() {
            //       $scope.log = 'file: ' +
            //         resp.config.data.file.name +
            //         ', Response: ' + JSON.stringify(resp.data) +
            //         '\n' + $scope.log;
            //     });
            //   }, null, function (evt) {
            //     var progressPercentage = parseInt(100.0 *
            //       evt.loaded / evt.total);
            //     $scope.log = 'progress: ' + progressPercentage +
            //       '% ' + evt.config.data.file.name + '\n' +
            //       $scope.log;
            //   });
            }
          }
        }



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
        $scope.close();
      };

      $scope.cancel = function () {
        $scope.dismiss();
      };

    }
  }
