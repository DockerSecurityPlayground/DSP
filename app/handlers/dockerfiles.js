const jsonfile = require('jsonfile');
const async = require('async');
const path = require('path');
const fs = require('fs');
const pathExists = require('path-exists');
const rimraf = require('rimraf');
const _ = require('underscore');
const appUtils = require('../util/AppUtils');
const LabStates = require('../util/LabStates.js');
const httpHelper = require('help-nodejs').httpHelper;
const Checker = require('../util/AppChecker');
const networkData = require('../data/network.js');
const c = require('../../config/local.config.json');
const dockerImages = require('../data/docker-images.js');
const dockerFileData = require('../data/dockerfiles.js');
const AppUtils = require('../util/AppUtils');
const log = AppUtils.getLogger();

function getDockerFiles(req, res) {
  log.info("[DOCKERFILES] In getDockerFiles");
  dockerFileData.getDockerfiles((err, dockerfiles) =>  httpHelper.response(res, err, { dockerfiles }));
}
function getDockerFile(req, res) {
  log.info("[DOCKERFILES] In Get Dockerfile");
  async.waterfall([
    (cb) => Checker.checkParams(req.params, ['dockerfile'], cb),
    (cb) => dockerFileData.getDockerfile(req.params.dockerfile, cb)
    ], (err, response) => {
    httpHelper.response(res, err, response );
    });
}
function createDockerFile(req, res) {
  log.info("[DOCKERFILES] In Create Dockerfile");
  async.waterfall([
    (cb) => Checker.checkParams(req.params, ['dockerfile'], cb),
    (cb) => dockerFileData.createDockerfile(req.params.dockerfile, req.body, cb)
    ], (err) => {
    httpHelper.response(res, err);
    });
}
function deleteDockerFile(req, res) {
  log.info("[DOCKERFILES] In Delete Dockerfile");
  async.waterfall([
    (cb) => Checker.checkParams(req.params, ['dockerfile'], cb),
    (cb) => dockerFileData.removeDockerfile(req.params.dockerfile, cb)
    ], (err) => {
    httpHelper.response(res, err);
    });
}

function editDockerFile(req, res) {
  log.info("[DOCKERFILES] In Edit Dockerfile");
  async.waterfall([
    (cb) => Checker.checkParams(req.params, ['dockerfile'], cb),
    (cb) => Checker.checkParams(req.body, ['name', 'content'], cb),
    (cb) => dockerFileData.editDockerfile(req.body.name, req.body.content, cb)
    ], (err) => {
    httpHelper.response(res, err);
    });
}
exports.getDockerFiles = getDockerFiles;
exports.createDockerFile = createDockerFile;
exports.editDockerFile = editDockerFile;
exports.getDockerFile = getDockerFile;
exports.deleteDockerFile = deleteDockerFile;
