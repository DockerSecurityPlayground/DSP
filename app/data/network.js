const jsonfile = require('jsonfile');
const configData = require('./config');
const path = require('path');
const async = require('async');
const pathExists = require('path-exists');
const dockerFiles = require('./docker_filesToCopy');
const Checker = require('../util/AppChecker');
const LabStates = require('../util/LabStates');
const fs = require('fs');
const appUtils = require('../util/AppUtils.js');
const { getNetwork } = require('mydockerjs/lib/docker');

function networkExists(namerepo, namelab, callback) {
  async.waterfall([
    (cb) => configData.getConfig(cb),
    (config, cb) => {
      const pathToSearch = path.join(appUtils.getHome(), config.mainDir, namerepo, namelab, 'network.json');
      pathExists(pathToSearch)
        .then((exists) => {
          cb(null, exists);
        },
          (error) => {
            cb(error);
          });
    },
  ],
    (err, exists) => {
      callback(err, exists);
    });
}

function filterNetwork(theNetwork) {
  retNetwork = theNetwork;
  if (retNetwork.clistToDraw) {
    cl = retNetwork.clistToDraw;
    cl.forEach((c) => {
      networks = c.networks;
      if (networks) {
        Object.keys(networks).forEach((key) => {
          n = networks[key];
          // If is not visibile set ip to false
          if (n.isVisible == false) {
            n.ip = ""
          }
        })
      }

    })
  }
  return retNetwork
}
function get(namerepo, namelab, callback) {
  let yamlFile;
  async.waterfall([

    (cb) => configData.getConfig(cb),
    // save
    (config, cb) => {
      const networkfile = path.join(appUtils.getHome(), config.mainDir, namerepo, namelab, 'network.json');
      yamlFile = path.join(appUtils.getHome(), config.mainDir, namerepo, namelab, 'docker-compose.yml');

      jsonfile.readFile(networkfile, cb);
    },
    (network, cb) => {
      // network = filterNetwork(network)
      // Read yaml file
      fs.readFile(yamlFile, 'utf-8', (err, data) => {
        if (err) { cb(err); } else {
          network.yamlfile = data;
          cb(null, network);
        }
      });
    },
  ],
    (err, results) => {
      if (err) { callback(err); } else callback(null, results);
    });
}

function isImported(namerepo, namelab, callback) {
  async.waterfall([
    (cb) => get(namerepo, namelab, cb),
    (networkInfo, cb) => {
      let isImported = true;
      // TBD: canvasJSON is a valid mxgraph structure
      if (networkInfo && networkInfo.canvasJSON && (typeof networkInfo.canvasJSON == "string") && networkInfo.canvasJSON !== "IMPORTED") {
        isImported = false;
      }
      cb(null, isImported);
    }
  ], (err, isImported) => {
    if (err && err.code == 'ENOENT') {
      isImported = true;
      err = null;
    }
    callback(err, isImported)
  });
}

function saveWithoutCompose(namelab, data, callback) {
  const log = appUtils.getLogger();
  async.waterfall([
    // Verify
    (cb) => Checker.checkParams(data, ['networkList', 'canvasJSON', 'clistToDraw', 'clistNotToDraw'], cb),
    // Get user path
    (cb) => {
      configData.getUserPath(cb);
    },
    // Save networks.json
    (userPath, cb) => {
      const networkfile = path.join(userPath, namelab, 'network.json');
      const userName = path.basename(userPath);

      dockerFiles.cleanPath(data.clistToDraw, userName);
      // Update stop state
      log.info(`Update stop state of ${userName}/${namelab}`);
      LabStates.setStopState(userName, namelab, (err) => {
        if (err) cb(err);
        else {
          jsonfile.writeFile(networkfile, data, cb);
        }
      });
    }
  ],
    // Returns yaml file
    (err) => {
      if (err) { callback(err); } else callback(null, null);
    });
}

function save(namelab, data, yamlfile, callback) {
  const log = appUtils.getLogger();
  async.waterfall([
    // Verify
    (cb) => Checker.checkParams(data, ['networkList', 'canvasJSON', 'clistToDraw', 'clistNotToDraw'], cb),
    // Get user path
    (cb) => {
      configData.getUserPath(cb);
    },
    // Save docker-compose.yml
    (userPath, cb) => {
      const networkfile = path.join(userPath, namelab, 'docker-compose.yml');
      fs.writeFile(networkfile, yamlfile, (err) => {
        if (err) cb(err);
        else cb(null, userPath);
      });
    },
    // Save networks.json
    (userPath, cb) => {
      const networkfile = path.join(userPath, namelab, 'network.json');
      const userName = path.basename(userPath);

      dockerFiles.cleanPath(data.clistToDraw, userName);
      // Update stop state
      log.info(`Update stop state of ${userName}/${namelab}`);
      LabStates.setStopState(userName, namelab, (err) => {
        if (err) cb(err);
        else {
          jsonfile.writeFile(networkfile, data, cb);
        }
      });
    }
  ],
    // Returns yaml file
    (err) => {
      if (err) { callback(err); } else callback(null, yamlfile);
    });
}

function canDeleteFile(filename, callback) {
  const fileToTest = path.basename(filename);
  // Get all repos
  const allUserLabs = appUtils.getUserDSPDirsSync();
  const userName = appUtils.getConfigSync().name;
  // For each element
  async.eachSeries(allUserLabs, (ul, c) => {
    async.waterfall([
      (cb) => networkExists(userName, ul, cb),
      (exists, cb) => {
        if (exists) get(userName, ul, cb);
        else cb(null, null);
      },
      (networkData, cb) => {
        let error = null;
        // Nothing to do if null
        if (!networkData) cb(null);
        else {
          const containersList = networkData.clistToDraw.concat(networkData.clistNotToDraw);
          containersList.forEach((container) => {
            const filesToCopy = container.filesToCopy;
            if (filesToCopy) {
              // If file has same name of file to delete then cannot delete
              filesToCopy.forEach((file) => {
                if (file.filename === fileToTest) {
                  error = Checker.errorCannotDelete(file.filename, ul);
                }
              });
            }
          });
          cb(error);
        }
        // End watefall
      }], (err) => {
        c(err);
      });
  },
    // End async series
    (err) => {
      callback(err);
    });
}


exports.save = save;
exports.saveWithoutCompose = saveWithoutCompose;
exports.get = get;
exports.isImported = isImported;
exports.networkExists = networkExists;
exports.canDeleteFile = canDeleteFile;
