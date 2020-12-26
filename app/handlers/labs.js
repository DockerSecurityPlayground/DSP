const labsData = require('../data/labs.js');
const labelsData = require('../data/labels.js');
const configData = require('../data/config.js');
const networkData = require('../data/network.js');
const walker = require('../data/labs_walker');
const async = require('async');
const fs = require('fs');
const httpHelper = require('help-nodejs').httpHelper;
const path = require('path');
const jsonfile = require('jsonfile');
const Checker = require('../util/AppChecker');
const ncp = require('ncp').ncp;
const dockerFiles = require('../data/docker_filesToCopy.js');
const pathExists = require('path-exists');
const appUtils = require('../util/AppUtils.js');
const multipart = require('connect-multiparty');
const LabStates = require('../util/LabStates.js');
const util = require('util');
// const BusBoy = require('busboy');



const _ = require('underscore');

const log = appUtils.getLogger();
const AppConditions = Checker.AppConditions;
const c = require('../../config/local.config.json');


function checkParams(params, body, callback) {
  async.waterfall([
    // Check values and save informations
    (cb) => Checker.checkParams(params, ['labname'], cb),
    (cb) => AppConditions.check(params.labname, 'labname', cb),
    (cb) => {
      if (body.informations.descriptions) {
        Checker.checkString(body.informations.description, cb);
      } else cb(null);
    },
    (cb) => {
      if (body.informations.goal) {
        Checker.checkString(body.informations.goal, cb);
      } else cb(null);
    },
    (cb) => {
      if (body.informations.solution) {
        Checker.checkString(body.informations.solution, cb);
      } else cb(null);
    },
  ], (err) => callback(err));
}

// User walker to explore all project
function getAll(req, res) {
  log.info('[GET ALL]');
  configData.getConfig((err, conf) => {
    if (err) httpHelper.response(res, err);
    else {
      const w = walker.create();
      w.walk(conf.mainDir);
      w.onEnded(() => {
        httpHelper.response(res, null, w.object);
      });
    }
  });
}
function getLabs(req, res) {
  async.waterfall([
    // Check if repo dir parameter exists
    (cb) => AppConditions.check(req, 'getLabsCheck', cb),
    (cb) => configData.getConfig(cb),
    // get labels
    (config, cb) => {
      // label file path
      const mainDir = config.mainDir;
      const repoPath = path.join(appUtils.getHome(), mainDir, req.params.repo);
      labsData.getLabs(repoPath, cb);
    },
  ],
    // Returns { labs: [] }
    (err, results) => {
      httpHelper.response(res, err, { labs: results });
    });
}
function deleteLab(req, res) {
  log.info('[DELETE LAB]');
  async.waterfall([
    // Check if repo dir parameter exists
    (cb) => Checker.checkParams(req.params, ['labname'], cb),
    (cb) => configData.getConfig(cb),
    (theConfig, cb) => {
      LabStates.getState(c.name, req.params.labname, cb);
    },
    (state, cb) => {
      log.info(`Lab to delete: ${req.params.labname}`);
      log.info('Check state of lab ');
      if (state === 'RUNNING') cb(new Error('Lab is running pls stop first!'));
      else cb(null);
    },
    // Remove lab
    (cb) => {
      log.info('Delete');
      labsData.deleteLab(req.params.labname, cb);
    },
  ],
    // Returns { labels: [] }
    (err) => appUtils.response('DELETE LAB', res, err));
}


function getInformation(req, res) {
  log.info('[IN GET INFORMATION]');
  async.waterfall([
    (cb) => Checker.checkParams(req.params, ['labname', 'repo'], cb),
    (cb) => labsData.getInformation(req.params.repo, req.params.labname, cb),
  ],
    (err, results) => appUtils.response('GET INFORMATION', res, err, results));// End waterfall
}

function getLabUserInformation(req, res) {
  log.info('[IN GET LAB USER INFORMATION]');
  async.waterfall([
    (cb) => Checker.checkParams(req.params, ['labname'], cb),
    (cb) => labsData.getLabUserInformation(req.params.labname, cb)
  ], (err, results) => appUtils.response('GET LAB USER INFORMATION', res, err, results));
}


