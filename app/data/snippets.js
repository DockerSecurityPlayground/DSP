const async = require('async');
const jsonfile = require('jsonfile');

const getSnippets = function getSnippets(snippetsname, callback) {
    async.waterfall([
        (cb) => jsonfile.readFile(snippetsname, callback)
    ],
    (err, arrayJSON) => {
        if (!arrayJSON || !arrayJSON.snippets) {
            callback(new Error('snippets not found'));
        } else callback (err, arrayJSON.snippets)
    });
};


exports.getSnippets = getSnippets;