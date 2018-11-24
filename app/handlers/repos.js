const appUtils = require('../util/AppUtils.js');
const async = require('async');
const repos = require('../data/repos.js');
const log = appUtils.getLogger();
const c = require('../../config/local.config.json');
const httpHelper = require('help-nodejs').httpHelper;

function get(req, res) {
  async.waterfall([
    (cb) => repos.get(cb)
    ], (err, results) => {
      httpHelper.response(res, err, results);
  });
}

exports.get = get;
exports.version = '0.1.0';
