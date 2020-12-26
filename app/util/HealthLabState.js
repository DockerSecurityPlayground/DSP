const dockerComposer = require('mydockerjs').dockerComposer;
const fs = require('fs');
const path = require('path');
const LabStates = require('./LabStates.js');
const async = require('async');
const AppUtils = require('./AppUtils.js');
const _ = require('underscore');

// function checkLabels() {
//
// }
//
//
// function checkInfoDescription() {
//
// }

const log = AppUtils.getLogger();
function getPathName(labPath) {
const pathName = path.join(path.basename(path.dirname(labPath)), path.basename(labPath));
return pathName;
}
function checkNetworkDescription(labPath) {
  let hasDocker = true;
  const networkFile = path.join(labPath, 'network.json');
  const dockerComposeFile = path.join(labPath, 'docker-compose.yml');
  const pathName = getPathName(labPath);
  // This is noot relevant because we can import projects now
  // if (!fs.existsSync(networkFile)) {
  //   log.warn(`${pathName} doesn't have a network.json file!`);
  // }

  if (!fs.existsSync(dockerComposeFile)) {
    log.warn(`${pathName} doesn't have a docker-compose.yml file!`);
    hasDocker = false;
  }

  return hasDocker;
}


module.exports = {
  run(cb, debug) {
    log.info(`Start Healt Checker in ${debug ? 'debug' : 'normal'} mode!`);
    const allDirs = AppUtils.getAllDSPDirsSync();

    async.eachSeries(allDirs, (d, c) => {
      const hasDocker = checkNetworkDescription(d.thePath);
      // STATE TABLE TO UPDATE
      if (hasDocker && !LabStates.existsSync(d.repoName, d.labName)) {
        log.warn(`${getPathName(d.thePath)} is not inside the state table! Checking if is running...`);
        dockerComposer.isRunning(d.thePath, (err, isRunning) => {
          if (err) {
            log.warn('ERROR in dockerComposer library!');
            log.warn(err);
          }
          log.info(`State lab : ${isRunning ? 'running' : 'stopped'}`);
          LabStates.newStateSync(d.repoName, d.labName, isRunning ?
              'RUNNING' : 'STOPPED');

          c(null);
        });
      }
      else c(null);
    }, (err) => {
        LabStates.removeDirtyStates(allDirs, cb);
    });
  }
};
