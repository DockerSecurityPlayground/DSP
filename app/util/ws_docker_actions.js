const networkData = require('../data/network.js');
const appRoot = require('app-root-path');
const configData = require('../data/config.js');
const dockerImages = require('../data/docker-images.js');
const dockerComposer = require('mydockerjs').dockerComposer;
const imageMgr = require('mydockerjs').imageMgr;
const homedir = require('homedir');
const path = require('path');
const async = require('async');
const Checker = require('./AppChecker');
const LabStates = require('./LabStates');
const appUtils = require('../util/AppUtils');
const fs = require('fs');
const rimraf = require('rimraf');


const dockerAction = require(`${appRoot}/app/data/docker_actions`);
const dockerFilesToCopy = require(`${appRoot}/app/data/docker_filesToCopy`);
const log = appUtils.getLogger();
const downloadPath = 'public/downloads';


// Start compose up and execute commands in body there are cListToDraw containers
exports.composeUp = function composeUp(params, body, callback, notifyCallback) {
  let networkInfo;
  let mainDir;
  let thePath;
  let config;
  let pathCopyDirectory

  async.waterfall([
    (cb) => Checker.checkParams(params, ['namelab', 'namerepo'], cb),
    // Check if all images exists
    (cb) => dockerImages.getImagesLabNames(params.namerepo, params.namelab, cb),
    (imagesLab, cb) => imageMgr.areImagesInstalled(imagesLab, cb),
    (installedResult, cb) => {
      if(installedResult.areInstalled) {
        cb(null);
      } else {
        cb(new Error(`The following images are not installed: ${installedResult.notInstalled}`));
      }
    },
    (cb) => configData.getConfig(cb),
    // Create download directory
    (theConfig, cb) => {
      pathCopyDirectory = path.join(downloadPath, `${params.namerepo}_${params.namelab}`);
      config = theConfig;
      if(!fs.existsSync(pathCopyDirectory)) {
        fs.mkdir(pathCopyDirectory, cb);
      }
      else cb(null);
    },
    // call docker compose up
    (cb) => {
      mainDir = config.mainDir;
      thePath = path.join(homedir(), mainDir, params.namerepo, params.namelab);
      // Don't block if some action error is verified but notify to interface

      // Call docker-compose up
      dockerComposer.up(thePath, (err) => {
        // No errors : call all the docker-compose exec commands
        if (!err) {
          cb(null);
        } else cb(err);
      },
    notifyCallback);
    },
    // Get clistToDraw
    (cb) => {
      networkData.get(params.namerepo, params.namelab, cb);
    },
    // Copy before actions
    (ni, cb) => {
      networkInfo = ni;
      dockerFilesToCopy.copyBeforeActions(mainDir, params.namerepo,
          thePath, networkInfo.clistToDraw, cb);
    },

    // Actions
    (cb) => {
      log.info('[MANAGE ACTIONS]');
      // Mangage actions
      // in clistToDraw
      // const actions = dockerAction.getActions(networkInfo.clistToDraw, (err, actions));
      dockerAction.getActions(networkInfo.clistToDraw, (errAction, actions) => {
        // If some err action throw error
        if (errAction) cb(errAction);
        else {
          // For each action call docker-compose exec
          async.eachSeries(actions, (a, innerCallback) => {
            log.info('Calling action:');
            const command = dockerAction.getCommand(a);
            log.info(`${a.cname} ${command}`);
            if (a.backgroundMode) {
              log.info(`${command} in backgroundMode`);
            }
          const params = { detached: a.backgroundMode };
          // call docker-compose exec service (cname) command (a.command)
          // TO SEE THE PROBLEM OF DETACHED COMMAND SHOULD CALL DOCKER-COMPOSE exec -d
          // ref: https://github.com/docker/compose/issues/4690
          // Default value : labname_containername_1
            dockerComposer.exec(thePath, a.cname, command, (err, data) => {
              if (err) {
                innerCallback(err);
              } else {
                log.info('Result command:');
                log.info(data);
                innerCallback(null);
              }
            // In background mode (set false for debugging)
            }, params);
            // End loop , final function
          }, (err) => {
            cb(err);
          });
        }
      });
    },

        // files to copy
        // Those copy files are done after the actions
    (cb) => {
      // Mangage actions
      // in clistToDraw
      // After actions
      log.info('COPY AFTER');
      dockerFilesToCopy.copyAfterActions(mainDir, params.namerepo,
            thePath, networkInfo.clistToDraw, cb);
    }, // End manage files to copy

    // After all correct operations set state to running
    (cb) => {
      log.info('UPDATE THE STATE TO RUNNING');
      LabStates.setRunningState(params.namerepo, params.namelab, cb);
    }
  ],

    // End function , return correct or error
    (err) => {
      if (err) {
        // Remove download repository
        if (pathCopyDirectory) {
          rimraf.sync(path.join(pathCopyDirectory, params.namelab));
        }
        // Call dockerComposer down if thePath has been defined (already dockerCompose up)
        if (thePath) {
          dockerComposer.down(thePath, (errDown) => {
            // Log the error of compose down
            if (errDown) log.error(`ERROR IN COMPOSE DOWN : ${errDown.message}`);
            // Send error to user
            callback(err);
          });
        }
        else callback(err)
      }
      else callback(null);
    });
};

exports.composeDown = function composeDown(params, body, callback, notifyCallback) {
  log.info('[COMPOSE DOWN]');
  async.waterfall([
    (cb) => Checker.checkParams(params, ['namelab', 'namerepo'], cb),
    (cb) => configData.getConfig(cb),
  // build path
    (config, cb) => {
      const mainDir = config.mainDir;
      const thePath = path.join(homedir(), mainDir, params.namerepo, params.namelab);
      // Remove download repository
      const toRemoveElement = `${params.namerepo}_${params.namelab}`;
      rimraf.sync(path.join(downloadPath, toRemoveElement));
      // Call docker-compose down
      dockerComposer.down(thePath, (err) => {
        if (!err) { cb(null); } else cb(err);
      }, notifyCallback);
    },
    (cb) => {
      log.info('UPDATE THE STATE TO STOPPED');
      LabStates.setStopState(params.namerepo, params.namelab, cb);
    }
  ],
  // End function , return correct or error
  (err) => {
    if (err) {
      log.error(err.message);
    }
    callback(err);
  });
};
exports.downloadImages = function downloadImages(params, body, callback, notifyCallback) {
  log.info('[DOCKER ACTIONS - DOWNLOAD IMAGE]')
  async.waterfall([
    (cb) => Checker.checkParams(params, ['name', 'tag'], cb),
    (cb) => imageMgr.pullImage(params.name, params.tag, callback, notifyCallback)
  ],
  (err) => {
    if (err) {
      log.error(err.message);
    }
    callback(err)
  })
};

exports.removeImage = function removeImage(params, body, callback) {
  log.info('[DOCKER ACTIONS - REMOVE IMAGE]')
  async.waterfall([
    (cb) => Checker.checkParams(params, ['name', 'tag'], cb),
    (cb) => imageMgr.removeImage(params.name, params.tag, callback)
  ],
  (err) => {
    if (err) {
      log.error(err.message);
    }
    callback(err)
  })
}
