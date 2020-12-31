const jsonfile = require('jsonfile');
const async = require('async');
const path = require('path');
const appUtil = require('../util/AppUtils');
const Checker = require('../util/AppChecker');

const AppConditions = Checker.AppConditions;

const c = require('../../config/local.config.json');
// It's used this method for different implementations after
const getConfig = function getConfig(callback) {
  jsonfile.readFile(appUtil.path_userconfig(), (err, obj) => {
    if (err) callback(err);
    else callback(null, obj);
  });
};

const getMainDir = function getMainDir(callback) {
  getConfig((err, obj) => {
    if (err) callback(err);
    else {
      const mainDir = path.join(appUtil.getHome(), obj.mainDir);
      callback(null, mainDir);
    }
  });
};


const getUserPath = function getUserPath(callback) {
  getConfig((err, obj) => {
    if (err) callback(err);
    else {
      const userPath = path.join(appUtil.getHome(), obj.mainDir, obj.name);
      callback(null, userPath);
    }
  });
};

// Get label filename
const getLabelFile = function getLabelFile(callback) {
  getUserPath((err, userName) => {
    if (err) callback(err);
    else {
      const labelPath = path.join(userName, c.config.name_labelfile);
      callback(null, labelPath);
    }
  });
};
const updateConfig = function updateConfig(data, callback) {
  async.waterfall([

    (cb) => AppConditions.check(data.mainDir, 'valid_path', cb),
    (cb) => AppConditions.check(data.name, 'filetype', cb),
    // Read config file
    (cb) => {
      const config = {
        name: data.name,
        mainDir: path.normalize(data.mainDir),
        dockerRepo: data.dockerRepo ? data.dockerRepo : "",
        githubURL: data.githubURL,
        sshKeyPath: data.sshKeyPath,
        username: data.username,
        email: data.email,
      };
      cb(null, config);
    },
    // Write new config data
    (config, cb) => {
      jsonfile.writeFile(appUtil.path_userconfig(), config, { spaces: 2 }, (err) => cb(err));
    }],
  // End array of waterfall functions
  (err) => callback(err));
};


exports.getUserPath = getUserPath;
exports.getMainDir = getMainDir;
exports.getLabelFile = getLabelFile;
exports.getConfig = getConfig;
exports.updateConfig = updateConfig;
exports.version = '0.1.0';
