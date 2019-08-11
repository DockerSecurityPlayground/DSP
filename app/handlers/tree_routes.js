const fs = require('fs');
const configData = require('../data/config.js');
const copyDir = require('copy-dir');
const pathExists = require('path-exists');
const cpFile = require('cp-file');
const path = require('path');
const httpHelper = require('help-nodejs').httpHelper;
const rimraf = require('rimraf');
const async = require('async');
const Checker = require('../util/AppChecker');
const appUtils = require('../util/AppUtils');
const networkData = require('../data/network.js');

const log = appUtils.getLogger();


function processNode(_p, f) {
  fp = path.join(_p, f);
  // Fixinr broken links
  if (!fs.existsSync(fp))
    return ""
  else {
    const s = fs.statSync(path.join(_p, f));
    return {
      id: path.join(_p, f),
      text: f,
      icon: s.isDirectory() ? 'jstree-custom-folder' : 'jstree-custom-file',
      state: {
        opened: false,
        disabled: false,
        selected: false,
      },
      li_attr: {
        base: path.join(_p, f),
        isLeaf: !s.isDirectory(),
      },
      children: s.isDirectory(),
    };
  }
}

function processReq(_p, res) {
  const resp = [];
  pathExists(_p)
  .then((exists) => {
    if (exists) {
      fs.readdir(_p, (err, list) => {
        for (let i = list.length - 1; i >= 0; i -= 1) {
          if (list[i]) {
            newNode = processNode(_p, list[i])
            if (newNode != "") resp.push(newNode);
          }
        }
        res.json(resp);
      });
    }
    else res.send(new Error('Error path in tree_routes'));
  });
}

function manageTree(pSaved, req, res) {
  let _p;
  if (req.query.id === '1') {
    _p = pSaved;
    // log.info('path:');
    // log.info(_p);
    processReq(_p, res);
  } else if (req.query.id) {
    _p = req.query.id;
    processReq(_p, res);
  } else {
    res.json(['No valid data found']);
  }
}
  /* Serve the lab tree */
function projectTreeSearch(req, res) {
  // log.info("sono in project tree search")
  configData.getUserPath((err, data) => {
    //log.info('sono in config get userpath');
    if (!err) {
      const userPath = data;
      const pathData = path.join(userPath, '.data');
      if (fs.existsSync(pathData)) {
        //log.info('exists');
        const pSaved = pathData;
        manageTree(pSaved, req, res);
      } else log.info(`path ${pathData} doesn't exists!`);
    } else {
      log.info(`err in projectTreeSearch:${err}`);
    }
  });
}

function treeSearch(req, res) {
  //log.info('sono in treeSearch');
  const pSaved = appUtils.getHome();
  manageTree(pSaved, req, res);
}

  /* Serve a Resource */
function resourceSearch(req) {
  //log.info('RESOURCE SEARCH');
  log.info(req.query.resource);
    // res.send(fs.readFileSync(req.query.resource, 'UTF-8'));
}


function copyFile(source, target, cb) {
  cpFile(source, target)
    .then(() => {
      cb(null);
    },
    (err) => {
      cb(err);
    });
}

function uploadFile(req, res) {
  //log.info('sono in upload file');
  log.info(req.body);
  let filename;
  let dataPath;
  async.waterfall([
    (cb) => Checker.checkParams(req.body, ['file'], cb),
    (cb) => configData.getUserPath(cb),
    (userPath, cb) => {
      filename = req.body.file;
      // file will we saved in lab data dir with the same name as the file
      dataPath = path.join(userPath, '.data', path.basename(filename));
      fs.stat(filename, cb);
    },
    (stats, cb) => {
      if (stats.isDirectory()) copyDir(filename, dataPath, cb);
      else if (stats.isFile()) copyFile(filename, dataPath, cb);
      else cb(new Error('Unknown file type'));
    }],
    (err) => httpHelper.response(res, err));
}

function deleteFile(req, res) {
  const filename = req.query.id;
  //log.info('DELETE FILE');
  //log.info(`try to delete ${filename}`);
  fs.stat(filename, (err, stats) => {
    if (err) { appUtils.response('DELETE FILE', res, err); } else {
      networkData.canDeleteFile(filename, (errCanDelete) => {
        if (errCanDelete) appUtils.response('DELETE FILE', res, errCanDelete);
        else if (stats.isDirectory()) {
          rimraf(filename, (innerErr) => {
            appUtils.response('DELETE FILE', res, innerErr);
          });
        } else if (stats.isFile()) {
          fs.unlink(filename, (fileErr) => {
            appUtils.response('DELETE FILE', res, fileErr);
          });
        // No file nor file ? What is????
        } else { appUtils.response('DELETE FILE', res, new Error('Unknown data')); }
      });
    }
  });
      // file will we saved in lab data dir with the same name as the file
}

exports.resourceSearch = resourceSearch;
exports.projectTreeSearch = projectTreeSearch;
exports.treeSearch = treeSearch;
exports.uploadFile = uploadFile;
exports.deleteFile = deleteFile;
