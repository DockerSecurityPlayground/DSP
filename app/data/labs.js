const jsonfile = require('jsonfile');
const async = require('async');
const path = require('path');
const fs = require('fs');
const pathExists = require('path-exists');
const labelData = require('./labels.js');
const config = require('./config.js');
const rimraf = require('rimraf');
const _ = require('underscore');
const appUtils = require('../util/AppUtils');
const LabStates = require('../util/LabStates.js');
const c = require('../../config/local.config.json');

function renameLab(oldName, newName, cb) {
// banally return if equal
  if (oldName === newName) {
    cb(null);
  }
  else {
    config.getUserPath((err, up) => {
      const oldPath = path.join(up, oldName);
      const newPath = path.join(up, newName);
      if (err) cb(err);
      else if (!fs.existsSync(oldPath)) {
        cb(new Error(`${oldPath},' doesn't exists!'`));
      } else if (fs.existsSync(newPath)) {
        cb(new Error(`${newPath},' already exists!'`));
      } else {
        fs.rename(oldPath, newPath, (errRename) => {
          if (errRename) cb(errRename);
          else {
            LabStates.editState(path.basename(up), oldName, { labName: newName }, cb);
          }
        });
      }
    });
  }
}

function newLab(name, information, callback) {
  let up = '';
  let userName;
  async.waterfall([

   // Get config userpath
    (cb) => config.getUserPath(cb),

    // Check if a directory exists
    (userPath, cb) => {
      console.log("GEtUSER");
      console.log(userPath);
      up = userPath;
      userName = path.basename(userPath);
      pathExists(path.join(userPath, name))
          .then((exists) => {
            if (exists) cb(new Error('already exists'));
            else cb(null);
          });
    },
    // Create directory
    (cb) => {
      fs.mkdir(path.join(up, name), (err) => {
        if (err) cb(err);
        else cb(null);
      });
    },

    // Create identif ier of lab
    (cb) => {
      fs.open(path.join(up, name, '.dsp'), 'wx', (err, fd) => {
        if (err) cb(err);
        else {
          fs.close(fd, (closeErr) => cb(closeErr));
        }
      });
    },

    // Create description file
    (cb) => {
      let infos = {};
      const pathToWrite = path.join(up, name, 'information.json');
      infos.description = '';
      infos.goal = '';
      infos.solution = '';
      infos.author = userName;
      infos = _.extend(infos, information);

      jsonfile.writeFile(pathToWrite, infos, cb);
    },
    // Create initial state
    (cb) => {
      const repoName = path.basename(up);
      LabStates.newState(repoName, name, 'NO_NETWORK', cb);
    },
    // Create label file
    (cb) => {
      const nameLabel = path.join(up, name, c.config.name_labelfile);
      labelData.initLabels(nameLabel, cb);
    }],
  (err) => callback(err));
}


function deleteLab(name, callback) {
  let userPath;
  async.waterfall([
    (cb) => { config.getUserPath(cb); },
    (up, cb) => {
      userPath = up;
      const toDelete = path.join(userPath, name);
      console.log(toDelete);
      rimraf(toDelete, cb);
    },
    (cb) => {
      LabStates.exists(path.basename(userPath), name, cb);
    },
    // Remove from table of states only if exists
    (exists, cb) => {
      if (exists) {
        LabStates.removeState(path.basename(userPath), name, cb);
      } else {
        cb(new Error("Lab not exists in state"));
      }
    }
  ],
  (err) => {
    callback(err);
  });
}


function fillDirs(dirs, userPath, callback) {
  // log.info('calling fillDirs')
  const endDirs = [];

  async.each(dirs, (d, innerCallback) => {
    const dd = path.join(userPath, d);
    appUtils.isDSPDir(dd, (isDir) => {
      if (isDir) endDirs.push(d);
      // End callback of item
      innerCallback();
    });
  },
  (err) => {
    if (err) callback(err);
    else {
      callback(null, endDirs);
    }
  });
}

function getDirectories(srcpath) {
  return fs.readdirSync(srcpath)
    .filter(file => fs.statSync(path.join(srcpath, file)).isDirectory());
}

// Get user labs
function getLabs(thePath, callback) {
  const dirs = getDirectories(thePath);
  fillDirs(dirs, thePath, callback);
}


function saveLabels(labName, labels, callback) {
  let userPath = '';
  async.waterfall([
  // Get user path
    (cb) => {
      config.getUserPath((err, up) => {
        if (err) cb(err);
        else {
          userPath = up;
          cb(null);
        }
      });
    },
    (cb) => {
      if (!labels) cb(null);
      // Set the labels
      else {
      // ok create label
        const labelPath = path.join(userPath, labName, 'labels.json');
      // log.info('labels received:')
      // log.info(labels)
      // log.info(labelPath)
      // init label
        labelData.initLabels(labelPath);
      // Create labels
        labelData.createLabels(labelPath, labels.labels, (err) => {
          if (err) cb(err);
          else cb(null, labels);
        });
      }
    }],   // End labels update function
      // final function
  (err, results) => {
    if (err) callback(err);
    else callback(err, results);
  });
}

function saveInformation(name, information, callback) {
  let userPath;
  // log.info('in save information')
  async.waterfall([

    (cb) => config.getUserPath(cb),
    // Update informatino in labState
    (up, cb) => {
      userPath = up;
    //  const repoName = path.basename(userPath);
    //  LabStates.editState(repoName, name, { repoName, labName: name }, cb);
      cb(null);
    },
    // Now save here
    (cb) => {
      const informationFile = path.join(userPath, name, 'information.json');
      const author = path.basename(userPath);
      const toSave = information;
      toSave.author = author;
      jsonfile.writeFile(informationFile, toSave, (err) => {
        if (err) cb(err);
        else cb(null, information);
      });
    }],
  (err, results) => {
    if (err) callback(err);
    else callback(err, results);
  });
}


function getInformation(nameRepo, nameLab, callback) {
  async.waterfall([
    // Get config userpath
    (cb) => config.getConfig(cb),
    // Read json information file
    (cfile, cb) => {
      const informationFile = path.join(appUtils.getHome(), cfile.mainDir, nameRepo, nameLab, 'information.json');
      jsonfile.readFile(informationFile, cb);
    }],
    (err, jsonDescription) => {
      if (err) callback(err);
      else callback(null, jsonDescription);
    });
}
exports.newLab = newLab;
exports.deleteLab = deleteLab;
exports.saveLabels = saveLabels;
// json file information {description , goal, solution }
exports.renameLab = renameLab;
exports.saveInformation = saveInformation;
exports.getInformation = getInformation;
exports.getLabs = getLabs;
