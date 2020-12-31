const networkData = require('../data/network.js');
const appRoot = require('app-root-path');
const configData = require('../data/config.js');
const dockerImages = require('../data/docker-images.js');
const dockerAction = require(`${appRoot}/app/data/docker_actions`);
const dockerFilesToCopy = require(`${appRoot}/app/data/docker_filesToCopy`);
const dockerTools = require('../data/docker-tools.js');
const dockerComposer = require('mydockerjs').dockerComposer;
const dockerManager = require('mydockerjs').docker;
const _ = require('underscore');
const imageMgr = require('mydockerjs').imageMgr;
const path = require('path');
const async = require('async');
const Checker = require('./AppChecker');
const LabStates = require('./LabStates');
const appUtils = require('../util/AppUtils');
const fs = require('fs');
const rimraf = require('rimraf');
const service_prefix="dsp_hacktool"
const oneline_prefix="dsp_oneline"


// CONSTANTS
const SERVICE_PREFIX="dsp_hacktool"
const ONELINE_PREFIX="dsp_oneline"
const DEFAULT_TAG = "latest";

const HACK_TOOL_PATH = path.join(appRoot.toString(), "hacktool_volume");
const HACK_TOOL_CONTAINER_PATH = "/shared";


const log = appUtils.getLogger();
const downloadPath = 'public/downloads';


exports.areImagesInstalled = function areImgesInstalled(params, callback) {
  async.waterfall([
    (cb) => Checker.checkParams(params, ['namelab', 'namerepo'], cb),
    // Check if all images exists
    (cb) => dockerImages.getImagesLabNames(params.namerepo, params.namelab, cb),
    (imagesLab, cb) => imageMgr.areImagesInstalled(imagesLab, cb)],
    // End function , return correct or error
    (err, areInstalled) => callback(err, areInstalled));
}

exports.build = function build(params, body, callback, notifyCallback) {
  const DOCKER_USERNAME = "dockersecplayground"
  const DOCKER_TAG = "latest";
  console.log(params);

  let up = "";
  let imageTag = "";
  let dockerRepo = "";
  async.waterfall([
    (cb) => Checker.checkParams(params, ['dockerfile'], cb),
    (cb) => configData.getConfig(cb),
    // Only in user path
    (config, cb) => {
      up = path.join(appUtils.getHome(), config.mainDir, config.name);
      // By default dockersecplayground
      dockerRepo = config.dockerRepo ? config.dockerRepo : DOCKER_USERNAME;
      imageTag = params.tagImage &&  params.tagImage !== "" ? params.tagImage : DOCKER_TAG;
      cb(null);
    },
    // (cb) => {
    //   if (!params.repo) {
    //     configData.getUserPath(cb);
    //   } else {
    //     configData.getMainDir((err, mainDir) => {
    //       if (err) {
    //         cb(err);
    //       } else {
    //         cb(null, path.join(mainDir, params.repo));
    //       }
    //     });
    //   };
    // },
    (cb) => cb(null, path.join(up, '.dockerfiles', params.dockerfile)),
    (dockerfilePath, cb) => {
      dockerManager.taggedBuild(dockerfilePath, `${dockerRepo}/${params.dockerfile}`, imageTag, cb, notifyCallback)
    },
    (output, cb) => {
      if (params.needToPush) {
        log.info("Push image");
        imageMgr.pushImage(`${dockerRepo}/${params.dockerfile}`, imageTag, cb, notifyCallback);
      } else cb(null);
    }], (err) => callback(err))
}

