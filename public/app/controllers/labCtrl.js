var dsp_LabCtrl = function ($scope, $window, ServerResponse, $log, SocketService, dockerImagesService, dockerAPIService, $routeParams, $sce, SafeApply, $document, $uibModal, $location, $http, cfpLoadingBar, CurrentLabService, CleanerService, BreadCrumbs, AjaxService, $sce, containerManager, WalkerService, Notification) {
  console.log("=== INIT LAB CONTROLLER ===");
  var userDir;
  var vm = this;
  var buttonDeleteProto = { action: openConfirmDelete, label: "Delete Lab", class: "btn btn-danger", icon: 'fa fa-fw fa-remove' }
  var buttonImportProto = { action: importLab, label: "Import lab in your repo", class: "btn btn-primry", icon: "fa fa-fw fa-upload" }
  var buttonGoProto = { action: goToUseNetwork, label: "Go", class: "btn btn-lg btn-primary", icon: '' }
  var buttonGoDisabledProto = { action: goToUseNetwork, label: "Go", class: "btn btn-lg btn-blue disabled", icon: '' }
  var buttonGoImage = { action: goToImages, label: "Images", class: "btn btn-lg btn-primary", icon: '' }
  var buttonCreateProto = { action: goToCreateNetwork, label: "Create Docker Network", class: "btn  btn-lg btn-success", icon: '' }
  var onLoadCanvas;
  var oldGoal = "";
  var oldSolution = "";
  const warningMessageHeader = 'WARNING: ';
  const networkEmptyMessage = 'Network is empty! Have you drawn the containers?';
  $scope.currentName = "";
  $scope.active = 0;
  $scope.isAlertClosed = false;
  $scope.tags = [{
    name: "{{hostname}}",
    description: "it is converted to hostname (i.e. localhost) "
  }, {
    name: "{{url}}",
    description: "it is converted to DSP url (i.e. http://localhost )"
  }]

  $scope.closeAlert = function () {
    $scope.isAlertClosed = true;

  }

  $scope.registerCallback = function (cb) {
    onLoadCanvas = cb;
  }

  $scope.trustedHtml = function (plainText) {
    return $sce.trustAsHtml(plainText);
  }

  $scope.markdown = "";
  // MARKDOWN Functions
    $scope.md2Html = function() {
      $scope.html = $window.marked($scope.markdown);
      $scope.htmlSafe = $sce.trustAsHtml($scope.html);
    };

  // On change markdown variable, update information
  $scope.$watch('markdown', function(newValue, oldValue) {
    vm.lab.readme = $scope.markdown;
    // Update preview
    SafeApply.exec($scope, function() {
      $scope.initFromText(newValue);
    });
  });

  $scope.initFromText = function(text) {
        $scope.markdown = text;
        return $scope.md2Html();
  };

    // MARKDOWN End
    $scope.isImported = false;


  $scope.tinymceOptions = {
    onChange: function (e) {
      // put logic here for keypress and cut/paste changes
    },
    inline: false,
    plugins: 'textpattern advlist autolink link image lists charmap print preview',
    skin: 'lightgray',
    theme: 'modern',
    // textpattern_patterns: [
    //      {start: '*', end: '*', format: 'italic'},
    //      {start: '**', end: '**', format: 'bold'},
    //      {start: '#', format: 'h1'},
    //      {start: '##', format: 'h2'},
    //      {start: '###', format: 'h3'},
    //      {start: '####', format: 'h4'},
    //      {start: '#####', format: 'h5'},
    //      {start: '######', format: 'h6'},
    //      {start: '1. ', cmd: 'InsertOrderedList'},
    //      {start: '* ', cmd: 'InsertUnorderedList'},
    //      {start: '- ', cmd: 'InsertUnorderedList'}
    // ]

  };

  vm.tinymceHtmlGoal = ''
  vm.tinymceHtmlSolution = ''
  //Button action create or go
  vm.buttonAction = buttonCreateProto
  //Button action import or delete
  vm.deleteImportButton = buttonDeleteProto
  $scope.CurrentLabService = CurrentLabService;
  vm.editVisible = false
  vm.repos,
  vm.lab = {},
  vm.labels = [],
  // Preview on the labs
  vm.previewSolution = '';
  vm.previewGoal = '';
  vm.isRunning;
  vm.exists = true;

  vm.isReadme = true;
  vm.isReadmePreviewOpen = false;

  vm.isGoalEditShowed = true;
  vm.isSolutionEditShowed = true;
  vm.isSolutionPreviewOpen = false;
  vm.isGoalPreviewOpen = false;
  vm.noImages = false;
  vm.actionVisible = true,
  $scope.imageList = [];
  $scope.interactiveImageList = [];
  $scope.listTools = [];
  var toEditName = '';
  $scope.listContainers = {};
  $scope.init = function () {
    console.log("DSP_INIT");

    AjaxService.init()
      .dLabel
      .then(function (res) {
        vm.labelProjects = AjaxService.projectLabels.labels
      },
        function (err) {

        })

    var action = $routeParams.action;
    // USE MODE
    function initLabInformation(reponame) {
      console.log("Init lab information")
      var labname = $routeParams.namelab;
      AjaxService.getLabInfo(reponame, labname)
        .then(function (res) {
          const information = res.data.data;
          if (information.readme) {
            SafeApply.exec($scope, function() {
              $scope.initFromText(information.readme);

            });
            // Otherwise, set index to graph index
          } else {
            $scope.active = 1;
          }
              // It means that is an imported compose
              AjaxService.isReadOnlyLab(reponame, labname)
              .then(function (res) {
                $scope.isImported = res.data.data;
                if ($scope.isImported)
                  // Update only if it not exist readme ( located on index 1 - graph)
                  $scope.active = $scope.active ? 2 : 0;

              }, function (err) {

                });
        }, function (err) {
          Notification({ message: "Server error: " + err.data.message }, 'error');
      })
    }

    function initLabUserInformation() {
      var labname = $routeParams.namelab;
      AjaxService.getUserLab(labname)
        .then(function (res) {
          console.log("SUCCESS");
          const information = res.data.data;
          if (information.readme) {
            SafeApply.exec($scope, function() {
              $scope.initFromText(information.readme);

            });
          }
        }, function (err) {
          Notification({ message: "Server error: " + err.data.message }, 'error');
      })
    }
    if (action === 'new') {
      //		console.log("action new")
      $scope.lab_action_btn = { text: "Create", class: "btn btn-success" }
      $scope.lab_action = 'New lab '
      BreadCrumbs.breadCrumbs('/lab/new')
      $scope.lab_action_form = 'newlab'
    }
    else if (action === 'edit') {

      //BreadCrumbs.breadCrumbs('/lab/edit/$routeParams.namelab')
      $scope.lab_action_btn = { text: "Edit", class: "btn btn-warning" }
      $scope.lab_action = 'Edit ' + $routeParams.namelab;
      $scope.lab_action_form = 'editlab'
      //Update in edit breadcrumbs
      BreadCrumbs.breadCrumbs('/lab/edit', $routeParams.namelab);
      initLabUserInformation();
      AjaxService.init()
        .dAll
        .then(function (res) {
          //User can only edit his labs (repo= username)
          vm.repos = WalkerService.repos
          userDir = AjaxService.config.name;
          var labname = $routeParams.namelab;
          var repo = WalkerService.getUserRepo();

          if (repo) {
            var lab = WalkerService.findLab(repo.name, $routeParams.nameLab);
            CurrentLabService.updateLab(lab);
            //User labs repos
            var labs = repo.labs
            if (labs) {
              var labToUse = _.findWhere(labs, { name: labname })
              if (labToUse) {
                toEditName = labToUse.name
                vm.lab.name = labToUse.name;
                vm.lab.description = labToUse.informations.description;
                //vm.lab.goal = CleanerService.parse(labToUse.informations.goal);
                vm.lab.goal = labToUse.informations.goal;
                vm.lab.solution = labToUse.informations.solution;
                vm.previewSolution = vm.lab.solution;
                vm.previewGoal = vm.lab.goal;
                vm.updatePreviewSolution();
                vm.updatePreviewGoal();
                vm.labels = labToUse.labels || []
              }
            }
          }
        },
          function (err) {

          })
    }
    //Use
    else if (action === 'use') {
      vm.buttonAction = '';
      vm.isGoalEditShowed = false;
      vm.isSolutionEditShowed = false;
      BreadCrumbs.breadCrumbs('/lab/use', $routeParams.namelab);
      initLabInformation($routeParams.repo);
      AjaxService.init()
        .dAll
        .then(function (res) {
          vm.repos = WalkerService.repos
          var labname = $routeParams.namelab
          $scope.currentName = labname;
          var rname = $routeParams.repo;
          var username = AjaxService.config.name;
          CurrentLabService.updateLab(rname, labname);
          var repo = WalkerService.getUserRepo();
          if (repo) {
            var lab = WalkerService.findLab(rname, labname);
            vm.labels = lab.labels;
          }

          AjaxService.checkExistenceLab(rname, labname)
            .then(function successCallback(response) {
              var exists = response.data.data
              //If doesn't exists create new network button
              if (!exists) {
                vm.buttonAction = buttonCreateProto
                vm.editVisible = false
                vm.exists = false;
              } else {
                dockerImagesService.areImagesInstalled(vm.repoName, vm.lab.name)
                  .then(function success(data) {
                    var areInstalled = data.data.data.areInstalled;
                    if (!areInstalled) {
                      console.log("NOT INSTALLED");
                      CurrentLabService.noImages = true;
                      vm.editVisible = false;
                    } else {
                      dockerImagesService.get(function (images) {
                        $scope.interactiveImageList = images;
                      });

                      dockerAPIService.getListHackTools()
                        .then(function successCallback(response) {
                          console.log("LIST TOOLS");
                          $scope.imageList = response.data.data.images;
                          $scope.listTools = response.data.data.images;
                        });
                    }
                  }, function error(err) {
                    console.log(err);
                  });
              }
              //Else go button
              // else	{
              //   vm.buttonAction = buttonGoProto
              //   vm.editVisible = true
              // }
            },
              function errorCallback(response) {

              })
          //If username = repo name it's the user repo and it' possible to edit
          if (username === rname) {
            vm.actionVisible = true;
            vm.deleteImportButton = buttonDeleteProto;
          }
          //Don't edit if it's not a user repo
          else {
            vm.actionVisible = false;
            vm.deleteImportButton = buttonImportProto;
          }
          var repo = _.findWhere(vm.repos, { name: rname })
          var labs = repo.labs
          if (labs) {
            var labToUse = _.findWhere(labs, { name: labname })
            if (labToUse) {
              vm.isRunning = labToUse.state === 'RUNNING' ? true : false;
              // Repo name
              vm.repoName = rname
              vm.lab.name = labToUse.name;
              if (vm.isRunning) {
                _initNetworkList();
              }
              // Check the state
              if (labToUse.state === 'NO_NETWORK') {
                vm.buttonAction = buttonCreateProto
                vm.editVisible = false
              }
              // Else go button or images
              else {
                dockerAPIService.loadGeneralLab(vm.repoName, vm.lab.name, 0, function (data) {
                  $scope.labState = data.state === 'STOPPED' ? playProto : stopProto;
                  $scope.action = data.state === 'STOPPED' ? $scope.startLab : $scope.stopLab;
                  $scope.isLabRun = data.state === 'STOPPED' ? false : true;
                  console.log("ONLOAD CANVAS");
                  $scope.listContainers = data.clistToDraw;
                  onLoadCanvas(data)
                  var yamlcode = angular.element('#code_yaml')

                  yamlcode.text(data.yamlfile)
                  Prism.highlightAll();
                  $scope.yamlfile = data.yamlfile;

                });
                vm.buttonAction = buttonGoProto
                vm.editVisible = true
              }

              if (labToUse.informations) {
                vm.lab.description = labToUse.informations.description;
                //vm.lab.goal = labToUse.informations.goal;
                vm.lab.goal = CleanerService.parse(labToUse.informations.goal);
                vm.lab.solution = CleanerService.parse(labToUse.informations.solution);
                vm.tinymceHtmlGoal = $sce.trustAsHtml(vm.lab.goal);
                vm.tinymceHtmlSolution = $sce.trustAsHtml(vm.lab.solution);
              }
              else {
                vm.lab.description = '';
                vm.lab.goal = '';
                vm.lab.solution = '';
                vm.tinymceHtmlGoal = '';
                vm.tinymceHtmlSolution = '';
              }
            }
            // dockerImagesService.getByLab(function(images) {
            //   if (images) {
            //     labsImages = images[repo.name].lab_images
            //     labImages = _.findWhere(labsImages, {nameLab:labToUse.name})
            //     var imagesToInstall = _.where(labImages.images, {contains:false});
            //       if(imagesToInstall.length > 0) {
            //         vm.noImages = true;
            //         vm.buttonAction = buttonGoDisabledProto;
            //       }
            //   }
            // });
            //Notification({message: "Some images are not installed. Go to the Image Manager"},'error');

            // dockerAPIService.getDSPImages()
            //.then(function successCallback(response) {
            //var images = response.data.data.images;
            //labsImages = images[repo.name].lab_images
            //labImages = _.findWhere(labsImages, {nameLab:labToUse.name})
            //var imagesToInstall = _.where(labImages.images, {contains:false});

            //if(imagesToInstall.length > 0) {
            //  vm.noImages = true;
            //  vm.buttonAction = buttonGoDisabledProto;
            //}
            //  //Notification({message: "Some images are not installed. Go to the Image Manager"},'error');
            //},
            //function errorCallback(error) {
            //  Notification({message:"Sorry,  error in loading docker images"}, 'error');
            //});
          }
        },
          function (err) {

          })

    }
  }

  // Called when the image change
  $scope.switchImages = function switchImages(hackToolMode) {
    if (hackToolMode == "interactive") {
      $scope.imageList = $scope.interactiveImageList;
    } else {
      $scope.imageList = $scope.listTools;
    }
  }
  $scope.goToContainer = function goToContainer(nameContainer, dc = "true") {
    console.log(nameContainer)
    console.log(dc)
    const size = {
      width: window.innerWidth || document.body.clientWidth,
      height: window.innerHeight || document.body.clientHeight
    }

    $http.post('/dsp_v1/dockershell', {
      namerepo: vm.repoName,
      namelab: vm.lab.name,
      dockername: nameContainer,
      dockercompose: dc,
      size: size
    })
      .then(
        function success(response) {
          console.log("SUCCESS");
          var windowReference = window.open();
          windowReference.location = "docker_socket.html?serviceName=" + nameContainer;
          // window.open('docker_socket.html', '_blank');
        },
        function error(err) {
          // Lab running error
          Notification({ message: "Server error: " + err.data.message }, 'error');
        });
  }

  $scope.getContainer = function getContainer(name) {
    return containerManager.getContainer(name)
  }

  $scope.copyFromContainer = function (nameContainer, dc = "true") {
    var modalInstance = $uibModal.open({
      animation: true,
      component: 'copyFromContainerComponent',
      resolve: {
        lab: function () {
          return {
            namerepo: vm.repoName,
            namelab: vm.lab.name,
            namecontainer: nameContainer,
            dockercompose: dc
          };
        }
      }
    });
    modalInstance.result.then(function () {
      console.log("responsmodalInstance")
    }, function () {
      $log.info('modal-component dismissed at: ' + new Date());
    });
  }
  $scope.copyInContainer = function (nameContainer, dc = "true") {
    var modalInstance = $uibModal.open({
      animation: true,
      component: 'copyInContainerComponent',
      resolve: {
        lab: function () {
          return {
            namerepo: vm.repoName,
            namelab: vm.lab.name,
            namecontainer: nameContainer,
            dockercompose: dc
          };
        }
      }
    });
    modalInstance.result.then(function () {
      console.log("responsmodalInstance")
    }, function () {
      $log.info('modal-component dismissed at: ' + new Date());
    });
  }

  vm.copyLab = function copyLab() {
    AjaxService.copyLab(vm.lab.name)
      .then(function successCallback(response) {
        Notification('Lab copied!', 'success');
        var newLabName = response.data.data;
        var urlToGo = '/lab/use/' + vm.repoName + '/' + newLabName;
        window.location.href = urlToGo;

      },
        function errorCallback(resp) {
          Notification('Server error:' + resp.data.message, 'error');
        });

  }

  vm.goBack = function () {
    var urlToGo = '/lab/use/' + AjaxService.config.name + '/' + vm.lab.name;
    $location.url(urlToGo);
  }

  vm.labAction = function labAction() {
    var l = vm.lab;
    //New lab
    if ($scope.lab_action_form === 'newlab') {
      AjaxService.newLab(l, vm.labels)
        .then(function successCallback(response) {
          window.location.href = '/network/' + l.name + '?create=1';
          //    SafeApply.exec($scope, function() {
          //      WalkerService.repoNewLab({
          //        name:l.name,
          //        informations: {
          //          description: l.description,
          //          goal : l.goal,
          //          solution : l.solution
          //        },
          //        state: 'NO_NETWORK',
          //        labels:[]
          //    });
          //    vm.repos = WalkerService.repos;
          //  });
          //  $location.url('/labs')

        },

          function errorCallback(response) {
            Notification('Server error:' + response.data.message, 'error');

          });

    }
    //Edit lab
    else if ($scope.lab_action_form === 'editlab') {
      AjaxService.editLab(vm.lab, toEditName, vm.labels)
        .then(function successCallback(response) {

          //Update walk object
          WalkerService.repoChangeLab(toEditName, {
            //Lab object
            name: vm.lab.name,
            informations: {
              description: vm.lab.description || '',
              goal: vm.lab.goal || '',
              solution: vm.lab.solution || ''
            },
            labels: vm.labels
          })

          //Redirect to usage
          var urlRet = '/lab/use/' + AjaxService.config.name + "/" + vm.lab.name;
          $location.url(urlRet)
        },
          function errorCallback(response) {
            Notification('Server error:' + response.data.message, 'error');
          })
    }
  }



  function goToCreateNetwork() {
    window.location.href = '/network/' + vm.lab.name + "?create=1";
    // window.location.href='docker_graph_editor.html?nameRepo='+ vm.repoName +'&namelab='+vm.lab.name+'&action=new'
  }

  function goToImages() {
    $location.url("/images#" + vm.lab.name);
  }

  function goToUseNetwork() {

    window.location.href = '/lab/use/' + vm.lab.name;

  }
  vm.goToEditNetwork = function goToEditNetwork() {
    $location.url('/lab/edit/' + vm.lab.name);
    // window.open('/lab/edit/'+vm.lab.name, '_blank');
  }
  vm.goToNetwork = function goToNetwork() {

    // $location.url('/network/'+vm.lab.name);
    // window.location.href = '/network/' + vm.lab.name;
    window.open('/network/' + vm.lab.name, '_blank');
    // window.location.href='docker_graph_editor.html?nameRepo='+ vm.repoName+ '&namelab=' + vm.lab.name + '&action=edit';
    // window.open('docker_graph_editor.html?nameRepo='+ vm.repoName+ '&namelab=' + vm.lab.name + '&action=edit', '_blank');
  }

  function openConfirmDelete() {
    if (vm.isRunning)
      Notification('Cannot delete a running lab! Pls stop first', 'warning');
    else {
      var modalInstance = $uibModal.open({
        component: 'modalComponent',
        resolve: {
          lab: function () {
            return vm.lab;
          }
        }
      });
      //Cancel lab
      modalInstance.result.then(function () {
        var nameToDelete = vm.lab.name;
        AjaxService.deleteLab(nameToDelete)
          .then(function successCallback(response) {
            //Remove from ajaxRepos
            SafeApply.exec($scope, function () {
              WalkerService.repoRemoveLab(nameToDelete)
              vm.repos = WalkerService.repos;
            });
            //Return to labs
            $location.url('/labs')
          }, function errorCallback(response) { });
      }, function () { });
    }
  }

  function importLab() {
    AjaxService.importLab(vm.repoName, vm.lab.name)
      .then(
        function successCallback(response) {
          Notification('Lab imported!', 'success');
          SafeApply.exec($scope, function () { WalkerService.repoNewLab(vm.lab); });
        },
        function errorCallback(resp) {
          Notification('Server error:' + resp.data.message, 'error');
        }
      );


  }
  //Managment of tinyMCE area
  vm.updatePreviewSolution = function () {
    vm.previewSolution = $sce.trustAsHtml(vm.lab.solution);
  }
  vm.updatePreviewGoal = function () {
    vm.previewGoal = $sce.trustAsHtml(vm.lab.goal);
  }
  vm.updateHtml = function () {
    vm.tinymceHtml = $sce.trustAsHtml(vm.lab.solution);
  };

  $scope.notify = ''
  $scope.yamlfile = '';

  // ACTION FUNCTIONS
  //Proto actions
  const playProto = { actionLabel: "Start lab", actionClass: "fa fa-fw fa-play", statusLabel: "Lab is inactive", actionButton: "btn btn-success", state: 'inactive', statusClass: "bs-callout bs-callout-danger ", statusIcon: 'fa fa-fw fa-stop' }
  const loadingProto = { actionLabel: "Loading", actionClass: "fa fa-fw fa-spinner fa-pulse", statusLabel: "Loading...", actionButton: "btn btn-warning", state: 'loading', statusClass: "bs-callout bs-callout-warning", statusIcon: 'fa fa-fw fa-spinner fa-pulse' }
  const stopProto = { actionLabel: "Stop lab", actionButton: "btn btn-danger", actionClass: "fa fa-fw fa-stop", statusLabel: "Lab is active", state: 'active', statusClass: "bs-callout bs-callout-success", statusIcon: 'fa fa-fw fa-check' }
  const isLabRun = false;

  var ansi_up = new AnsiUp;

  function updateNotify(data) {

    var message = data.message;
    //console.log(message);

    if (!$scope.$$phase) {
      $scope.$apply(function () {
        $scope.notify += ansi_up.ansi_to_html(message).replace(/(\r\n|\n)/g, '<br>');
      });
      //$digest or $apply
    }
    else $scope.notify += ansi_up.ansi_to_html(message).replace(/(\r\n|\n)/g, '<br>');
  }

  function _initNetworkList() {
    console.log("INIT NETWORK LIST");
    dockerAPIService.getNetworkList(vm.repoName, vm.lab.name)
      .then(function successCallback(response) {
        $scope.networkList = response.data.data;
        console.log($scope.networkList);
      }, function errorCallback(error) {
        Notification({ message: "Server error: " + error }, 'error');
      });
  }
  //Start the lab
  $scope.startLab = function startLab() {
    //On start loading
    $scope.labState = loadingProto
    startLoad()
    $scope.action = $scope.loading

    //Send
    SocketService.manage(JSON.stringify({
      action: 'docker_up',
      params: {
        namerepo: vm.repoName,
        namelab: vm.lab.name
      }
    }), function (event) {
      var data = JSON.parse(event.data);
      if (data.status === 'success') {
        //Set state on stop
        AjaxService.update()
        $scope.labState = stopProto
        $scope.action = $scope.stopLab
        $scope.isLabRun = true;
        _initNetworkList();
        //End load action
        completeLoad()
      }
      else if (data.status === 'error') {
        Notification('Some error in docker-compose up command', 'error');
        $scope.responseError = $scope.responseErrorHeader + data.message;
        $scope.labError = true;
        $scope.labState = playProto
        $scope.action = $scope.startLab
      }
      else updateNotify(data);
    });
  } //End startlab
  $scope.clearLogs = function () {
    $scope.notify = "";
    $scope.responseError = "";
    $scope.labError = false;
  }
  //Stop the lab
  $scope.stopLab = function stopLab() {
    //Temp state of loading
    $scope.labState = loadingProto
    startLoad()
    $scope.action = $scope.loading
    //Open socket
    //	var url = '/dsp_v1/docker_compose/'+$scope.nameRepo+"/"+$scope.labName
    //Send compose up
    SocketService.manage(JSON.stringify({
      action: 'docker_down',
      params: {
        namerepo: vm.repoName,
        namelab: vm.lab.name
      }
    }),
      function (event) {
        var data = JSON.parse(event.data);
        if (data.status === 'success') {
          dockerAPIService.detachAllServices();
          //Complete spinner
          completeLoad()
          //labState to play proto
          $scope.labState = playProto
          $scope.action = $scope.startLab
          $scope.isLabRun = false;
          AjaxService.update();
          _initNetworkList()
        }
        else if (data.status === 'error') {
          Notification('Some error in docker-compose down command', 'error');
          //	$scope.labState = playProto
          //	$scope.action = $scope.startLab
        }
        else updateNotify(data);
      });
  }

  //Nothing to do
  $scope.loading = function loading() { }

  $scope.updateManagedServices = function updateManagedServices() {
    console.log("Updat managed services");
    dockerAPIService.updateManagedServices();
  }


  function startLoad() {
    cfpLoadingBar.start();
  };

  function completeLoad() {
    cfpLoadingBar.complete();
  }

  $scope.changeLabName = function () {
    Notification('Lab Name Changed', 'success');
  }
  $scope.editGoal = function () {
    vm.isGoalEditShowed = true;
    oldGoal = vm.lab.goal;
  }
  $scope.saveGoal = function () {
    vm.isGoalEditShowed = false;
    console.log(vm.lab);

    AjaxService.editLab(vm.lab, vm.lab.name, vm.labels)
      .then(ServerResponse.success,

        // function successCallback(response) {
        // Notification("Goal Saved")
        //  }
        function errorCallback(resp) {
          ServerResponse.error(resp);
          vm.lab.goal = oldGoal;
        })
  }

  $scope.cancelGoal = function () {
    vm.isGoalEditShowed = false;
    vm.lab.goal = oldGoal;
  }

  $scope.editSolution = function () {
    vm.isSolutionEditShowed = true;
    oldSolution = vm.lab.solution;
  }

  $scope.saveSolution = function () {
    vm.isSolutionEditShowed = false;

    AjaxService.editLab(vm.lab, vm.lab.name, vm.labels)
      .then(ServerResponse.success,
        function errorCallback(resp) {
          ServerResponse.error(resp);
          vm.lab.solution = oldSolution;
        });
  }

  $scope.cancelSolution = function () {
    vm.isSolutionEditShowed = false;
    vm.lab.solution = oldSolution;
  }
}

