var dsp_dockerfileComponent  =
  {
    templateUrl: 'views/dockerfileComponent.html',
    bindings: {
      dockerfile: '='
    },
    // bindings: {
    //   resolve: '<',
    //   close: '&',
    //   dismiss: '&',
    //   dockerfile: '='
    // },
    controller: function ($http, $scope, $location, Notification, Upload, $timeout, safeApplyService, SocketService, dockerAPIService) {
/*
 *
 *
 * n
 *
        "id": "root",
        "parent": "#",
        "text": "testdockerfile",
        "content": "#",
        'state' : {
          'opened' : true,
          'selected' : true
        }*/

$scope.needToPush = true;
function _addDir(f) {
}

      function _getFileContent(f, cb) {
        var reader = new FileReader();
        reader.readAsText(f, "UTF-8");
        reader.onload = function (evt) {
          cb(null, evt.target.result);
        }
        reader.onerror = function (evt) {
          cb(new Error("error reading file"));
        }
      }
      function _getTreeElement(treeModel, id) {
        return _.findWhere(treeModel, {id: id});
      }
      function _getRoot(treeModel) {
        return _getTreeElement(treeModel, '.');
      }
      function _getDockerfile(treeModel) {
        return _getTreeElement(treeModel, './Dockerfile');
      }
      function _removeElement(treeModel, id) {
        // Remove current id
        var treeModel =  _.without(treeModel, _.findWhere(treeModel, {
          id: id}));
        _.each(treeModel, function (e) {
          console.log(e);
          // Remove parents
          if (e.parent === id) {
            treeModel = _removeElement(treeModel, e.id);
          }
        })
        return treeModel;
      }
      function _selectDockerfile(treeModel) {
        treeModel.forEach(function (t) {
          if (t.state && t.state.selected == true) {
            t.state.selected = false;
          }
          if (t.id === "./Dockerfile") {
            t.state = { selected : true }
            t.isExecutable = false;
            $scope.selectedElement= {content: t.content, selected: "Dockerfile",
              type: "textfile",
              id: "./Dockerfile",
              isExecutable : false
            };
          }
        });
      }
      function _editElement(treeModel, id, content, isExecutable) {
        console.log("EDIT");
        treeModel.forEach(function (m) {
          if (m.id === id) {
            console.log("EDIT CONTeNT");
            m.content = content;
            m.isExecutable = isExecutable;
          }
        });
        console.log(treeModel);
        return treeModel;
      }

      function _containsTreeElement(treeModel, id) {
        return _getTreeElement(treeModel, id) !== undefined
      }
      function _newNode(treeModel, parent, id, name, content, type) {
        var toAppend = {
          "id": id,
          "parent": parent,
          "text": name,
          "content": content,
          "type": type
        };
        if (type == 'textfile'){
          toAppend.icon = 'jstree-file';
          toAppend.isExecutable = false;
        }
        else toAppend.state= {
          'opened' : false,
          'selected' : false
        };
        treeModel.push(toAppend);
        $scope.selectedElement.isExecutable = toAppend.isExecutable;
        return treeModel;
        // safeApplyService.exec($scope, function() {
        //   console.log(toAppend);
        // });
      }
      function _newDirNode(treeModel, parent, id, name) {
        return _newNode(treeModel, parent, id, name, '#', 'dir');
      }
      function _newNodeToRoot(treeModel, id, name, content, type) {
        return _newNode(treeModel, '.', id, name, content, type);
      }
      function _getDirs(thePath) {
        var ret = thePath.split('/')
        ret.pop()
        return ret;
      }
      function _generateId(basePath, name) {
        if (basePath == "") {
          basePath = ".";
        }
        return basePath + "/" + name;
      }
      function _isComplexPath (p) {
        return p && p.includes('/');
      }
      function _manageUpload(f) {
        if (f.type === 'directory') {
          console.log("avoid directories");
        } else {
          var currId = ".";
          var newTreeModel = [];
          angular.copy($scope.treeModel, newTreeModel);
          // Get Path
          if (_isComplexPath(f.path)) {
            // Get dirs
            var dirs = _getDirs(f.path);
            // Iterative exploring of directories
            _.each(dirs, function(d) {
              let parentId = currId;
              currId = _generateId(currId, d);
              if (!_containsTreeElement(newTreeModel, currId))
                newTreeModel = _newDirNode(newTreeModel, parentId, currId, d)
            })
          }
          _getFileContent(f, function(err, data) {
            if (err) {
              console.log('ERROR');
            } else {
              var fileId = _generateId(currId, f.name);
              // Parent, current id, name, content, type
              newTreeModel =  _newNode(newTreeModel, currId, fileId, f.name, data, 'textfile');
            }
            safeApplyService.exec($scope, function() {
              angular.copy(newTreeModel, $scope.treeModel);
            });
          });
        }
      }
function _addCopyOptionToDockerfile(filename, treeModel) {
  var contentDockerfile = _getDockerfile(treeModel).content;
  contentDockerfile+="\nCOPY "+ filename + " /";
  _editElement(treeModel, "./Dockerfile", contentDockerfile);
  if ($scope.selectedElement.id == "./Dockerfile"); {
    $scope.selectedElement.content = contentDockerfile;
  }
}


      var $ctrl = this;
      $scope.notify = "";
      this.$onInit = function() {
        // Initialization: take the project
        dockerAPIService.getDockerfile(this.dockerfile.name)
          .then(function successCallback(response) {
            $scope.treeModel = response.data.data.map(function (e) {
              if (e.type === "dir") {
                e.state.opened = false;
              }
              return e;
            });
            console.log(response.data.data);
            _selectDockerfile($scope.treeModel);

          }, function error(response) {
            Notification({message: response.data.message}, 'error');
          });

        dockerAPIService.getSnippets()
          .then(function successCallback(response){
            $scope.snippetList = response.data.data.snippets;
            console.log("scope snippets", $scope.snippetList);
          });
      };

      // console.log(dockerfile);
      $scope.selectedElement= {}
      $scope.newFile = "";
      $scope.log = '';
      $scope.treeModel = [];
      $scope.snippets = {};
      $scope.selectedCategory = "privilege escalation"

      var rootElement = _getRoot($scope.treeModel);
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

            _manageUpload(file);
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

$scope.removeElement = function() {
  if ($scope.selectedElement.id == './Dockerfile' ||  $scope.selectedElement.id == '.') {
    Notification('Cannot remove root or Dockerfile element', 'warning');
  } else {
    var newTreeModel = [];
    angular.copy($scope.treeModel, newTreeModel)
    $scope.treeModel = _removeElement($scope.treeModel, $scope.selectedElement.id);
    // safeApplyService.exec($scope, function() {
    // angular.copy(newTreeModel, $scope.treeModel);
    // });
  }
}

$scope.changedSnippet = function(selectedSnippet){

  if($scope.selectedElement.content.match(/^FROM.*/)){
    $scope.selectedElement.content = $scope.selectedElement.content + "\n\n" + "#" + selectedSnippet.name + "\n" + selectedSnippet.code
    const previousImage = $scope.selectedElement.content.substring(0,$scope.selectedElement.content.indexOf("\n\n"))
    const newImage = selectedSnippet.image
    const newContent = $scope.selectedElement.content.replace(previousImage, "FROM " + newImage)
    $scope.selectedElement.content = newContent
  }
  else{
    $scope.selectedElement.content = "FROM " + selectedSnippet.image + "\n\n" + $scope.selectedElement.content  + "#" + selectedSnippet.name + "\n" + selectedSnippet.code
  }
}

$scope.undoChangeSnippet = function(selectedSnippet){
  $scope.selectedElement.content = $scope.selectedElement.content.replace(selectedSnippet.code, "")
  $scope.selectedElement.content = $scope.selectedElement.content.replace("#" + selectedSnippet.name + "\n", "")
}

$scope.changedCategory = function(category){
  $scope.selectedCategory = category
}

$scope.nodeSelected = function(e, data) {
  var _l = data.node.li_attr;
  var content = data.node.original.content
  var type = data.node.original.type
  var isExecutable = data.node.original.isExecutable
  console.log(data);
  safeApplyService.exec($scope, function() {
    _editElement($scope.treeModel, $scope.selectedElement.id, $scope.selectedElement.content, $scope.selectedElement.isExecutable)
    $scope.selectedElement.content = content;
    $scope.selectedElement.type = type;
    $scope.selectedElement.isExecutable = isExecutable;
    $scope.selectedElement.selected = data.node.original.text;
    $scope.selectedElement.id = data.node.original.id;
  })
}


$scope.tagImage = "latest";
$scope.goToImages = function() {
  $location.url('/images');
}
$scope.saveDockerfile = function() {
  if ($scope.selectedElement.type !== "dir") {
    _editElement($scope.treeModel, $scope.selectedElement.id, $scope.selectedElement.content, $scope.selectedElement.isExecutable)
  }
  var toSend = {
    name: $ctrl.dockerfile.name,
    content: _.filter($scope.treeModel, function (e) {return e.id !== '.'})
  }
  console.log(toSend);

  dockerAPIService.editDockerfile(toSend)
    .then(function successCallback(response) {
      $scope.build();
      Notification("Success");
    },function errorCallback(response) {
      Notification({message: response.data.message}, 'error');
    });
};
$scope.addNewFile = function() {
  // If root or no dir save in root
  if ($scope.selectedElement.id == "." || $scope.selectedElement.type !== "dir") {
    _newNode($scope.treeModel, ".", "./"+$scope.newFile, $scope.newFile,  "", "textfile");
  } else {
    _newNode($scope.treeModel, $scope.selectedElement.id, $scope.selectedElement+ "/" + $scope.newFile, $scope.newFile, "", "textfile");
  }
  $scope.newFile = "";
}

$scope.saveExecutable = function() {
  if ($scope.selectedElement.type !== "dir") {
  safeApplyService.exec($scope, function() {
    _editElement($scope.treeModel, $scope.selectedElement.id, $scope.selectedElement.content, $scope.selectedElement.isExecutable)
  });
  }
  console.log($scope.treeModel);
}
$scope.clearBuild = function() {
  $scope.notify = "";
}

$scope.build = function() {
  $scope.notify = "";
  //Send
  SocketService.manage(JSON.stringify({
    action : 'docker_build',
    params : {
      dockerfile : $ctrl.dockerfile.name,
      needToPush: $scope.needToPush,
      tagImage: $scope.tagImage
    }
  }), function(event) {
    var data = JSON.parse(event.data);
    switch (data.status) {
      case 'success':
        Notification("Build finished!", 'success');
        console.log("SUCCESS");
        break;
      case 'error':
        Notification({message: data.message}, 'error');
        break;
      default:
        console.log("Update");
        $scope.notify += data.message;
        console.log(data.message);
        break

    }
  })
}

$scope.ok = function () {
  $scope.close();
};

$scope.cancel = function () {
  $scope.dismiss();
};

}
}
