const configData = require('../data/config.js');
const async = require('async');
const fs = require('fs');
const homedir = require('homedir');
const path = require('path');
const jsonfile = require('jsonfile');
const ncp = require('ncp').ncp;
const pathExists = require('path-exists');
const appUtils = require('../util/AppUtils.js');
const LabStates = require('../util/LabStates.js');

const _ = require('underscore');

const log = appUtils.getLogger();
const c = require('../../config/local.config.json');

function get(cb) {
  log.info("[repositories data] get repos]");
  async.waterfall([
    (cb) => configData.getConfig(cb),
    (conf, cb) => {
      const repoFile = path.join(homedir(), conf.mainDir, 'repos.json');
      cb(null, repoFile);
    }, (repoFile, cb) => jsonfile.readFile(repoFile, cb)
    ], (err, jsonRepos) => {
      console.log(jsonRepos);
      cb(err, jsonRepos);
  });
}
function exists(cb) {
  async.waterfall([
    (cb) => configData.getConfig(cb),
    (conf, cb) => {
      const repoFile = path.join(homedir(), conf.mainDir, 'repos.json');
      cb(null, repoFile);
    }], (err, repoFile) => {
      if (err) {
        cb(err);
      } else {
          pathExists(repoFile).then(exists => {
        console.log(exists);
        cb(null, exists);
      })
    }
   });
  }
function post(repos, cb) {

  async.waterfall([
    (cb) => configData.getConfig(cb),
    (conf, cb) => {
      const repoFile = path.join(homedir(), conf.mainDir, 'repos.json');
      cb(null, repoFile);
    }, (repoFile, cb) => jsonfile.writeFile(repoFile, repos, cb)
    ], (err, jsonRepos) => {
      cb(err, jsonRepos);
  });
}

function put(repo, cb) {

}

exports.get = get;
exports.post = post;
exports.exists = exists;
exports.version = '0.1.0';
