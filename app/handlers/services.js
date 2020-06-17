const networkData = require('../data/network.js');
const appRoot = require('app-root-path');
const async = require('async');
const dockerVolumes = require('../data/dockerVolumes.js');
const configData = require('../data/config.js');
const path = require('path');
const httpHelper = require('help-nodejs').httpHelper;
const LabStates = require('../util/LabStates.js');
const AppUtils = require('../util/AppUtils');
const pathExists = require('path-exists');
const dockerSocket = require('../util/docker_socket');
const dockerImages = require(`${appRoot}/app/data/docker-images`);
const zipdir = require('zip-dir');
const rimraf = require('rimraf');
//const zipFolder = require('zip-folder');
const fs = require('fs');
const Checker = require('../util/AppChecker');

const dockerConverter = require(`${appRoot}/app/data/docker-converter.js`);
const dockerComposer = require('mydockerjs').dockerComposer;
const _ = require('underscore');
const dockerServices = require('../data/docker-tools.js');
const log = AppUtils.getLogger();
// const appUtils = require('../util/AppUtils.js');

// const log = appUtils.getLogger();
function _parseOptions(service) {
  let options = {};
  options.interactive = service.isInteractive;
  options.detached = service.isDaemonized;
  if (service.command) {
  options.cmd = service.command;
  }
  // Add capability
  options.cap_add = "NET_ADMIN";
  if (service.ports) {
    options.ports = service.ports;
  }
  if (service.environments) {
    options.environments = service.environments;
  }
  return options;
}

function save(req, res) {
  async.waterfall([
    // Check values
    (cb) => Checker.checkParams(req.params, ['namelab'], cb),
    (cb) => Checker.checkParams(req.body, ['networkList', 'clistToDraw', 'clistNotToDraw', 'canvasJSON'], cb),
    // Creation of directories if volume is setted
    (cb) => dockerVolumes.destroyOldVolumes(req.params.namelab, req.body.clistToDraw,
      req.body.clistNotToDraw, cb),
    // For each directory if doesn't exist create
      // Destroy unused directories
      // Create new volume directories
    (cb) => dockerVolumes.createVolumeDirs(req.params.namelab, req.body.clistToDraw, cb),
    // Here the docker yaml translate
    (cb) => {
      let dc;
      let jsonCompose;
      let error = null;
  //    log.info('in docker yamltranslate');
      try {
        jsonCompose =
          dockerConverter.JSONDockerComposeConvert(req.body.clistToDraw, req.body.networkList);
        dc = dockerComposer.generate(JSON.parse(jsonCompose));
      } catch (e) {
        error = e;
        log.error(e);
      }
      finally {
        cb(error, dc);
      }
    },
    // Save informations
    (yamlfile, cb) => {
      const data = req.body;
      // In order to edit lab labstate must be STOPPED, so here we set to STOPPED
      networkData.save(req.params.namelab, data, yamlfile, cb);
    },
  ],
(err, results) => {
  AppUtils.response('NETWORK SAVE', res, err, results, true); });
}

// Get network description
function getServices(req, res) {
  log.info("[DOCKER TOOLS] Get Services")
  dockerServices.getServices((err, data) => {
    AppUtils.response('GET SERVICES', res, err, data, true)
  });
}
function getNetworkList(req, res) {
  log.info("[DOCKER TOOLS] Get Network List")
  async.waterfall([
  (cb) => Checker.checkParams(req.params, ['namelab'], cb),
  (cb) => dockerServices.getNetworksLab(req.params.namelab, cb)
  ], (err, data) => {
    AppUtils.response("NETWORK LIST", res, err, data, true);
  });
}

  function runService(req, res) {
  let containerName;
  let imageName;
  let options;
  log.info("[DOCKER TOOLS] Run Service Request");
  async.waterfall([
    // Check values
    (cb) => Checker.checkParams(req.params, ['nameservice'], cb),
    (cb) => Checker.checkParams(req.body, ['name', 'selectedImage', 'isInteractive', 'isDaemonized'], cb),
    (cb) => {
      containerName = req.body.name;
      imageName = req.body.selectedImage.name;
      options = _parseOptions(req.body);
      dockerServices.runService(imageName, containerName, options, cb)
    }], (err, data) => {
  AppUtils.response('Run Service Request', res, err, data, true)
  });
}

function startService(req, res) {
  log.info("[DOCKER TOOLS] Start Service");
  async.waterfall([
    (cb) => Checker.checkParams(req.params, ['nameservice'], cb),
    (cb) => {
      dockerServices.startService(req.params.nameservice, cb)
    }], (err) => {
      AppUtils.response('Start Service Request', res, err, null, true);
    });
}

function _isRun(req, res, methodName) {
  dockerServices[methodName]((err, isRun) => {
    AppUtils.response(methodName, res, err, {"isRun": isRun});
  });
}

function _stop(req, res, methodName) {
  dockerServices[methodName](((err) => {
      AppUtils.response(methodName, res, err, null, true);
  }))
}

function isKaliRun(req, res) {
  log.info("[DOCKER TOOLS] Is Kali Run");
  _isRun(req, res, "isKaliServiceRun");
}