function wantToRename(req) {
  return (req.body.name && req.body.name !== req.params.labname);
}
//    // get user path
//    (cb) => configData.getUserPath(cb),
//    (up, cb) => {
//      cb(null);
//    },
function saveInformation(req, res) {
  log.info('[IN SAVE INFORMATION]');
  let newName;
  let oldName;
  let infos;
  async.waterfall([
    // Check values and save informations
    (cb) => checkParams(req.params, req.body, cb),
    (cb) => Checker.checkParams(req.body, ['name'], cb),
    (cb) => AppConditions.check(req.body.name, 'labname', cb),
    // Lab state check if rename
    (cb) => {
      if (wantToRename(req)) {
        const configuration = appUtils.getConfigSync();
        const labState = LabStates.getStateSync(configuration.name, req.params.labname);
        if (labState === 'RUNNING') {
          cb(new Error('Cannot edit the name of a running lab!'));
        }
        else cb(null);
      }
      else cb(null);
    },
    (cb) => {
      infos = req.body.informations;
      const i = {
        description: infos.description || '',
        goal: infos.goal || '',
        solution: infos.solution || '',
        readme: infos.readme
      };
      // log.info('Info received:');
      // log.info(JSON.stringify(i));
      labsData.saveInformation(req.params.labname, i, cb);
    },
    // Rename?
    (is, cb) => {
      newName = req.body.name;
      infos = is;
      oldName = req.params.labname;
      if (wantToRename(req)) {
        newName = req.body.name;
        labsData.renameLab(oldName, newName, cb);
      } else {
        newName = req.params.labname;
        cb(null);
      }
    },
    // Labels
    (cb) => {
      const saveLab = { labels: req.body.labels };
      labsData.saveLabels(newName, saveLab, (err, labels) => {
        if (err) cb(err);
        else {
          // log.info("labels received:"+labels)
          cb(null, { labels: labels.labels, informations: infos, name: newName });
        }
      });
    },
  ], (err, response) => {
    // log.info(err);
    appUtils.response('SAVE INFORMATIONS', res, err, response);
  });
}

function newLab(req, res) {
  log.info('[NEW LAB]');
  async.waterfall([
    // Check if repo dir parameter exists
    (cb) => checkParams(req.params, req.body, cb),
    (cb) => {
      // Get informations
      const infos = req.body.informations;
      const i = {
        description: infos.description || '',
        goal: infos.goal || '',
        solution: infos.solution || ''
      };
      labsData.newLab(req.params.labname, i, cb);
    },
    (cb) => configData.getUserPath(cb),
    // init file for labels data  and save labels
    (userPath, cb) => {
      const labelname = path.join(userPath, req.params.labname, c.config.name_labelfile);
      const labels = req.body.labels;
      labelsData.initLabels(labelname);
      labelsData.createLabels(labelname, labels, cb);
    },
  ],
    // Returns { labels: [] }
    (err) => {
      // log.info("lab saved");
      // log.info(err);
      appUtils.response('NEW LAB', res, err);
    });
}

function copyLab(req, res) {
  let i = 1;
  let newLabName;
  log.info('[ COPY LAB ]');
  async.waterfall([
    (cb) => Checker.checkParams(req.params, ['labname'], cb),
    (cb) => configData.getUserPath(cb),
    (up, cb) => {
      const labToCopy = path.join(up, req.params.labname);
      newLabName = path.join(up, `${req.params.labname}_1`);
      try {
        while (fs.existsSync(newLabName)) {
          i += 1;
          newLabName = path.join(up, `${req.params.labname}_${i}`);
        }
        log.info(`Copy in ${newLabName}`);
        // Copy lab
        appUtils.copy(labToCopy, newLabName);
        // Create new state in tableState
        log.info('Update table state');
        LabStates.newStateSync(path.basename(up), path.basename(newLabName), 'STOPPED');
        cb(null);
      }
      catch (e) {
        cb(e);
      }
    }
  ],
    (err) => appUtils.response('COPY LAB', res, err, path.basename(newLabName)));
}

