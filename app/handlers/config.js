const configData = require('../data/config.js');
const Checker = require('../util/AppChecker');
const async = require('async');
const path = require('path');
const httpHelper = require('help-nodejs').httpHelper;
const appUtils = require('../util/AppUtils.js');
const LabStates = require('../util/LabStates');

const AppConditions = Checker.AppConditions;
const JoiAppConditions = Checker.JoiAppConditions;

const log = appUtils.getLogger();

function getConfig(req, res) {
  configData.getConfig((err, config) => {
    const toRet = { config };
    log.debug(`== Configuration to return :${toRet} ==`);
    httpHelper.response(res, err, toRet);
  });
}
function updateConfig(req, res) {
  let oldConfig;
  let oldPath;
  let newPath;
  log.info('[UPDATE CONFIG]');
  log.info(` Received body: ${JSON.stringify(req.body)} `);
  async.waterfall([
    (cb) => Checker.checkParams(req.body, ['config'], cb),
    (cb) => Checker.checkParams(req.body.config, ['name', 'mainDir'], cb),
    (cb) => AppConditions.check(req.body.config.name, 'filetype', cb),
    (cb) => AppConditions.check(req.body.config.mainDir, 'filetype', cb),
    (cb) => configData.getConfig(cb),
    (configuration, cb) => LabStates.checkSome(configuration.name, 'RUNNING', cb),
    (someInState, labsWrong, cb) => {
      log.info('Data correct, check state');
      log.info(someInState);
      log.info(labsWrong);
      if (someInState) {
        cb(Checker.errorLabNoStopped(labsWrong));
      }
      else if (req.body.config.githubURL) {
        Checker.checkGitUrl(req.body.config.githubURL, (err) => {
          cb(err);
        });

      } else cb(null);
    },
    // Get config data
    (cb) => configData.getConfig(cb),
    // Rename the root directory
    (cd, cb) => {
      oldConfig = cd; // Set oldConfig for further elaboration
      oldPath = path.join(appUtils.getHome(), oldConfig.mainDir);
      newPath = path.join(appUtils.getHome(), req.body.config.mainDir);
      appUtils.renameDir(oldPath, newPath, cb);
    },
    // Rename the user directory
    (cb) => {
      // Change new user path (now it's in new root main dir)
      const oldUserPath = path.join(newPath, oldConfig.name);
      const newUserPath = path.join(newPath, req.body.config.name);
      appUtils.renameDir(oldUserPath, newUserPath, cb);
    },
    // Update the state table
    // Update the configuration file
    (cb) => configData.updateConfig(req.body.config, cb),
    // User repo
    (cb) => {
      if (oldConfig.name !== req.body.config.name) {
        // Update all old repo state names
        LabStates.editStates(oldConfig.name, { repoName: req.body.config.name }, cb);
      } else cb(null);
    }
  ], (err) => {
    appUtils.response('UPDATE CONFIG', res, err);
  });
}
exports.updateConfig = updateConfig;
exports.getConfig = getConfig;