exports.dockerRun = function dockerRun(params, callback, notifyCallback){
  log.info('[DOCKER ACTIONS - RUN SERVICE ONE LINE]');
  let chosenHackTool = {};
  async.waterfall([
    // (cb) => Checker.checkParams(params.currentContainer, ['name', 'isOneLine', 'OneLineNetwork', 'command'], cb),
    (cb) => Checker.checkParams(params.currentContainer, ['name', 'command'], cb),
    (cb) => Checker.checkParams(params.currentContainer.selectedImage, ['label', 'name', 'tag'], cb),
    // Get hack tool
    (cb) => {
      try {
        chosenHackTool = dockerTools.get(params.currentContainer.selectedImage.label);
        cb(null);
      } catch (err) {
        cb(err);
      }
    },
    (cb) => imageMgr.isImageInstalled(params.currentContainer.selectedImage.name + ":" + params.currentContainer.selectedImage.tag, cb),
    (isImageInstalled, cb) => {
      if (isImageInstalled) {
        log.info('Image already installed');
        cb(null);
      } else {
        log.info("Image not installed, pull image");
        imageMgr.pullImage(params.currentContainer.selectedImage.name, params.currentContainer.selectedImage.tag, cb, notifyCallback);
      };
    },
    (cb) => {
      let image = params.currentContainer.selectedImage.name + ":" + params.currentContainer.selectedImage.tag;
      const options = {
        // name: SERVICE_PREFIX + "_" + params.currentContainer.selectedImage.label,
        name: ONELINE_PREFIX + "_" + params.currentContainer.name,
        rm : true,
        cmd: params.currentContainer.command,
        net: (params.currentContainer.OneLineNetworks instanceof Array) ? params.currentContainer.OneLineNetworks : [],
        volumes: [{
          hostPath: HACK_TOOL_PATH,
          containerPath: HACK_TOOL_CONTAINER_PATH}
        ]
      }
      const dockerOptions = _.extend(chosenHackTool.default_options, options)
      dockerManager.run(image, callback, dockerOptions, notifyCallback, notifyCallback);
    }
  ],
    (err) => {
      if (err) {
        log.error(err.message);
      }
      callback(err)
    })
}



