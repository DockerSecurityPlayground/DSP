const _ = require('underscore');
const dockerComposer = require('mydockerjs').dockerComposer;
const path = require('path');
const async = require('async');
const appUtils = require('../util/AppUtils');

const log = appUtils.getLogger();

function getFilesToCopy(pathMainDir, clistToDraw, afterAction) {
  const files = [];
  afterAction = afterAction || false;
  // Get the actions
  // For each container
  _.each(clistToDraw, (ele) => {
    const cname = ele.name;
    const cFiles = ele.filesToCopy;
    if (cFiles) {
      // For eachA file in files of container
      _.each(cFiles, (a) => {
        // add cname
        const aa = _.extend({}, a, { cname });
        // Add pathMainDir
        aa.filename = path.join(pathMainDir, aa.filename);
        // Add to all files
        files.push(aa);
      });
    }
  });
  return _.where(files, { afterAction });
}

function copyFiles(thePath, files, cb) {
  // For each action call docker-compose exec
  async.eachSeries(files, (f, callback) => {
    log.info(`copying il file ${f.filename}`);
    dockerComposer.cp(thePath, f.cname, f.filename, f.containerPath, (err) => {
      callback(err);
    });

// End loop , final function
  }, (err) => cb(err));
}

// Clean the path of the files to copy before the save in network.json
exports.cleanPath = function cleanPath(clist) {
  _.each(clist, (e) => {
    // Get files to copy
    const files = e.filesToCopy;
    // For each file
    _.each(files, (f) => {
      // Get parts of filename
     //  const partsOfFilename = f.filename.split(path.sep);
     //  // Get username in path ( = reponame )
     //  const i = _.indexOf(partsOfFilename, username);
     //  let newFilename = '';
     //  // Join filename starting  by repo user
     //  for (let index = i; index < partsOfFilename.length; index += 1) {
     //    newFilename = path.join(newFilename, partsOfFilename[index]);
     //  }
      // Change filename
      f.filename = path.basename(f.filename);
    });
  });
};

exports.getAllFiles = function getAllFiles(network) {
  const allContainers = network.clistToDraw.concat(network.clistNotToDraw);
  const allFiles = [];
  allContainers.forEach((item) => {
    const files = item.filesToCopy;
    files.forEach((file) => {
      allFiles.push(file.filename);
    });
  });
  return allFiles;
};

exports.copyBeforeActions = function copyBeforeActions(mainDir, repoName,
  thePath, clistToDraw, cb) {
  const pathMainDir = path.join(appUtils.getHome(), mainDir, repoName, '.data');
  const files = getFilesToCopy(pathMainDir, clistToDraw, false);
  copyFiles(thePath, files, cb);
};
exports.copyAfterActions = function copyAfterActions(mainDir, repoName, thePath, clistToDraw, cb) {
  const pathMainDir = path.join(appUtils.getHome(), mainDir, repoName, '.data');
  const files = getFilesToCopy(pathMainDir, clistToDraw, true);
  copyFiles(thePath, files, cb);
};
