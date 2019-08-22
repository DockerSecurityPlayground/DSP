const appRoot = require('app-root-path');
const path = require('path');
const jsonfile = require('jsonfile');
const pathExists = require('path-exists');
const Walker = require('walker');
const logger = require('bunyan-request-logger');
const homedir = require('homedir');
const errors = require('errors');
const fs = require('fs');
const httpHelper = require('help-nodejs').httpHelper;
const cpFile = require('cp-file');
const ncp = require('ncp').ncp;
const localConfig = require('../../config/local.config.json').config;

function copyFile(source, target, cb) {
  cpFile(source, target)
    .then(() => {
      cb(null);
    },
    (err) => {
      cb(err);
    });
}

function getDirs(srcpath) {
  return fs.readdirSync(srcpath)
    .filter((file) => {
      const isDir = fs.statSync(path.join(srcpath, file)).isDirectory();
      const isDSP = fs.existsSync(path.join(srcpath, file, '.dsp'));
      return isDir && isDSP;
    });
}
function copyDir(source, target, cb) {
  ncp(source, target, cb);
}

// const getLocalConfigSync = function getLocalConfigSync() {
//  return jsonfile.readFileSync(path.join(appRoot.path, 'config', 'local.config.json'));
// };
const c = require('../../config/local.config.json');

function pathUserConfig() {
    return `${appRoot.path}/config/config_user.json`;
}
function getRealLogger() {
    const logPath = path.join(appRoot.path, 'logs', 'dsp.log');
    return logger({
      name: 'DockerSecurityPlayground',
      streams: [
        {
          level: 'info',
          stream: process.stdout
        },
        {
          level: 'info',
          type: 'rotating-file',
          period: '1h',
          count: 1,
          path: logPath
        },
        {
          level: 'debug',
          type: 'rotating-file',
          period: '1h',
          count: 1,
          path: logPath
        },
        {
          level: 'error',
          stream: process.stderr
        },
        {
          level: 'error',
          type: 'rotating-file',
          period: '1h',
          count: 1,
          path: logPath
        },
        {
          level: 'warn',
          path: logPath
        },
        {
          level: 'warn',
          type: 'rotating-file',
          period: '1h',
          count: 1,
          path: logPath
        }]
    });
}
function getNoLogger() {
    return logger({
      name: 'DockerSecurityPlayground',
      streams: [
        {
          level: 'info',
          stream: process.stdout
        },
        {
          level: 'error',
          stream: process.stderr
        },
        {
          level: 'warn',
          stream: process.stdout
        }]
    });
}
// exports.getLocalConfigSync = getLocalConfigSync;
module.exports = {
  getLocalConfig(cb) {
    jsonfile.readFile(path.join(appRoot.path, 'config', 'local.config.json'), cb);
  },

  renameDir(oldPath, newPath, callback) {
    if (oldPath !== newPath) {
      // Check existence
      pathExists(newPath)
        .then(exists => {
          if (exists) {
            callback(new errors.errorDirAlreadyExists());
          } else {
            fs.rename(oldPath, newPath, (err) => callback(err));
          } });
    } else callback(null);
  },
  copy(srcPath, dstPath, cb) {
    fs.stat(srcPath, (err, stats) => {
      if (err) cb(err);
      else if (stats.isDirectory()) copyDir(srcPath, dstPath, cb);
      else if (stats.isFile()) {
        copyFile(srcPath, dstPath, cb);
      }
      else cb(new Error('Unknown file type'));
    });
  },
  path_userconfig: pathUserConfig,
  getConfigSync() {
  return jsonfile.readFileSync(this.path_userconfig());
  },

  getLogger() {
    if (localConfig.enableLogin)
      return getRealLogger();
    else return getNoLogger();
  },
  // It works only for labs (repoName is a repository )
  getDSPDirs: function getDSPDirs(repoName, callback) {
    const srcpath = path.join(this.getHome(), this.getConfigSync().mainDir, repoName);
    const dirs = [];
    let error;
    Walker(srcpath)
      .on('dir', (dir) => {
        //  Explore labs
        this.isDSPDir(dir, (isDSP) => {
          if (isDSP && path.basename(dir) !== repoName) {
            const name = path.basename(dir);
            dirs.push(name);
          }
        });
      })
      .on('error', (er, entry) => {
        error = new Error(`Error ${er} on ${entry}`);
      })
      .on('end', () => {
        if (error) callback(error);
        else callback(null, dirs);
      });
  },

  // Return the labs of all
  getAllDSPDirsSync: function getAllDSPDirsSync() {
    const rootDir = path.join(this.getHome(), this.getConfigSync().mainDir);
    const repos = getDirs(rootDir);
    const returnRepos = [];
    repos.forEach((r) => {
      const labs = this.getDSPDirsSync(r);
      labs.forEach((l) => {
        returnRepos.push({
          labName: l,
          repoName: r,
          thePath: path.join(rootDir, r, l)
        });
      });
    });
    return returnRepos;
  },
  getUserDSPDirsSync: function getUserDSPDirsSync() {
    const conf = this.getConfigSync();
    return getDirs(path.join(this.getHome(), conf.mainDir, conf.name));
  },
  getDSPDirsSync: function getDSPDirsSync(repoName) {
    const srcpath = path.join(this.getHome(), this.getConfigSync().mainDir, repoName);
    return getDirs(srcpath);
  },
  response: function response(nameService, res, err, respo) {
    const log = this.getLogger();
    log.info(`Response of [${nameService}]`);
    if (err) {
      log.error(`Error server: ${err.message}`);
    }
    else if (respo) {
      // log.info(`Success, server response: ${JSON.stringify(respo)}`);
    } else log.info('Success');
     httpHelper.response(res, err, respo);
  },
  // Returns true if is a lab
  isDSPDir(dir, callback) {
    const filename = path.join(dir, '.dsp');
    pathExists(filename).then((exists) => {
      callback(exists);
    });
  },
  //Returns home of the user
  getHome() {
    return homedir();
  }
};