// Start compose up and execute commands in body there are cListToDraw containers
exports.composeUp = function composeUp(params, body, callback, notifyCallback) {
  let networkInfo;
  let mainDir;
  let thePath;
  let config;
  let pathCopyDirectory
  let dockerComposeOptions = "";

  async.waterfall([
    // (cb) => Checker.checkParams(params, ['namelab', 'namerepo'], cb),
    (cb) => Checker.checkParams(params, ['namelab'], cb),
    (cb) => configData.getConfig(cb),
    (theConfig, cb) => {
      config = theConfig;
      if (!params.namerepo) {
        log.info('namerepo not defined, set default to user name');
        params.namerepo = config.name;
      }
      cb(null)
    },
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
    // Create download directory
    (cb) => {
      pathCopyDirectory = path.join(downloadPath, `${params.namerepo}_${params.namelab}`);
      if(!fs.existsSync(pathCopyDirectory)) {
        fs.mkdir(pathCopyDirectory, cb);
      }
      else cb(null);
    },
    // Get clistToDraw
    (cb) => {
      networkData.get(params.namerepo, params.namelab, cb);
    },
    (ni, cb) => {
      networkInfo = ni;
      dockerComposeOptions = dockerAction.getComposeOptions(ni.clistToDraw);
      cb(null);

    },
    // call docker compose up
    (cb) => {
      mainDir = config.mainDir;
      thePath = path.join(appUtils.getHome(), mainDir, params.namerepo, params.namelab);
      // Don't block if some action error is verified but notify to interface

      // Call docker-compose up
      dockerComposer.up(thePath, (err) => {
        // No errors : call all the docker-compose exec commands
        if (!err) {
          cb(null);
        } else cb(err);
      },
        notifyCallback, dockerComposeOptions);
    },
    // Copy before actions
    (cb) => {
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
exports.httpdRun  = function httpdRun(body, callback, notifyCallback) {
  log.info("[WS DOCKER ACTIONS] Start Httpd Service");
  async.waterfall([
    (cb) => Checker.checkParams(body, ['hostPort'], cb),
    (cb) => dockerTools.isHttpdServiceInstalled(cb),
    (isImageInstalled, cb) => {
      if (isImageInstalled)
        cb(null, "");
      else  {
        dockerTools.installHttpdService(cb, notifyCallback);
      }
    }, (data, cb) => {
        dockerTools.runHttpdService(cb, body.hostPort, notifyCallback);
    }], (err) => callback(err));
}

exports.captureRun  = function captureRun(body, callback, notifyCallback) {
  log.info("[WS DOCKER ACTIONS] Start Capture Service");
  async.waterfall([
    (cb) => Checker.checkParams(body, ['machinesToBeSniffed', 'lab'], cb),
    (cb) => dockerTools.isTcpdumpInstalled(cb),
    (isImageInstalled, cb) => {
      if (isImageInstalled)
        cb(null, "");
      else  {
        dockerTools.installTcpdump(cb, notifyCallback);
      }
    }, (data, cb) => {
      dockerTools.runTcpdump(cb, body.lab, body.machinesToBeSniffed, body.sessionName, notifyCallback);
    }], (err) => callback(err));
}
exports.kaliRun  = function kaliRun(callback, notifyCallback) {
  log.info("[WS DOCKER ACTIONS] Start Kali Service");
  async.waterfall([
    (cb) => dockerTools.isKaliServiceInstalled(cb),
    (isImageInstalled, cb) => {
      if (isImageInstalled)
        cb(null, "");
      else
        dockerTools.installKaliService(cb, notifyCallback);
    }, (data, cb) => {
      dockerTools.runKaliService(cb);
    }], (err) => callback(err));
}
exports.browserRun  = function browserRun(body, callback, notifyCallback) {
  log.info("[WS DOCKER ACTIONS] Start Browser Service");
  async.waterfall([
    (cb) => dockerTools.isBrowserServiceInstalled(cb),
    (isImageInstalled, cb) => {
      if (isImageInstalled)
        cb(null, "");
      else  {
        log.info("Install Browser service");

        dockerTools.installBrowserService(cb, notifyCallback);
      }
    }, (data, cb) => {
      const hostPort = body.hostPort;
      dockerTools.runBrowserService(cb, hostPort);
    }], (err) => callback(err));
}


exports.wiresharkRun  = function wiresharkRun(body, callback, notifyCallback) {
  log.info("[WS DOCKER ACTIONS] Start Wireshark Service");
  async.waterfall([
    (cb) => Checker.checkParams(body, ['hostPort'], cb),
    (cb) => dockerTools.isWiresharkInstalled(cb),
    (isImageInstalled, cb) => {
      if (isImageInstalled)
        cb(null, "");
      else
        dockerTools.installWireshark(cb, notifyCallback);
    }, (data, cb) => {
      const hostPort = body.hostPort;
      dockerTools.runWireshark(cb, hostPort, notifyCallback, notifyCallback);
    }], (err) => callback(err));
}
exports.composeDown = function composeDown(params, body, callback, notifyCallback) {
  log.info('[COMPOSE DOWN]');
  let config;

  async.waterfall([
    (cb) => Checker.checkParams(params, ['namelab'], cb),
    (cb) => configData.getConfig(cb),
    (theConfig, cb) => {
      config = theConfig;
      if (!params.namerepo) {
        log.info('namerepo not defined, set default to user name');
        params.namerepo = config.name;
      }
      cb(null)
    },
    (cb) => {
      log.info("Remove containers from the network");
      log.info("Get lab networks");
      dockerTools.getNetworksLab(params.namelab, cb);
    },
    (networks, cb) => {
      // Detach all containers
      async.each(networks, (n, c) => {
        async.each(n.containers, (theContainer, cc) => {
          // Detach service containers
          if (dockerTools.isService(theContainer.Name)) {
            dockerTools.detachServiceToNetwork(theContainer.Name, n.name, cc);
          } else {
            cc(null);
          }
        }, (err) => c(err));
      }, (err) => cb(err));
    },
    // build path
    (cb) => {
      const mainDir = config.mainDir;
      const thePath = path.join(appUtils.getHome(), mainDir, params.namerepo, params.namelab);
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
