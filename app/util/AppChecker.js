const Errors = require('errors');
const Checker = require('help-nodejs').checker.Checker();
const JoiChecker = require('help-nodejs').checker.JoiChecker();
const appUtils = require('./AppUtils.js');
const Joi = require('joi');
const du = require('mydockerjs').dockerUtils;
const jsonfile = require('jsonfile');
const path = require('path');
const fs = require('fs');
const isValidPath = require('is-valid-path');
const commandExistsSync = require('command-exists').sync;
const async = require('async');
const configData = require('../data/config.js');
const c = require('../../config/local.config.json').config;
const repos = c.repos
const repoData = require('../data/repos.js');
const log = appUtils.getLogger();

const _ = require('underscore');
let initialized = false;

function _checkRepos(cb) {
    // Official repositories
    repoData.exists((err, exists) => {
        if (err) {
            cb(err);
        } else {
            if (!exists) {
                log.warn('repos.json does not exists, create it');
                repoData.create(repos, cb);
            } else {
                log.info("repos.json exists");
          }
        }
    });
}


function checkDSPRequires(callback) {
  const log = appUtils.getLogger();
  log.info('Checking docker, docker-compose and git installed, and docker is running ... ');
  async.waterfall([
  // Check if docker and docker-compose are installed
    (cb) => {
      // log.info('Checking if docker is installed');
      if (!du.isDockerCliInstalledSync()) {
        cb(new Error('Pls install docker'));
      } else {
        // log.info('OK docker is installed');
        cb(null);
      }
    },

    (cb) => { if (!du.isDockerComposeInstalledSync()) {
      cb(new Error('Pls install docker-compose'));
    } else cb(null);
    },
   // // Check if docker is running
   // (cb) => {
   //  // log.info('Checking if docker is running');
   //   du.isDockerEngineRunning((err, isRunning) => {
   //     if (err) {
   //       cb(err);
   //     } else if (!isRunning) {
   //       cb(new Error('Docker is not running'));
   //     } else {
   //       // log.info('OK docker is running');
   //       cb(null);
   //     }
   //   });
   // },
    (cb) => {
      if (!commandExistsSync('git')) {
        cb(new Error('Pls install git'));
      } else {
        // log.info('OK git client is installed');
        cb(null);
      }
    }], (err) => {
    callback(err);
  });
}

// Initialize Errors
function initErrors() {
  const userErrors = [
    {
      name: 'NoValidFilename',
      defaultMessage: 'No valid filename',
      code: 1000,
    },
    {
      name: 'GetLabsErr',
      defaultMessage: 'No repo defined',
      code: 1001,
    },
    {
      name: 'noCorrectParams',
      defaultMessage: 'No correct params',
      code: 999,
    },
    {
      name: 'stringErr',
      defaultMessage: 'No string received',
      code: 1002,
    },
    {
      name: 'NoURL',
      defaultMessage: 'No valid URL',
      code: 1003,
    },
    {
      name: 'NoValidPath',
      defaultMessage: 'No valid path',
      code: 1004,
    },
    {
      name: 'LabRepoNoStopped',
      defaultMessage: 'Lab of repo are not stopped',
      code: 1005,
    },
    {
      name: 'errorDirAlreadyExists',
      defaultMessage: '',
      code: 1006,
    },
    {
      name: 'errorCannotDelete',
      defaultMessage: 'Cannot delete',
      code: 1007,
    },
    {
      name: 'alphabetic',
      defaultMessage: 'Only alphabetic name allowed',
      code: 1008,
    },
    {
      name: 'invalidHttpAuth',
      defaultMessage: 'Expected Username and Token',
      code: 1009,
    },
    {
      name: 'invalidSshAuth',
      defaultMessage: 'Expected SSH key path',
      code: 1010,
    },
    {
      name: 'invalidGitUrl',
      defaultMessage: 'Invalid Git Url',
      code: 1010,
    },
    {
      name: 'invalidEmail',
      defaultMessage: 'Invalid Email Address',
      code: 1011,
    },
  ];


  userErrors.forEach((err) => Errors.create(err));
}

function initConditions() {
  const NoValidFilenameErr = new Errors.find('NoValidFilename');
  const GetLabsErr = new Errors.find('GetLabsErr');
  const NoValidPath = new Errors.find('NoValidPath');
  const NoURL = new Errors.find('NoURL');
  if (!initialized) {
      Checker.load('labname', (fn) => {
        const re = /[^. a-zA-Z0-9_-]/;
        return typeof fn === 'string' && fn.length > 0 && !(fn.match(re)) &&
        !(fn.trim().length === 0);
      },
      new NoValidFilenameErr());


      Checker.load('filetype', (fn) => {
        const re = /[^.a-zA-Z0-9_-]/;
        return typeof fn === 'string' && fn.length > 0 && !(fn.match(re)) &&
        !(fn.trim().length === 0);
      },
      new NoValidFilenameErr());

      Checker.load('valid_path', (thePath) => isValidPath(thePath),
      new NoValidPath());


      JoiChecker.load('url', Joi.string().uri(
        {
          scheme: [
            'git',
            'https',
            'http',
            /git\+https?/,
          ],
        }), new NoURL());

      Checker.load('getLabsCheck', (req) => {
        if (req.params && req.params.repo) { return true; }
        else {
          return false;
        }
      },
    new GetLabsErr());
      initialized = true;
    }
}


