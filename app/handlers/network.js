const networkData = require('../data/network.js');
const appRoot = require('app-root-path');
const async = require('async');
const dockerVolumes = require('../data/dockerVolumes.js');
const dockerFiles = require('../data/dockerfiles.js');
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
const dockerJS = require('mydockerjs').docker;
const _ = require('underscore');

const log = AppUtils.getLogger();
// const appUtils = require('../util/AppUtils.js');

// const log = appUtils.getLogger();

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
function get(req, res) {
  async.waterfall([
    (cb) => Checker.checkParams(req.params, ['namelab', 'namerepo'], cb),
    // get current state
    (cb) => {
      LabStates.getState(req.params.namerepo, req.params.namelab, cb);
    },
    // Save state in response for user browser
    (status, cb) => {
      if (req.query && req.query.exists && req.query.exists === '1') { networkData.networkExists(req.params.namerepo, req.params.namelab, cb); } else {
        networkData.get(req.params.namerepo, req.params.namelab, (ndErr, ndResponse) => {
          if (ndErr) cb(ndErr);
          else {
            ndResponse.state = status;
            cb(ndErr, ndResponse);
          }
        });
      }
    },
    (response, cb) => {
      if (req.query.isEditing == '0' && response.isComposeVisible == false) {
        response.yamlfile = "";
      }
      cb(null, response);
    }
  ], (err, response) => AppUtils.response('NETWORK GET', res, err, response));
}

function isImported(req, res) {
  async.waterfall([
    (cb) => Checker.checkParams(req.params, ['namelab', 'namerepo'], cb),
    (cb) => networkData.isImported(req.params.namerepo, req.params.namelab, cb),
    // (networkInfo, cb) => {
    //   // TBD OTHER VALIDATION
    //   // If networkList not valid 
    //   cb(null, !(networkInfo.networkList && networkInfo.networkList.length > 0));
    // }
  ], (err, response) => AppUtils.response('IS LAB IMPORTED', res, err, response));
}

function getUser(req, res) {
  let namerepo;
  async.waterfall([
    (cb) => Checker.checkParams(req.params, ['namelab'], cb),
    (cb) => configData.getConfig(cb),
    (config, cb) => {
      namerepo = config.name;
      cb(null);
    },
    // get current state
    (cb) => {
      LabStates.getState(namerepo, req.params.namelab, cb);
    },
    // Save state in response for user browser
    (status, cb) => {
      if (req.query && req.query.exists && req.query.exists === '1') { networkData.networkExists(req.params.namerepo, req.params.namelab, cb); } else {
        networkData.get(namerepo, req.params.namelab, (ndErr, ndResponse) => {
          if (ndErr) cb(ndErr);
          else {
            ndResponse.state = status;
            cb(ndErr, ndResponse);
          }
        });
      }
    },
    (response, cb) => {
      // Add reponame for local lab
      response.repoName = namerepo;
      if (req.query.isEditing == '0' && response.isComposeVisible == false) {
        response.yamlfile = "";
      }
      cb(null, response);
    }
  ], (err, response) => AppUtils.response('NETWORK GET', res, err, response));
}


function getListImages(req, res) {
    let imagesToBuild;
    completeDescription = req.query.completeDescription
    async.waterfall([
    (cb) => dockerFiles.getDockerfiles(cb),
    (dockerfiles, cb) => {
      imagesToBuild = dockerfiles.map((d) => d + ":latest");
      dockerImages.getListImages(cb);
    },
    (images, cb) => {
      images.forEach((i) => {
        i.toBuild = _.contains(imagesToBuild, i.name);
      })
      cb(null, images);
    }], (err, data) => httpHelper.response(res, err, data));
}



