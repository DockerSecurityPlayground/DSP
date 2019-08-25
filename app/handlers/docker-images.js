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




function getImagesRepo(req, res) {
  async.waterfall([
  (cb) => Checker.checkParams(req.params, ['reponame'], cb),
  (cb) => Checker.checkString(req.params.reponame, cb),
  (cb) => {
    const reponame = req.params.reponame;
    cb(null, [reponame]);

  }


  ],
  (err, results) => {
    httpHelper.response(res, err, { images: results });
  });
}

function getImagesAllRepos(req, res) {
    dockerImages.getImagesAllRepos((err, images) => {
      httpHelper.response(res, err, { images} );
    });
}

function areImagesInstalled(req, res) {

  async.waterfall([
  (cb) => Checker.checkParams(req.params, ['reponame', 'labname'], cb),
  (cb) => Checker.checkString(req.params.reponame, cb),
  (cb) => Checker.checkString(req.params.labname, cb),
  (cb) => dockerImages.getListImages(cb),
  (allImages, cb) => dockerImages.getImagesLab(req.params.reponame, req.params.labname, allImages, cb),
  (labImages, cb) => dockerImages.areImagesInstalled(labImages, cb) ], (err, results) => {
     httpHelper.response(res, err, { areInstalled: results.areInstalled });
  })
}

function getImagesLab(req, res) {
  if (req.query.checkInstallation) {
    areImagesInstalled(req, res);
    } else {
      async.waterfall([
      (cb) => Checker.checkParams(req.params, ['reponame', 'labname'], cb),
      (cb) => Checker.checkString(req.params.reponame, cb),
      (cb) => Checker.checkString(req.params.labname, cb),
      (cb) => dockerImages.getListImages(cb),
      (allImages, cb) => dockerImages.getImagesLab(req.params.reponame, req.params.labname, allImages, cb),
      (images, cb) => {
        cb(images);
      }], (results, err) => {
        httpHelper.response(res, err, { images: results });
      });
  }
}

function saveTempDockerfile(req, res) {

}


exports.getImagesRepo = getImagesRepo;
exports.getImagesLab= getImagesLab;
exports.getImagesAllRepos = getImagesAllRepos;
exports.saveTempDockerfile = saveTempDockerfile;
// exports.areImagesInstalled = areImagesInstalled;
