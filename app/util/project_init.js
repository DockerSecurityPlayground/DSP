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


function resolveConfigPath(configPathOrName) {
  if (path.isAbsolute(configPathOrName)) {
    return configPathOrName;
  }
  return path.join(appRoot.toString(), 'config', configPathOrName);
}


function ensureMainDir(homeDSP) {
  if (!fs.existsSync(homeDSP)) {
    fs.mkdirSync(homeDSP);
    return;
  }

  const stat = fs.statSync(homeDSP);
  if (!stat.isDirectory()) {
    throw new Error(`Path exists and is not a directory: ${homeDSP}`);
  }

  const existingEntries = fs.readdirSync(homeDSP);
  if (existingEntries.length > 0) {
    throw new Error(`Directory already exists and is not empty: ${homeDSP}`);
  }
}

function hasOnlyConfigStorage(homeDSP, configFilePath) {
  if (!path.isAbsolute(configFilePath)) {
    return false;
  }

  const relativeConfigPath = path.relative(homeDSP, configFilePath);
  if (!relativeConfigPath || relativeConfigPath.startsWith('..') || path.isAbsolute(relativeConfigPath)) {
    return false;
  }

  const parts = relativeConfigPath.split(path.sep).filter(Boolean);
  if (parts.length < 1) {
    return false;
  }

  if (parts.length === 1) {
    const rootEntries = fs.readdirSync(homeDSP);
    const expectedName = parts[0];
    if (rootEntries.length !== 1 || rootEntries[0] !== expectedName) {
      return false;
    }
    const configCandidate = path.join(homeDSP, expectedName);
    return fs.existsSync(configCandidate) && fs.statSync(configCandidate).isFile();
  }

  const topEntry = parts[0];
  const rootEntries = fs.readdirSync(homeDSP);
  if (rootEntries.some((entry) => entry !== topEntry)) {
    return false;
  }

  let cursor = path.join(homeDSP, topEntry);
  if (!fs.existsSync(cursor) || !fs.statSync(cursor).isDirectory()) {
    return false;
  }

  for (let i = 1; i < parts.length; i += 1) {
    const expectedName = parts[i];
    const entries = fs.readdirSync(cursor);

    if (entries.length !== 1 || entries[0] !== expectedName) {
      return false;
    }

    const expectedPath = path.join(cursor, expectedName);
    if (i === parts.length - 1) {
      return fs.existsSync(expectedPath) && fs.statSync(expectedPath).isFile();
    }

    if (!fs.statSync(expectedPath).isDirectory()) {
      return false;
    }
    cursor = expectedPath;
  }

  return false;
}


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
  const configDir = resolveConfigPath(nameConfig);
  try {
    fs.mkdirSync(path.dirname(configDir), { recursive: true });
    jsonfile.writeFileSync(configDir, config);
    callback(null);
  } catch (err) {
    log.error(`Failed to create config at ${configDir}: ${err.message}`);
    callback(err);
  }
};

exports.createDSP = (nameConfig, repo , callback, notifyCallback) => {
  log.info('Creating DSP directories');
  try {
    const configDir = resolveConfigPath(nameConfig);
    const config = jsonfile.readFileSync(configDir);
    const homeDSP = path.join(appUtils.getHome(), config.mainDir);
    // Allow install into a pre-created but empty main directory.
    // Also allow the autoinstall bootstrap case where only the config subtree exists.
    try {
      ensureMainDir(homeDSP);
    } catch (err) {
      if (!hasOnlyConfigStorage(homeDSP, configDir)) {
        throw err;
      }
      log.info(`Main directory ${homeDSP} already contains only config storage, continuing installation`);
    }
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
