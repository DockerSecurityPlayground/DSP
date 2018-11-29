const appUtils = require('../util/AppUtils.js');
const async = require('async');
const repos = require('../data/repos.js');
const log = appUtils.getLogger();
const c = require('../../config/local.config.json');
const httpHelper = require('help-nodejs').httpHelper;
const Checker = require('../util/AppChecker');

function get(req, res) {
  async.waterfall([
    (cb) => repos.get(cb)
    ], (err, results) => {
      httpHelper.response(res, err, results);
  });
}

function remove(req, res) {
  log.info("[ REPOS ] Delete repo ");
  async.waterfall([
    (cb) => Checker.checkParams(req.params, ['name'], cb),
    (cb) => repos.remove(req.params.name, cb)
    ], (err, results) => {
      appUtils.response("Delete repo", res, err, results);
  });
}

exports.get = get;
exports.remove = remove;
exports.version = '0.1.0';
