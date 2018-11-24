const async = require('async');
const appUtils = require('../util/AppUtils.js');
const path = require('path');
const pathExists = require('path-exists');
const fs = require('fs');
const rimraf = require('rimraf');
const configData = require('./config.js');
const Walker = require('walker');
const _ = require('underscore');

function _createVolumeDirs(up, nameLab, volumes, callback) {
  const log = appUtils.getLogger();
  async.eachSeries(volumes, (v, c) => {
    const userLab = path.join(up, nameLab);
    const volumeToCreate = path.join(userLab, v.host);
    pathExists(volumeToCreate)
    .then((exists) => {
      if (exists) {
        log.info(`${volumeToCreate} already exists`);
        c(null);
      }
      else {
        log.info(`creating ${volumeToCreate}`);
        fs.mkdir(volumeToCreate, c);
      }
    });
  }, (errAsync) => callback(errAsync));
}

function _getVolumes(clist) {
  let volumes = [];
  clist.forEach((e) => {
    volumes = volumes.concat(e.volumes);
  });
  return volumes;
}


module.exports = {
//  getVolumes(clistToDraw, clistNotToDraw) {
//    let volumes = [];
//    volumes = volumes.concat(_getVolumes(clistToDraw));
//    volumes = volumes.concat(_getVolumes(clistNotToDraw));
//    return volumes;
//  },
  destroyOldVolumes(nameLab, clistToDraw, clistNotToDraw, callback) {
    let volumes = _getVolumes(clistToDraw);
    volumes = volumes.concat(_getVolumes(clistNotToDraw));
    const log = appUtils.getLogger();
    const hostVolumes = [];
    const volumesToDestroy = [];
    // Get all host volume names
    volumes.forEach((v) => {
      hostVolumes.push(v.host);
    });
    configData.getUserPath((err, up) => {
      if (err) callback(err);
      else {
        const labDir = path.join(up, nameLab);
        Walker(labDir)
          // Only one subdirectory
          .filterDir((dir) => {
            const baseDir = labDir;
            const re = new RegExp(`${baseDir}/?([^/]+/?){0,1}$`);
            return re.test(dir);
          })
          .on('dir', (dir) => {
            // log.info(hostVolumes);
            if (dir !== labDir && !_.contains(hostVolumes, path.join('/', path.basename(dir)))) {
              // log.warn(`${dir} no more used, destroy it`);
              // volumesToDestroy.push(dir);
            }
          })
        .on('end', (walkerErr) => {
          _.each(volumesToDestroy, (d) => {
            if (fs.existsSync(d)) {
              rimraf.sync(d);
            }
          });
          // rimraf.sync(dir);
          callback(walkerErr);
        });
      }
    });
  },
  createVolumeDirs(nameLab, clistToDraw, callback) {
    const volumes = _getVolumes(clistToDraw);
    configData.getUserPath((err, up) => {
      if (err) callback(err);
      else _createVolumeDirs(up, nameLab, volumes, callback);
    });
  }
};