function dockercopy(req, res) {
  let destinationPath;
  let destinationDir;
  const dc = req.body.dockercompose;
  async.waterfall([
    (cb) => Checker.checkParams(req.body, ['namelab', 'namerepo', 'dockername', 'pathContainer', 'dockercompose'], cb),
    (cb) => networkData.get(req.body.namerepo, req.body.namelab, cb),
    (networkInfo, cb) => {
    // Get config
      dockername = req.body.dockername;
      cld = networkInfo.clistToDraw;
      containerToCopy = _.findWhere(cld, {name: dockername});
      // Docker Compose Action: check isShellEnabled
      if (dc === "true") {
        log.info("[DOCKER COPY COMPOSE]")
        if(!containerToCopy)  {
          cb(new Error(`Cannot find ${dockername} in network`));
        } else if(!containerToCopy.isShellEnabled) {
          cb(new Error("Copy not allowed"));
        } else {
          configData.getConfig(cb);
        }
      }
      // Docker Copy
      else {
        log.info("[DOCKER COPY CONTAINER]")
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
      if (dc === "true") {
      dockerComposer.cpFrom(pathLab, dockerInfos.dockerName, dockerInfos.pathContainer, destinationPath, cb);
      } else {
      log.info(`Execute docker cp ${dockerInfos.dockerName} ${dockerInfos.pathContainer} ${destinationPath}`);
      dockerJS.cpFrom(dockerInfos.dockerName, dockerInfos.pathContainer, destinationPath, cb);
      }
      // Readjust destinationPath name TODO Check this
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

function dockerupload(req, res) {
  log.info("[IN DOCKER UPLOAD]");
  async.waterfall([
    (cb) => Checker.checkParams(req.body, ['dockername', 'hostPath' ,'containerPath'], cb),
    (cb) => {
      try {
        if (!fs.statSync(req.body.hostPath).isFile()) {
          var theErr = new Error(`${req.body.hostPath} is not a file`);
          cb(theErr);
        } else {
          cb(null);
        }
      } catch(e) {
        cb(e);
      }
    },
    (cb) => configData.getConfig(cb),
    // get path
    (config, cb) => {
      mainDir = config.mainDir;
      const dockerInfo = {
      dockerName : req.body.dockername,
      containerPath: req.body.containerPath,
      hostPath  : req.body.hostPath
      };
      cb(null, dockerInfo);
    },
    (dockerInfo, cb) => {
      log.info(`Copy ${dockerInfo.hostPath} inside ${dockerInfo.dockerName}:${dockerInfo.containerPath}`);
      dockerJS.cp(dockerInfo.dockerName, dockerInfo.hostPath, dockerInfo.containerPath, cb);
    }],
    (err) => {
    httpHelper.response(res, err);
  })
}



function dockershellcompose(req, res) {
  log.info("[IN DOCKER SHELL COMPOSE ]");
  async.waterfall([
    (cb) => Checker.checkParams(req.body, ['namerepo', 'namelab', 'dockername', 'dockercompose'], cb),
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
      dockerName : req.body.dockername,
      dockercompose : req.body.dockercompose
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
function dockershellcontainer(req, res) {
  log.info("[IN DOCKER SHELL CONTAINER]");
  async.waterfall([
    (cb) => Checker.checkParams(req.body, ['namerepo', 'namelab', 'dockername', 'dockercompose'], cb),
    (cb) => configData.getConfig(cb),
    (config, cb) => {
      let dockerInfos = {
      mainPath: config.mainDir,
      nameRepo : req.body.namerepo,
      labName : req.body.namelab,
      dockerName : req.body.dockername,
      dockercompose : req.body.dockercompose
      }
      if (req.body.size)
        dockerInfos["size"] = req.body.size;
      cb(null, dockerInfos);
    },
    (dockerInfos, cb) => {
      dockerSocket.setDockerShell(dockerInfos);
      cb(null);
    }], (err) => {
      httpHelper.response(res, err);
    });
}

function dockershell(req, res) {
  log.info("[IN DOCKER SHELL]")
  Checker.checkParams(req.body, ['namerepo', 'namelab', 'dockername', 'dockercompose'], (err, data) => {
    if (err) {
      httpHelper.response(res, err);
    } else if(req.body.dockercompose === "true") {
        dockershellcompose(req, res);
    } else {
        dockershellcontainer(req, res);
    }
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

exports.save = save;
exports.get = get;
exports.isImported = isImported;
exports.getUser = getUser;
exports.getListImages = getListImages;
exports.dirExists = dirExists;
exports.dockershell = dockershell;
exports.dockercopy = dockercopy;
exports.dockerupload = dockerupload;
