const snippetsData = require('../data/snippets.js');
const path = require('path');
const httpHelper = require('help-nodejs').httpHelper;

const Checker = require('../util/AppChecker.js');
const configData = require('../data/config.js');
const AppUtils = require('../util/AppUtils.js');
const c = require('../../config/local.config.json');
const officialSnippetsFile = 'config/snippets.json';

function getUserSnippets(req, res) {
    async.waterfall([
        (cb) => Checker.checkParams(req.params, ['repo'], cb),
        (cb) => {configData.getConfig(cb);},

        (config, cb) => {
            const mainDir = config.mainDir;

            const snippetsFile = path.join(AppUtils.getHome(), mainDir, req.params.repo, c.config.name_snippetsfile)
            snippetsData.getSnippets(snippetsFile,cb);
        },
    ],
    (err, results) => {
        httpHelper.response(res, err, {snippets: results});
    });
}

function getOfficialSnippets(cb) {
  snippetsData.getSnippets(officialSnippetsFile,(cb));
}

function allSnippets(req, res) {
  // TODO WITH waterfall
  getOfficialSnippets((err, results) => {
    httpHelper.response(res, err, {snippets: results});
  })
}

exports.allSnippets = allSnippets;