function importLab(req, res) {
  log.info('[ IMPORT LAB ]');
  let destPath;
  let srcPath;
  let labelsOfImportedLab;
  let labelsUser;
  let userPath;
  let networkInfo;
  const labelsToInsert = [];
  let configJSON;
  async.waterfall([
    // Check params
    (cb) => Checker.checkParams(req.body, ['labName', 'repoName'], cb),
    (cb) => {
      configData.getConfig(cb);
    },
    // Verify if already exists
    (config, cb) => {
      log.info(' Parameters ok , check if already exists');
      configJSON = config;
      destPath = path.join(appUtils.getHome(), config.mainDir, config.name, req.body.labName);
      srcPath = path.join(appUtils.getHome(), config.mainDir, req.body.repoName, req.body.labName);
      userPath = path.join(appUtils.getHome(), configJSON.mainDir, configJSON.name);
      pathExists(destPath)
        .then(exists => {
          cb(null, exists)
        }
        );
    },
    (exists, cb) => {
      // Error if already exists
      if (exists) cb(new Error('Lab already exists'));
      //CHECK STATE
      // else cb(null)
      else cb(null)
    },
    // Get networkData informations
    (cb) => networkData.get(req.body.repoName, req.body.labName, cb),
    (ni, cb) => {
      networkInfo = ni;
      cb(null)
    },
    // Check if all files can be saved
    (cb) => {
      const allFiles = dockerFiles.getAllFiles(networkInfo);
      log.info(`Check files to copy: ${allFiles}`);
      async.eachSeries(allFiles, (f, cin) => {
        const src = path.join(appUtils.getHome(), configJSON.mainDir, req.body.repoName, '.data', f);
        const dst = path.join(appUtils.getHome(), configJSON.mainDir, configJSON.name, '.data', f);
        pathExists(dst)
          .then(exists => {
            if (exists) {
              cin(new Error(`File ${f} already exists`));
            }
            else {
              cin(null)
            }
          });
      }, (err) => cb(err));
    },
    (cb) => {
      LabStates.getState(req.body.repoName, req.body.labName, cb);
    },
    // Verify if is NO_NETWORK State (shouldn't be )
    (state, cb) => {
      log.info(`Lab has state ${state}`);
      if (state === 'NO_NETWORK') cb(new Error('No network available! Contact the developer'));
      // Copy recursive of directory
      else ncp(srcPath, destPath, cb);
    },
    // Copy all files inside the repo of user
    (cb) => {
      const allFiles = dockerFiles.getAllFiles(networkInfo);
      log.info(`Files to copy: ${allFiles}`);
      async.eachSeries(allFiles, (f, cin) => {
        const src = path.join(appUtils.getHome(), configJSON.mainDir, req.body.repoName, '.data', f);
        const dst = path.join(appUtils.getHome(), configJSON.mainDir, configJSON.name, '.data', f);
        pathExists(dst)
          .then(exists => {
            if (exists) {
              cin(new Error('File already exists'));
            }
            else {
              log.info(`Copy ${f} `);
              appUtils.copy(src, dst, cin);
            }
          });
      }, (err) => cb(err));
    },
    // get all labels of lab to import
    (cb) => {
      jsonfile.readFile(path.join(srcPath, 'labels.json'), cb);
    },
    (jsonData, cb) => {
      labelsOfImportedLab = jsonData.labels;
      // Userpath labels
      jsonfile.readFile(path.join(userPath, 'labels.json'), cb);
    },
    (jsonRet, cb) => {
      labelsUser = jsonRet.labels;
      _.each(labelsOfImportedLab, (oneLabel) => {
        const userLabel = _.findWhere(labelsUser, { name: oneLabel.name });
        // If doesn't exists
        if (!userLabel) {
          // Add label in list to create
          labelsToInsert.push(oneLabel);
        }
      });
      cb(null);
    },
    (cb) => {
      log.info(`Labels to add: ${JSON.stringify(labelsToInsert)}`);
      labelsData.createLabels(path.join(userPath, 'labels.json'), labelsToInsert, cb);
    },
    // Add a new state for the lab of local repo
    (cb) => {
      LabStates.newState(configJSON.name, req.body.labName, 'STOPPED', cb);
    }
  ], (err) => {
    appUtils.response('IMPORT LAB', res, err);
  });
}

// Upload a new docker-compose repository containing a new project
function uploadCompose(req, res) {
  let e = null;
  async.waterfall([
    // Check params
    (cb) => {
      Checker.checkParams(req.params, ['labname'], cb);
    }, (cb) => {
      log.info("[UPLOAD COMPOSE")
      // const busboy = new BusBoy({headers: req.headers});
      req.busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
        try {
          // const stream = fs.createReadStream(file)
          labsData.newLabFromCompose(req.params.labname, file, true, (err) => {
            e = err;
          });
        } catch (err2) {
          cb(err2);
        }
      });
      req.busboy.on('finish', function () {
        cb(e)
      });
      req.pipe(req.busboy);
    }
  ], (err) => appUtils.response('[UPLOAD COMPOSE]', res, err));
}



exports.uploadCompose = uploadCompose;
exports.deleteLab = deleteLab;
exports.getAll = getAll;
exports.getLabs = getLabs;
exports.getInformation = getInformation;
exports.getLabUserInformation = getLabUserInformation;
exports.saveInformation = saveInformation;
exports.newLab = newLab;
exports.copyLab = copyLab;
exports.importLab = importLab;
exports.version = '0.1.0';
