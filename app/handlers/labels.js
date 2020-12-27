const labelsData = require('../data/labels.js');
const configData = require('../data/config.js');
const httpHelper = require('help-nodejs').httpHelper;
const async = require('async');
const path = require('path');
const AppUtils = require('../util/AppUtils.js');

const Checker = require('../util/AppChecker');
const c = require('../../config/local.config.json');
// const appUtils = require('../util/AppUtils.js');
//
// const log = appUtils.getLogger();


function labelsOfLab(req, res) {
  async.waterfall([
    // Check if repo dir parameter exists
    (cb) => {
      Checker.checkParams(req.params, ['nameLab', 'repo'], cb);
    },

    (cb) => configData.getConfig(cb),
    // get labels
    (config, cb) => {
      const mainDir = config.mainDir;
      // label file path
      const labelFile =
        path.join(AppUtils.getHome(), mainDir, req.params.repo, req.params.nameLab, c.config.name_labelfile);
      labelsData.getLabels(labelFile, cb);
    },
  ],
  // Returns { labels: [] }
  (err, results) => httpHelper.response(res, err, { labels: results }));
}

function allLabels(req, res) {
  async.waterfall([
    // Check if repo dir parameter exists
    (cb) => Checker.checkParams(req.params, ['repo'], cb),
    (cb) => { configData.getConfig(cb); },
    // get labels
    (config, cb) => {
      const mainDir = config.mainDir;
      // label file path
      const labelFile = path.join(AppUtils.getHome(), mainDir, req.params.repo, c.config.name_labelfile);
      labelsData.getLabels(labelFile, cb);
    },
  ],
  // Returns { labels: [] }
  (err, results) => {
    httpHelper.response(res, err, { labels: results });
  });
}

function deleteLabel(req, res) {
  const log = AppUtils.getLogger();
  log.info('[DELETE LABEL]');
  async.waterfall([

    (cb) => Checker.checkParams(req.params, ['repo', 'labelname'], cb),
    (cb) => configData.getConfig(cb),
    // get labels
    (config, cb) => {
      const mainDir = config.mainDir;
      // label file path
      const labelFile = path.join(AppUtils.getHome(), mainDir, req.params.repo, c.config.name_labelfile);
      const labelname = req.params.labelname;
      // It's a repo label so it's true
      labelsData.deleteLabel(labelFile, labelname, true, cb);
    },
  ],
  // Returns { labels: [] }
  (err, results) => {
    AppUtils.response('DELETE LABEL', res, err, { labels: results });
  });
}

function addLabelToLab(req, res) {
  async.waterfall([
    (cb) => Checker.checkParams(req.params, ['repo', 'nameLab'], cb),
    (cb) => configData.getConfig(cb),
    (config, cb) => {
      const mainDir = config.mainDir;
      // label file path
      const labelFile =
        path.join(AppUtils.getHome(), mainDir, req.params.repo, req.params.nameLab, c.config.name_labelfile);
      labelsData.getLabels(labelFile, cb);
    },
  ],
  // Returns { labels: [] }
  (err, results) => httpHelper.response(res, err, { labels: results }));
}

function updateLabel(req, res) {
  const log = AppUtils.getLogger();
  log.info('[UPDATE LABEL]');
  async.waterfall([
    (cb) => Checker.checkParams(req.params, ['repo'], cb),
    (cb) => Checker.checkParams(req.body, ['oldName', 'name', 'color'], cb),
    (cb) => configData.getConfig(cb),
    // Get labels
    (config, cb) => {
      const mainDir = config.mainDir;
      // label file path of repository
      const labelFile = path.join(AppUtils.getHome(), mainDir, req.params.repo, c.config.name_labelfile);
      // function changeLabel(labelfile, labelname, newLabel, callback)  in dataLabel
      labelsData.changeLabel(labelFile,
      req.body.oldName, // old name
      // new label
        { name: req.body.name,
          description: req.body.description,
          color: req.body.color,
        }
        // callback
        , cb);
    },
  ],
  // Returns { labels: [] }
  (err) => AppUtils.response('UPDATE LABEL', res, err, req.body));
}



function addLabel(req, res) {
  const log = AppUtils.getLogger();
  log.info('[UPDATE LABEL]');
  async.waterfall([
    (cb) => Checker.checkParams(req.params, ['repo'], cb),
    (cb) => Checker.checkParams(req.body, ['name', 'color'], cb),
    (cb) => configData.getConfig(cb),
    // get labels
    (config, cb) => {
      const mainDir = config.mainDir;
      // label file path of repository
      const labelFile = path.join(AppUtils.getHome(), mainDir, req.params.repo, c.config.name_labelfile);
      labelsData.createLabel(labelFile, req.body, cb);
    },
  ],
  // Returns { labels: [] }
  (err) => AppUtils.response('ADD LABEL', res, err, req.body));
}
exports.deleteLabel = deleteLabel;
exports.allLabels = allLabels;
exports.labelsOfLab = labelsOfLab;
exports.addLabelToLab = addLabelToLab;
exports.updateLabel = updateLabel;
exports.addLabel = addLabel;
exports.version = '0.1.0';
