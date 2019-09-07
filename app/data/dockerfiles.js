const path = require('path');
const appUtil = require('../util/AppUtils');
const pathConverter = require('../util/pathConverter.js');
const configData = require('./config.js');
const async = require('async');
const fs = require('fs');
const executable = require('executable');
const simpleGit = require('simple-git');
const fsExtra= require('fs-extra');
const checker = require('../util/AppChecker.js');
const JoiConditions = checker.JoiAppConditions
const rimraf = require('rimraf');
const recursive  = require('recursive-readdir');



const dockerfileBaseContent = "FROM alpine:latest";

function _readFile(f, arrayRet, callback) {
  async.waterfall([
    (cb) => fs.readFile(f, cb),
    (data, cb) => {
      // Append to ret structure
      executable(f)
      .then(exec => {
        arrayRet.push({file: f, content: data.toString(), isExecutable: exec});
        cb(null);
      })
    }], (err) => callback(err));
}

function setPermissions(dfPath, content, cb) {
  async.eachSeries(content, (f,c) => {
    filePath = path.join(path.join(dfPath, f.id));
      if(f.isExecutable == true)
      {
        fs.chmod(filePath, 0o755, (err) => {
          c(err);
        })
      }
      else{
        c(null);
      }
      //fsExtra.outputFile(filePath, f.content, c);
  }, (err) => cb(err));
}
function createFiles(dfPath, content, cb) {
  async.eachSeries(content, (f, c) => {
    filePath = path.join(path.join(dfPath, f.id));
    if(f.type == 'dir') {
      c(null);
    } else {
      fsExtra.outputFile(filePath, f.content, c);
    }
  }, (err) => cb(err));
}

function getDockerfileBasePath(callback) {
  async.waterfall([
    (cb) => configData.getUserPath(cb),
    (up, cb) => cb(null, path.join(up, '.dockerfiles'))
  ], (err, dockerPath) => callback(null, dockerPath));
}

function isDockerfileDir(f, cb) {
  cb(null, true);
}

function _createFromDockerfile(name, options, callback) {
  async.waterfall([
    (cb) => checker.checkAlphabetic(options.name, cb),
    (cb) => getDockerfileBasePath(cb),
    // Create file
    (dp, cb) =>  {
      dataPath = dp;
      appUtil.copy(path.join(dataPath, options.name), path.join(dataPath, name), cb);
    }], (err, results) => callback(err, results));
}

function _createFromGit(name, options, callback) {
  let errGit = null;
  async.waterfall([
    (cb) => checker.checkAlphabetic(options.name, cb),
    (cb) => JoiConditions.check(options.gitUrl, 'url', cb),
    (resp, cb) => getDockerfileBasePath(cb),
    // Create file
    (dp, cb) =>  {
      dataPath = dp;
      simpleGit(dataPath).silent(false).clone(options.gitUrl, name, ['-q'], cb);
    },
    (d, cb) => fs.exists(path.join(dataPath, name, 'Dockerfile'), (exists, err) => {
      if (err) {
        cb(err);
      } else if (exists) {
        cb(null);
        // Should clean from the repository
      } else {
        errGit = new Error("Git repository does not contain Dockerfile");
        rimraf(path.join(dataPath, name), cb);
      }
    }),
    (cb) => {
      cb(errGit)
    }, (cb) => rimraf(path.join(dataPath, name, ".git"), cb)
  ], (err, results) => callback(err, results));
}

function _createNew(name, callback) {
  async.waterfall([
    (cb) => getDockerfileBasePath(cb),
    // Create file
    (dp, cb) =>  {
      dataPath = dp;
      fs.mkdir(path.join(dataPath, name), cb);
    },
    (cb) => fs.writeFile(path.join(dataPath, name, 'Dockerfile'), dockerfileBaseContent, cb)
  ], (err, results) => callback(err, results));
}