function stopKali(req, res) {
  log.info("[DOCKER TOOLS] Stop Kali Run");
  _stop(req, res, "stopKaliService");
}

function stopBrowser(req, res) {
  log.info("[DOCKER TOOLS] Stop Browser Run");
  _stop(req, res, "stopBrowserService");
}


function isBrowserRun(req, res) {
  log.info("[DOCKER TOOLS] Is Browser Run");
  _isRun(req, res, "isBrowserServiceRun");
}
function isHttpdRun(req, res) {
  log.info("[DOCKER TOOLS] Is Httpd Run");
  _isRun(req, res, "isHttpdServiceRun");
}

function isWiresharkRun(req, res) {
  log.info("[DOCKER TOOLS] Is Wireshark Run");
  dockerServices.isWiresharkRun((err, isRun) => {
      AppUtils.response('Wireshark Run', res, err, {"isRun": isRun});
  })
}

function stopHttpd(req, res) {
  log.info("[DOCKER TOOLS] Stop Httpd");
  _stop(req, res, "stopHttpdService");
}

function stopWireshark(req, res) {
  log.info("[DOCKER TOOLS] Stop Wireshark");
  dockerServices.stopWireshark(((err) => {
      AppUtils.response('Start Service Request', res, err, null, true);
  }))
}

function isTcpdumpRun(req, res) {
  log.info("[DOCKER TOOLS] Is Tcpdump Run");
  dockerServices.isTcpdumpRun((err, isRun) => {
      AppUtils.response('Tcpdump Run', res, err, {"isRun": isRun});
  })
}

function stopTcpdump(req, res) {
  log.info("[DOCKER TOOLS] Stop Tcpdump");
  dockerServices.stopTcpdump(((err) => {
      AppUtils.response('Stop Service Request', res, err, null, true);
  }))
}

function stopService(req, res) {
  log.info("[DOCKER TOOLS] Stop Service");
  async.waterfall([
    (cb) => Checker.checkParams(req.params, ['nameservice'], cb),
    (cb) => {
      dockerServices.stopService(req.params.nameservice, cb)
    }], (err) => {
      AppUtils.response('Stop Service Request', res, err, null, true);
    });
}

function removeService(req, res) {
  log.info("[DOCKER TOOLS] Remove Service");
  async.waterfall([
    (cb) => Checker.checkParams(req.params, ['nameservice'], cb),
    (cb) => {
      dockerServices.removeService(req.params.nameservice, cb)
    }], (err) => {
      AppUtils.response('Stop Service Request', res, err, null, true);
    });
}

// function get(req, res) {
//   let config;
//   let mainDIr;
//   async.waterfall([
//     (cb) => Checker.checkParams(req.params, ['namelab', 'namerepo'], cb),
//     (cb) => configData.getConfig(cb),
//     (theConfig, cb) => {
//       config = theConfig;
//       mainDir = config.mainDir;
//       thePath = path.join((), mainDir, params.namerepo, params.namelab);


//     }
//   ], (err, response) => AppUtils.response('SERVICES GET', res, err, response));
// }


function getListImages(req, res) {
    completeDescription = req.query.completeDescription
    dockerImages.getListImages((err, data, completeDescription) => { httpHelper.response(res, err, data);
  });
}
function dockercopy(req, res) {
  let destinationPath;
  let destinationDir;
  async.waterfall([
    (cb) => Checker.checkParams(req.body, ['namelab', 'namerepo', 'dockername', 'pathContainer'], cb),
    (cb) => networkData.get(req.body.namerepo, req.body.namelab, cb),
    (networkInfo, cb) => {
    // Get config
      dockername = req.body.dockername;
      cld = networkInfo.clistToDraw;
      containerToCopy = _.findWhere(cld, {name: dockername});
      if (!containerToCopy.isShellEnabled) {
        cb(new Error("Copy not allowed"));
      }
      else {
        configData.getConfig(cb);
      }
    },
    // get path
    (config, cb) => {
      mainDir = config.mainDir;
      const dockerInfos = {
      mainPath : path.join(AppUtils.getHome(), mainDir),
      nameRepo : req.body.namerepo,
      labName : req.body.namelab,
      dockerName : req.body.dockername,
      pathContainer: req.body.pathContainer
      }
      cb(null, dockerInfos);
    },
    (dockerInfos, cb) => {
      const pathLab = path.join(dockerInfos.mainPath, dockerInfos.nameRepo, dockerInfos.labName)
      destinationDir = path.join("public","downloads", `${dockerInfos.nameRepo}_${dockerInfos.labName}`)
      destinationPath = path.join(destinationDir, path.basename(dockerInfos.pathContainer));
      // Fix for space directories
      destinationPath = `"${destinationPath}"`
      dockerComposer.cpFrom(pathLab, dockerInfos.dockerName, dockerInfos.pathContainer, destinationPath, cb);
      // Readjust destinationPath name
      destinationPath = destinationPath.substring(1, destinationPath.length -1)
    },
    (data,cb) => {
      // If is a directory zip the file
      if (fs.statSync(destinationPath).isDirectory()) {
        zipdir(destinationPath, { saveTo: `${destinationPath}.zip`}, (err, buffer) => { cb(err, true); })
      }
      else cb(null, false);
    },
    (wasDir, cb) => {
    // Zip has been saved, destroy directory
     if(wasDir) {
       rimraf(destinationPath, cb);
       destinationPath = `${destinationPath}.zip`;
     }
     else cb(null);
    }], (err) => {
      httpHelper.response(res, err, destinationPath);
    });
}

