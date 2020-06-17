const appRoot = require('app-root-path');
const path = require('path');
const jsonfile = require('jsonfile');
const fs = require('fs');
const os = require('os');
const async = require('async');
const appUtils = require('./AppUtils');
const cmd = require('node-cmd');
const _ = require('underscore');
const repogitData = require('./repogitData.js');
const LabStates = require('./LabStates.js');
const dockerManager = require('../data/docker-images.js');
const imageMgr = require('mydockerjs').imageMgr;


// Clone a project in the main directory
function cloneProject(repo, callback) {
  const log = appUtils.getLogger();
  const githubUrl = repo.url;
  let params = { reponame: repo.name };
  log.info('Cloning...');
  log.info(repo.name);
  log.info(githubUrl);

  //Make params for git clone private repo
  if (repo.hasOwnProperty("isPrivate") && repo.isPrivate){
    log.info('Repo is private');
    params.isPrivate = repo.isPrivate;
    if (repo.hasOwnProperty("sshKeyPath") && repo.sshKeyPath) {
      params.sshKeyPath = repo.sshKeyPath;
    }else if (repo.hasOwnProperty("username") && repo.hasOwnProperty("token") && repo.username && repo.token) {
      params.username = repo.username;
      params.token = repo.token;
    } else {
      log.error("No AUTH");
    }
  }

  repogitData.clone(githubUrl, params,
      (error, response) => {
        log.info('clone finish');
        if (error) callback(error);
        else callback(null, response);
      });
}
function buildImages(repoName, callback, notifyCallback) {
  const MAX_LOG_LENGTH = 500;
  const log = appUtils.getLogger();
  log.info(`Build images of ${repoName}`);
  const configurationName = path.basename(appUtils.path_userconfig());
  log.info('Build images');
  let dataLine = '';
  const configJSON = jsonfile.readFileSync(path.join(appRoot.toString(), 'config', configurationName));
  const repoPath = path.normalize(path.join(appUtils.getHome(), configJSON.mainDir, repoName, '.docker-images'));
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
            // Trim dataline to MAX_LOGLENGTH
            if (dataLine.length > MAX_LOG_LENGTH)
              dataLine = ""
            dataLine += data;
            if (dataLine[dataLine.length - 1] === '\n') {
              if (notifyCallback && typeof notifyCallback === 'function') { notifyCallback(dataLine); }
              log.info(dataLine);
            }
          });
  }
}
// Clone projects, intialize states then build images by looking at the "update.sh script" inside the repository directory
function initRepository(repo, callback, notifyCallback) {
  const log = appUtils.getLogger();
  const nameProject = repo.name;
  async.waterfall([
    (cb) => cloneProject(repo, cb),
    (res, cb) => LabStates.initStates(nameProject, cb),
    //(cb) => dockerManager.getImagesAllLabs(nameProject, cb),
   //(data, cb) => {
   //  let images = data.images;
   //  async.eachSeries(images, (i, c) => {
   //    if (!i.contains) {
   //      log.info(`Download Image ${i.name}`);
   //      imageSep = i.name.split(":")
   //      nameToDownload = imageSep[0]
   //      tagToDownload = imageSep[1]
   //      imageMgr.pullImage(nameToDownload, tagToDownload, c, notifyCallback)
   //    }
   //      else {
   //      toStr = `Image ${i.name} already present, skipping`
   //      log.info(toStr);
   //      notifyCallback(toStr)
   //      c(null)
   //    }
   //  },
   //   (err) => cb(err))
  // }
    // IMAGES ARE NOT MORE
    // (cb) => buildImages(nameProject, cb, notifyCallback),
  ], (err) => callback(err));
}

function updateRepoUrl(repo, callback){
  const log = appUtils.getLogger();
  const nameProject = repo.name;
  if(repo.username && repo.token && repo.username !== '' && repo.token !== ''){
    repogitData.updateRepoUrl(repo.name, repo.username, repo.token, repo.url, (error) =>{
      if (error) callback(error);
      else callback(null);
    });
  }else
    callback(null);
}
// exports.getLocalConfigSync = getLocalConfigSync;

module.exports = {
  initRepository,
  buildImages,
  updateRepoUrl
};
