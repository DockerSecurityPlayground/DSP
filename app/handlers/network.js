const networkData = require('../data/network.js');
const appRoot = require('app-root-path');
const async = require('async');
const dockerVolumes = require('../data/dockerVolumes.js');
const httpHelper = require('help-nodejs').httpHelper;
const LabStates = require('../util/LabStates.js');
const AppUtils = require('../util/AppUtils');
const pathExists = require('path-exists');

const dockerImages = require(`${appRoot}/app/data/docker-images`);

const Checker = require('../util/AppChecker');

const dockerConverter = require(`${appRoot}/app/data/docker-converter.js`);
const dockerComposer = require('mydockerjs').dockerComposer;

const log = AppUtils.getLogger();
// const appUtils = require('../util/AppUtils.js');

// const log = appUtils.getLogger();

function save(req, res) {
  console.log('IN SAVE');
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
    }
  ], (err, response) => AppUtils.response('NETWORK GET', res, err, response));
}


function getListImages(req, res) {
  dockerImages.getListImages((err, data) => {
    httpHelper.response(res, err, data);
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

