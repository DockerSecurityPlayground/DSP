const path = require('path');
const homedir = require('homedir');
const repogitData = require('../util/repogitData.js');
const configData = require('../data/config.js');
const localConfig = require('../../config/local.config.json');
const async = require('async');
const fs = require('fs');
const rimraf = require('rimraf');
const Checker = require('../util/AppChecker');
const AppUtils = require('../util/AppUtils');
const GitUtils = require('../util/GitUtils');
const LabStates = require('../util/LabStates');
const randomstring = require('randomstring');

const JoiConditions = Checker.JoiAppConditions;
const log = AppUtils.getLogger();

const api = {

  synchronizeLocalGithub(params, callback) {
    log.info('[ SYNCHRONIZE LOCAL GITHUB ]');
    // Temporary directory
    let tmpUserDir;
    let userPath;
    let username;
    let oldConfig;
    async.waterfall([
      (cb) => Checker.checkParams(params, ['githubURL'], cb),
      // Check if is an url
      (cb) => JoiConditions.check(params.githubURL, 'url', cb),
      (resp, cb) => configData.getConfig(cb),
      // Get repoconf.json
      // Move directory temporanealy
      (config, cb) => {
        oldConfig = config;
        userPath = path.join(homedir(), config.mainDir, config.name);
        username = config.name;
        const random = randomstring.generate({
          length: 5,
          charset: 'alphabetic'
        });
        const tmpRandom = `.tempUserDir${random}`;
        tmpUserDir = path.join(homedir(), config.mainDir, tmpRandom);
        log.info(' delete local username dir');
        fs.rename(userPath, tmpUserDir, cb);
      },
      (cb) => fs.mkdir(userPath, cb),
      // Clone repository
      (cb) => GitUtils.initRepository(username, params.githubURL, cb,
          (dataline) => log.debug(dataline)),
      // No error in init repository, add github url to configuratoin file
      (cb) => {
        const newConfig = oldConfig;
        newConfig.githubURL = params.githubURL;
        configData.updateConfig(newConfig, cb);
      }
    ], (err) => {
      // If some error delete actual userPath and recover tmpUserDir
      if (err) {
        log.error('ERROR, RECOVER OLD PATH');
        rimraf.sync(userPath);
        fs.renameSync(tmpUserDir, userPath);
        callback(err);
      }
      else {
        rimraf(tmpUserDir, callback);
      }
    });
  },

  updateProjects(callback) {
    log.info('[IN UPDATE PROJECTS API]');
    let repos;
    let rootDir;
    async.waterfall([
      (cb) => configData.getConfig(cb),
      (config, cb) => {
        rootDir = config.mainDir;
        repos = localConfig.config.repos;
        cb(null);
      },
      /* Check if all are stopped
          NOTE: When clone for the first time
          the state af all cloned labs is setted to STOPPED
          DSP trusts that all labs inside the cloned labs
          are not in NO_NETWORK state during cloning ->
          (See initRepositories inside project_init.js  function )
        */
      (cb) => {
        log.info(' Check all stopped ');
        async.eachSeries(repos, (r, c) => {
          LabStates.checkAll(r.name, 'STOPPED', (err, areStopped, labsRunning) => {
            if (err) c(err);
            else if (areStopped) c(null);
            else {
              log.warn(`${r.name} is not stopped!`);
              // Send to web socket response all running labs
              c(Checker.errorLabNoStopped(labsRunning));
            }
          });
        }, // Final after eachSeries
        (errCheck) => {
          cb(errCheck);
        });
      }, // End callback check are stopped
      (cb) => {
        log.info(' All stopped, pulling repos ');
        // For each repo call pullRepo
        async.eachSeries(repos, (item, c) => {
          log.info(`PULLING ${item}...`);
          // Pull repo and update the table state
          repogitData.pullRepo(path.join(homedir(), rootDir, item.name), (err) => {
            if (err) c(err);
            // If no error  it's been pulled, update the state file
            else {
              log.info('Building images');
              GitUtils.buildImages(item.name, (buildErr) => {
                if (buildErr) c(buildErr);
                // Initialize the states of repository
                else LabStates.initStates(item.name, c);
              });
              // End waterfall -> call parent callback
              (someErrorInternal) => c(someErrorInternal);
            }
          }, (dataLine) => log.debug(dataLine));
        }, (err) => cb(err));
      }],
    (err) => callback(err));
  }
};


module.exports = api;