function _handle(isCorrect, err, callback) {
  if (callback && typeof callback === 'function') {
    if (!isCorrect) { callback(err); } else callback(null);
  } else if (!isCorrect) { throw err; } else return true;
}

module.exports = {
  initErrors,
  initConditions,
  // Initialize the application
  init(callback) {
    let isInstalledApplication;

    initErrors();
    initConditions();
      async.waterfall([
        // Check requires
        (cb) => checkDSPRequires(cb),
        (cb) => {
          this.isInstalled((isInstalled) => {
            isInstalledApplication = isInstalled;
            if (isInstalled) {
              configData.getConfig((err, config) => {
                if (err) cb(err);
                else {
                  const userPath = path.join(appUtils.getHome(), config.mainDir, config.name);
                  if (!fs.existsSync(userPath)) { cb(new Error(`${userPath} dir not found! Pls delete config_user.json and reinstall `)); }
                  if (!fs.existsSync(path.join(userPath, "labels.json"))) {
                    log.warn('labels.json file does not exists, create it');
                    jsonfile.writeFileSync(path.join(userPath, "labels.json"), { labels: [] });
                  }
                  if (!fs.existsSync(path.join(userPath, ".dockerfiles"))) {
                    log.warn('.dockerfiles directory does not exists, create it');
                    fs.mkdirSync(path.join(userPath, ".dockerfiles"));
                  }
                  // Update repogitData
                  cb(null);
                }
              });
            } else cb(null);
          });
        },
        // Check if the json repositories exists in maindir
        (cb) => {
        if (isInstalledApplication) {
            log.info("Check if repos.json exists");
            _checkRepos(cb);
        } else {
            cb(null);
        }
      }],(err) => { callback(err); });
    },
  AppConditions: Checker,


  JoiAppConditions: JoiChecker,
  /* ERRORS  */
  errorLabNoStopped(statesRunning) {
    let errMessage = '[ ';
    _.each(statesRunning, (state) => {
      errMessage += `${state.repoName}/${state.labName}`;
      errMessage += ', ';
    });
    errMessage = errMessage.substring(0, errMessage.length - 2);
    errMessage += ' ]';
    return new Errors.LabRepoNoStopped(errMessage);
  },

  errorCannotDelete(filename, labname) {
    return new Errors.errorCannotDelete(`Cannot delete ${filename} because it's used in ${labname} lab`);
  },
  errorDirAlreadyExists() {
    return new Errors.errorDirAlreadyExists();
  },
  /* END ERROR*/


  checkParams(data, fieldNames, callback) {
    const err = new Errors.find('noCorrectParams');

    let isCorrect = true;
    let strErr = '';

    for (let i = 0; i < fieldNames.length; i += 1) {
      const condition = !data[fieldNames[i]] || data[fieldNames[i]] === 'undefined' || (typeof data[fieldNames] === 'string' && _.isEmpty(data[fieldNames[i]]));
      if (condition) {
        isCorrect = false;
        strErr = `No all params received. Missing ${fieldNames[i]}`;
      }
    }
    _handle(isCorrect, new err(strErr), callback);
  },
  checkString(data, callback) {
    const err = new Errors.find('stringErr');
    _handle(_.isString(data), new err(), callback);
  },
  checkAlphabetic(data, callback) {
    const myRegEx  = /[^_a-z\d]/i;
    let isValid = !(myRegEx.test(data));
    if(isValid) {
      callback(null);
    } else {
      callback(new Errors.find('alphabetic'));
    }
  },
  // if config/config_user.json is already created,returns true else false
  isInstalled(cb) {
    configData.getConfig((err) => {
      if (err) { cb(false); } else cb(true);
    });
  },

  checkGitUrl(data, callback){
    const myRegEx  = /((git@[\w]+(\.{1}[\w]{1,})+:)|(https:\/\/([\w]+(\.{1}[\w]{1,})+)\/))([\w_-]+\/{0,1})+(\.git)/i;
    let isValid = myRegEx.test(data);
    if(isValid) {
      callback(null);
    } else {
      callback(new Errors.invalidGitUrl());
    }
  },

  checkEmail(data, callback){
    const myRegEx  = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i;
    let isValid = myRegEx.test(data);
    if(isValid) {
      callback(null);
    } else {
      callback(new Errors.invalidEmail());
    }
  },



  checkIfRepoIsPrivateAndValid(repo, isUpdate, callback) {
    const url = repo.url;
    if (repo.hasOwnProperty('isPrivate') && repo.isPrivate) {
      if (url.includes('http://') || url.includes('https://')) {
        if (!isUpdate) {
          if (!(repo.hasOwnProperty('username') && repo.hasOwnProperty('token') && repo.username && repo.token)) {
            return callback(new Errors.invalidHttpAuth());
          }
        }
        repo.sshKeyPath = null;
      } else if (url.toLowerCase().match('(([\\w]+)@([\\w]+)(\\.([\\w]+))+:(([\\w]+)\\/([\\w_\\-]+))+.git)')) {
        //Use default config in .ssh/config
        /*if (!(repo.hasOwnProperty('sshKeyPath') && repo.sshKeyPath)) {
          return callback(new Errors.invalidSshAuth());
        }*/
        repo.username = null;
        repo.token = null;
      } else{
        return callback(new Errors.invalidGitUrl());
      }
    }
   return  callback(null);
  },
};

