const fs = require('fs');
const appRoot = require('app-root-path');
const jsonfile = require('jsonfile');
const path = require('path');
const appUtils = require('../util/AppUtils');
const gitUtils = require('../util/GitUtils');
const async = require('async');
const localConfig = require('../../config/local.config.json');
const rimraf = require('rimraf');

const log = appUtils.getLogger();


function initUserRepo(homeDSP, config) {
  // Create .dsp inside user dir
  const dspID = path.join(homeDSP, config.name, '.dsp');
  const dataDIR = path.join(homeDSP, config.name, '.data');
  const dockerfileDIR = path.join(homeDSP, config.name, '.dockerfiles');
  const labelsJSON = path.join(homeDSP, config.name, 'labels.json');
  const snippetsJSON = path.join(homeDSP, config.name, 'snippets.json')
  if (!fs.existsSync(dspID)) fs.writeFileSync(dspID, '');
  // Create .data directory
  if (!fs.existsSync(dataDIR)) fs.mkdirSync(dataDIR);
  // Create .dockerfiles directory
  if (!fs.existsSync(dockerfileDIR)) fs.mkdirSync(dockerfileDIR);
  // Create labels.json file
  if (!fs.existsSync(labelsJSON)) {
    jsonfile.writeFileSync(labelsJSON,
  { labels: [] });
  }
  if (!fs.existsSync(snippetsJSON)) {
    jsonfile.writeFileSync(snippetsJSON,
  { snippets: [] });
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

exports.createDSP = (nameConfig, repo , callback, notifyCallback) => {
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

      let dspRepo = {
        name: config.name,
        url: config.githubURL,
        isPrivate : repo.isPrivate,
        username : repo.username,
        token : repo.token,
        sshKeyPath: config.sshKeyPath,
      };
      gitUtils.initRepository( dspRepo, (err) => {
        if (err) {
          rimraf(homeDSP, function () {
            log.error("Removed repo dir because has occurred error in git clone");
          });
          callback(err);
        }
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

    gitUtils.initRepository({'name' : item.name,'url' : item.url}, c, notifyCallback);
  },
  (err) => callback(err));
};