function dockershell(req, res) {
  async.waterfall([
    (cb) => Checker.checkParams(req.body, ['namerepo', 'namelab', 'dockername'], cb),
    (cb) => networkData.get(req.body.namerepo, req.body.namelab, cb),
    (networkInfo, cb) => {
    // Get config
      dockername = req.body.dockername;
      cld = networkInfo.clistToDraw;
      containerToCopy = _.findWhere(cld, {name: dockername});
      if (!containerToCopy.isShellEnabled) {
        cb(new Error("Shell not allowed"));
      }
      else {
        configData.getConfig(cb);
      }
    },
    // get path
    (config, cb) => {
      mainDir = config.mainDir;
      const dockerInfos = {
      mainPath : path.join(AppUtils.getHome(), mainDir),
      nameRepo : req.body.namerepo,
      labName : req.body.namelab,
      dockerName : req.body.dockername
      }
      cb(null, dockerInfos);
    },
    (dockerInfos, cb) => {
      dockerSocket.setDockerShell(dockerInfos);
      cb(null);
    }], (err) => {
      httpHelper.response(res, err);
    });
}
function dirExists(req, res) {
  async.waterfall([
    (cb) => Checker.checkParams(req.body, ['filename'], cb),
    (cb) => {
      pathExists(req.body.filename)
      .then((exists) => {
        cb(null, exists);
      });
    }],
  (err, exists) => {
    httpHelper.response(res, null, exists);
  });
}
function attachNetwork(req, res) {
  log.info("ATTACH NETWORK");
  async.waterfall([
    (cb) => Checker.checkParams(req.body, ['networkname', 'servicename'], cb),
    (cb) => dockerServices.attachServiceToNetwork(req.body.servicename, req.body.networkname, cb)],
    (err, data) => {
      AppUtils.response('ATTACH NETWORK', res, err);
    });
}

function detachNetwork(req, res) {
  log.info("DETaCH NETWORK");
  async.waterfall([
    (cb) => Checker.checkParams(req.query, ['networkname', 'servicename'], cb),
    (cb) => dockerServices.detachServiceToNetwork(req.query.servicename, req.query.networkname, cb)],
    (err, data) => {
      AppUtils.response('DETACH NETWORK', res, err);
    });
}

function setAsDefault(req, res) {
  log.info("Set Default Network");
  let networkName;
  let nameService;
  async.waterfall([
    (cb) => Checker.checkParams(req.body, ['networkname'], cb),
    (cb) => Checker.checkParams(req.params, ['nameservice'], cb),
    (cb) => {
      networkName  = req.body.networkname;
      nameService = req.params.nameservice;
      dockerServices.findRouterIp(req.body.networkname, cb);
    },
    (routerIP, cb) => {
      log.info(`Router IP: ${routerIP}`);
      dockerServices.setDefaultGW(nameService, routerIP, cb);
    }],
    (err, data) => {
      AppUtils.response('SET DEFAULT NETWORK', res, err);
    });

}

function getListHackTools(req,res){
   dockerImages.getListHackTools((err,data) => {
       httpHelper.response(res,err,data);
   });
}

function deleteHackTool(req, res) {
  log.info("[DOCKER TOOLS] Remove Hacking Tool");
  async.waterfall([
    (cb) => Checker.checkParams(req.params, ["name"], cb),
    (cb) => dockerServices.deleteHackTool(req.params.name, cb)
    ],
    (err) => {
      AppUtils.response('SET DEFAULT NETWORK', res, err);
    });
}



// exports.save = save;
exports.getServices = getServices;
exports.runService = runService;
exports.startService = startService;
exports.stopService = stopService;
exports.removeService = removeService;
exports.getNetworkList = getNetworkList;
exports.attachNetwork = attachNetwork;
exports.detachNetwork = detachNetwork;
exports.setAsDefault = setAsDefault;
exports.getListHackTools = getListHackTools;
exports.deleteHackTool = deleteHackTool;
exports.isHttpdRun = isHttpdRun;
exports.isBrowserRun = isBrowserRun;
exports.stopHttpd = stopHttpd;
exports.isKaliRun = isKaliRun;
exports.stopKali = stopKali;
exports.stopBrowser = stopBrowser;
exports.isWiresharkRun = isWiresharkRun;
exports.stopWireshark = stopWireshark;
exports.isTcpdumpRun = isTcpdumpRun;
exports.stopTcpdump = stopTcpdump;

// exports.getListImages = getListImages;
// exports.dirExists = dirExists;
// exports.dockershell = dockershell;
// exports.dockercopy = dockercopy;
