const appRoot = require('app-root-path');
const path = require('path');
const homedir = require('homedir');
const jsonfile = require('jsonfile');
const fs = require('fs');
const os = require('os');
const async = require('async');
const appUtils = require('./AppUtils');
const cmd = require('node-cmd');
const repogitData = require('./repogitData.js');
const LabStates = require('./LabStates.js');

function cloneProject(nameProject, githubUrl, callback) {
  const log = appUtils.getLogger();
  log.info('Cloning...');
  log.info(nameProject);
  log.info(githubUrl);
  repogitData.clone(githubUrl, { reponame: nameProject },
      (error, response) => {
        log.info('clone finish');
        if (error) callback(error);
        else callback(null, response);
      });
}
function buildImages(repoName, callback, notifyCallback) {
  const log = appUtils.getLogger();
  log.info(`Build images of ${repoName}`);
  const configurationName = path.basename(appUtils.path_userconfig());
  log.info('Build images');
  let dataLine = '';
  const configJSON = jsonfile.readFileSync(path.join(appRoot.toString(), 'config', configurationName));
  const repoPath = path.normalize(path.join(homedir(), configJSON.mainDir, repoName, '.docker-images'));
  let command;
  let updateCmd;
  // Look at OS to select update script (Windows not yet implemented)
  if (os.platform === 'win32') {
    updateCmd = 'update.bat';
    command = `${path.join(repoPath, updateCmd)}`;
  }
  else {
    updateCmd = 'update.sh';
    command = `cd ${repoPath}; chmod +x ${updateCmd} ; sh ${updateCmd}`;
  }
 // const command = `cd ${repoPath}; chmod +x ${updateCmd} ; .${path.sep}${updateCmd}`;
  // const command = `cd ${repoPath}; chmod +x ${updateCmd} ; ${updateCmd}`;
  log.info(`Executing ${command}`);

  if (!fs.existsSync(path.join(repoPath, updateCmd))) {
    log.warn(`.docker-images/${updateCmd} no found !`);
    callback(null);
  }
  else {
    const processRef = cmd.get(command, (err, data) => {
      callback(err, data);
    });
    // listen to the python terminal output
    processRef.stdout.on(
          'data',
          (data) => {
            dataLine += data;
            if (dataLine[dataLine.length - 1] === '\n') {
              if (notifyCallback && typeof notifyCallback === 'function') { notifyCallback(dataLine); }
              log.info(dataLine);
            }
          });
  }
}
// Clone projects, intialize states then build images by looking at the "update.sh script" inside the repository directory
function initRepository(nameProject, githubUrl, callback, notifyCallback) {
  async.waterfall([
    (cb) => cloneProject(nameProject, githubUrl, cb),
    (res, cb) => LabStates.initStates(nameProject, cb),
    (cb) => buildImages(nameProject, cb, notifyCallback),
  ], (err) => callback(err));
}
// exports.getLocalConfigSync = getLocalConfigSync;

module.exports = {
  initRepository,
  buildImages
};