function createDockerfile (name, options, callback) {
  let dataPath = "";
  async.waterfall([
    (cb) => checker.checkAlphabetic(name, cb),
    (cb) => {
      if (options && options.typeImport && options.typeImport === "Dockerfile" && options.name) {
        _createFromDockerfile(name, options, cb)
      } else if (options && options.typeImport && options.typeImport === "Git" && options.gitUrl) {
        _createFromGit(name, options, cb);
      } else {
        _createNew(name, cb)
      }
    }
  ], (err, results) => callback(err, results));
}

function getDockerfiles (callback) {
  let dataPath;
  async.waterfall([
    (cb) => getDockerfileBasePath(cb),
    (dp, cb) => {
      dataPath = dp;
      fs.readdir(dp, cb);
      // Get only dirs containing a Dockerfile
    }, (dockerfiles, cb) => {
      let res = [];
      async.eachSeries(dockerfiles, (f, c) => {
        fs.exists(path.join(dataPath, f, 'Dockerfile'), (exists, err) => {
          if (err) {
            c(err);
          } else {
            if (exists) {
              res.push(f);
            }
            c(null);
          }
        })}, (err2) => cb(err2, res))
    }
  ], (err, results) => callback(err, results));
}

function editDockerfile(name, content, callback) {
  let dockerfilesPath;
  let dfPath;
  let tempPath;
  async.waterfall([
    (cb) => configData.getUserPath(cb),
    // Init variables
    (up, cb) =>  {
      dockerfilesPath= path.join(up, '.dockerfiles');
      dfPath = path.join(dockerfilesPath, name);
      tempPath = path.join(dockerfilesPath, '.tmpdir');
      cb(null)
    },
    // Copy temp
    (cb) => appUtil.renameDir(dfPath, tempPath, cb),
    // Create empty dir
    (cb) => fs.mkdir(dfPath, cb),
    (cb) => createFiles(dfPath, content, cb),
    //set execute permissions
    (cb) => setPermissions(dfPath, content, cb),
    // Delete temp path
    (cb) => rimraf(tempPath, cb)
    // const mm = jsonConverter(
  ], (err) => {
    if (err) {
      appUtil.renameDir(tempPath, dfPath, (e) => {
        callback(err);
      });
    } else {
      callback(null);
    }
  })
}

function removeDockerfile(name, callback) {
  async.waterfall([
    (cb) => checker.checkAlphabetic(name, cb),
    (cb) => configData.getUserPath(cb),
    (up, cb) => {
      const toDelete = path.join(up, '.dockerfiles', name);
      rimraf(toDelete, cb)
    }
  ], (err) => callback(err));
}

function getDockerfile(name, callback) {
  let dockerfilesPath = "";
  async.waterfall([
    (cb) => checker.checkAlphabetic(name, cb),
    (cb) => configData.getUserPath(cb),
    (up, cb) => {
      dockerfilesPath = path.join(up, '.dockerfiles', name);
      recursive(dockerfilesPath, cb)
    },
    (allFiles, cb) => {
      let arrayRet = [];
      // Read files and generate structure
      async.eachSeries(allFiles, (f, c) => _readFile(f, arrayRet, c)
        , (err) => cb(err, arrayRet))
    },
    (structure, cb) => {
      const treeModel = pathConverter.getTree(structure, dockerfilesPath);
      cb(null, treeModel);
    }], (err, data) => callback(err, data))
}

function getImageNames(callback) {
  async.waterfall([
    (cb) => getDockerfiles(cb),
    (dockerfiles, cb) => {
      let imagesToBuild = dockerfiles.map((d) => d + ":latest");
      cb(null, imagesToBuild);
    }], (err, imagesToBuild) => callback(err, imagesToBuild));
}

exports.createDockerfile = createDockerfile;
exports.getDockerfiles = getDockerfiles;
exports.getImageNames = getImageNames;
exports.editDockerfile = editDockerfile
exports.removeDockerfile = removeDockerfile
exports.getDockerfile = getDockerfile
