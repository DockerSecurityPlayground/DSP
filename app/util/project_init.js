const fs = require('fs');
const appRoot = require('app-root-path');
const jsonfile = require('jsonfile');
const path = require('path');
const appUtils = require('../util/AppUtils');
const gitUtils = require('../util/GitUtils');
const async = require('async');
const localConfig = require('../../config/local.config.json');

const log = appUtils.getLogger();


function initUserRepo(homeDSP, config) {
  // Create .dsp inside user dir
  const dspID = path.join(homeDSP, config.name, '.dsp');
  const dataDIR = path.join(homeDSP, config.name, '.data');
  const labelsJSON = path.join(homeDSP, config.name, 'labels.json');
  if (!fs.existsSync(dspID)) fs.writeFileSync(dspID);
  // Create .data directory
  if (!fs.existsSync(dataDIR)) fs.mkdirSync(dataDIR);
  // Create labels.json file
  if (!fs.existsSync(labelsJSON)) {
    jsonfile.writeFileSync(labelsJSON,
  { labels: [] });
  }
}
// Create configuration file throws an error if already exists
exports.createConfig = (nameConfig, config, callback) => {
  const configDir = path.join(appRoot.toString(), 'config', nameConfig);
  try {
    jsonfile.writeFileSync(configDir, config);
    callback(null);
  } catch (err) {
    log.info('SOME ERROR');
    callback(err);
  }
};

exports.createDSP = (nameConfig, callback, notifyCallback) => {
  log.info('Creating DSP directories');
  try {
    const configDir = path.join(appRoot.toString(), 'config', nameConfig);
    const config = jsonfile.readFileSync(configDir);
    const homeDSP = path.join(appUtils.getHome(), config.mainDir);
    // Create main directory
    fs.mkdirSync(homeDSP);
    // Create json file labStates
    jsonfile.writeFileSync(path.join(homeDSP, 'lab_states.json'), []);
    // Create first version file
    jsonfile.writeFileSync(path.join(homeDSP, 'version.json'), {version:"1.0"});
    // Create shared directory
    fs.mkdirSync(path.join(homeDSP, 'shared'), []);
    // No synchronization with github
    if (!config.githubURL) {
      log.info('No synchronization with github: create local dir');
      // Create user directory
      fs.mkdirSync(path.join(homeDSP, config.name));
      initUserRepo(homeDSP, config);
      callback(null);
    }
    // Synchronization with github
    else {
      log.info('Synchronization with GITHUB, clone user repository');
      gitUtils.initRepository(config.name, config.githubURL, (err) => {
        if (err) callback(err);
        else {
          log.info('Success in sync');
          initUserRepo(homeDSP, config);
          callback(null);
        }
      }, notifyCallback);
    }
  } catch (err) {
    callback(err);
  }
};

exports.initRepos = (callback, notifyCallback) => {
  const repos = localConfig.config.repos;
  async.eachSeries(repos, (item, c) => {
    gitUtils.initRepository(item.name, item.url, c, notifyCallback);
  },
  (err) => callback(err));
};
