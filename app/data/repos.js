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
  async.waterfall([
    (cb) => configData.getConfig(cb),
    (conf, cb) => {
      const repoFile = path.join(homedir(), conf.mainDir, 'repos.json');
      cb(null, repoFile);
    }, (repoFile, cb) => jsonfile.readFile(repoFile, cb)
    ], (err, jsonRepos) => {
      cb(err, jsonRepos);
  });
}

exports.get = get;
exports.version = '0.1.0';
