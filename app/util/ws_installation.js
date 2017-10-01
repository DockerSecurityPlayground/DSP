const Checker = require('../util/AppChecker');
const projectInit = require('../util/project_init.js');
const async = require('async');
const appUtils = require('../util/AppUtils');
const path = require('path');

const JoiAppConditions = Checker.JoiAppConditions;
const AppConditions = Checker.AppConditions;
const log = appUtils.getLogger();


function installation(config, callback, notifyCallback) {
  if (!config) callback(new Error('config no defined!'));
  async.waterfall([
    // Checking
    (cb) => Checker.checkParams(config, ['mainDir', 'name'], cb),
    (cb) => AppConditions.check(config.mainDir, 'filetype', cb),
    (cb) => AppConditions.check(config.name, 'filetype', cb),
    (cb) => {
      if (config.githubURL) {
        JoiAppConditions.check(config.githubURL, 'url', (err) => {
          cb(err);
        });
      } else cb(null);
    },
    // Create configuration file
    (cb) => {
      log.info('Create configuration file');
      projectInit.createConfig(path.basename(appUtils.path_userconfig()), config, cb);
    },
    // Create DSP directories
    (cb) => {
      log.info('Create dsp directories ');
      projectInit.createDSP(path.basename(appUtils.path_userconfig()), cb, notifyCallback);
    },
    (cb) => projectInit.initRepos(cb, notifyCallback)
    // Clone main repository
  ],
  (err, response) => {
    log.info('END');
    callback(err, response);
  });
}


exports.installation = installation;
