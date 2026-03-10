const async = require('async');
const jsonfile = require('jsonfile');
const { readFileWithRetry } = require('../util/jsonfile_compat');

const getSnippets = function getSnippets(snippetsname, callback) {
    async.waterfall([
        (cb) => readFileWithRetry(snippetsname, cb)
    ],
    (err, arrayJSON) => {
        if (!arrayJSON || !arrayJSON.snippets) {
            callback(new Error('snippets not found'));
        } else callback (err, arrayJSON.snippets)
    });
};


exports.getSnippets = getSnippets;