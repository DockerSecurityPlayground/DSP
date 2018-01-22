const networkData = require('../data/network.js');
const appRoot = require('app-root-path');
const async = require('async');
const dockerVolumes = require('../data/dockerVolumes.js');
const configData = require('../data/config.js');
const path = require('path');
const homedir = require('homedir');
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


function getListImages(req, res) { dockerImages.getListImages((err, data) => { httpHelper.response(res, err, data);
  });
}
function dockercopy(req, res) {
  // console.log("SONO IN DOCKER COPY")
  // console.log(req.body)
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
      mainPath : path.join(homedir(), mainDir),
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
        console.log("ZIPPING FILE")
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
      mainPath : path.join(homedir(), mainDir),
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

exports.save = save;
exports.get = get;
exports.getListImages = getListImages;
exports.dirExists = dirExists;
exports.dockershell = dockershell;
exports.dockercopy = dockercopy;
