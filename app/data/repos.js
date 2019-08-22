const configData = require('../data/config.js');
const async = require('async');
const fs = require('fs');
const path = require('path');
const jsonfile = require('jsonfile');
const ncp = require('ncp').ncp;
const pathExists = require('path-exists');
const appUtils = require('../util/AppUtils.js');
const LabStates = require('../util/LabStates.js');
const rimraf = require('rimraf');

const _ = require('underscore');

const log = appUtils.getLogger();
const c = require('../../config/local.config.json');

function get(cb) {
  log.info("[repositories data] get repos]");
  async.waterfall([
    (cb) => configData.getConfig(cb),
    (conf, cb) => {
      const repoFile = path.join(appUtils.getHome(), conf.mainDir, 'repos.json');
      cb(null, repoFile);
    }, (repoFile, cb) => jsonfile.readFile(repoFile, cb)
    ], (err, jsonRepos) => {
      cb(err, jsonRepos);
  });
}
function exists(cb) {
  async.waterfall([
    (cb) => configData.getConfig(cb),
    (conf, cb) => {
      const repoFile = path.join(appUtils.getHome(), conf.mainDir, 'repos.json');
      cb(null, repoFile);
    }], (err, repoFile) => {
      if (err) {
        cb(err);
      } else {
        const exists = pathExists.sync(repoFile);
        cb(null, exists);
      }
    })
  }

function create(repos, cb) {
  log.info("[repositories ] create repos]");
  let repoFile;
  async.waterfall([
    // Update repos.json file
    (cb) => configData.getConfig(cb),
    (conf, cb) => {
      repoFile = path.join(appUtils.getHome(), conf.mainDir, 'repos.json');
      cb(null);
    },
    (cb) => {
      jsonfile.writeFile(repoFile, repos, cb);
    }], (err) => {
      cb(err);
  });
}
function post(repo, cb) {
  log.info("[repositories ] post repos]");
  let repoFile;
  async.waterfall([
    // Update repos.json file
    (cb) => configData.getConfig(cb),
    (conf, cb) => {
      repoFile = path.join(appUtils.getHome(), conf.mainDir, 'repos.json');
      cb(null);
    },
    (cb) => get(cb),
    (repos, cb) => {
      repos.push({
      "name": repo.name,
      "url": repo.url
      });
      jsonfile.writeFile(repoFile, repos, cb);
    }], (err) => {
      cb(err);
  });
}

function remove(reponame, cb) {
  let mainDir;
  let repoFile;
  log.info("reponame:"+reponame);
  async.waterfall([
    (cb) => configData.getConfig(cb),
    (conf, cb) => {
      mainDir = path.join(appUtils.getHome(), conf.mainDir);
      repoFile = path.join(mainDir, "repos.json");
      cb(null);
    },
    // Remove directory from the main directory
    (cb) => rimraf(path.join(mainDir, reponame), cb),
    (cb) => get(cb),
    // Remove from repos.json
    (repos, cb) => {
      const newRepos = _.reject(repos, {name:reponame});
      log.info("Write new repos.json");
      jsonfile.writeFile(repoFile, newRepos, cb);
    }], cb);
}


exports.get = get;
exports.post = post;
exports.exists = exists;
exports.remove = remove;
exports.create = create;
exports.version = '0.1.0';
