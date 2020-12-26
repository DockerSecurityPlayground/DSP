const request = require('request');
const process = require('process')
const fs = require('fs');
const appRoot = require('app-root-path');
const async = require('async');
const path = require('path');
const dirContainingLabs = path.join(appRoot.toString(), 'scripts', 'labs-to-be-uploaded');
const dspUrl = "http://127.0.0.1:8080"

const log = (msg) => console.log(`[+] ${msg}`);
const logErr = (msg) => console.error(`[-] ${msg}`);
const exit = (msg = "") => {
    msg ? err(msg) : {};
    log(`Usage: ${process.argv[0]} <file-to-be-uploaded>`);
    process.exit(-1);
}
// process.argv.length != 3  ? exit() : {};
// !fs.existSync(filepath) ? exit("File not existent") : {};

// Get files: avoid dirs and .keep file, only zip and yaml files and no docker-compose.yml files neither docker-compose.yaml files as we only take paths
let files = fs.readdirSync(dirContainingLabs).map((e) => path.join(dirContainingLabs, e)).filter((e) => fs.statSync(e).isFile && e != path.join(dirContainingLabs, '.keep'));
files = files.filter((e) => e.endsWith(".zip") || e.endsWith("yaml") || e.endsWith("yml"));

// For each file try uploading by using upload-docker-compose endpoint
async.eachSeries(files, (f, c) => {
    const labName = path.basename(f).split('.').slice(0, -1).join('.').trim();
    log(`Try uploading ${labName}`);
    let formData = {
        my_field: 'file',
        my_file: fs.createReadStream(f)
    };
    request.post({ url: `${dspUrl}/api/upload-docker-compose/${labName}`, formData: formData }, (data, err) => {
        // Error is not blocking
        if (err) {
            logErr('upload failed:' + err);
        } c(null);
    }, () => {
        log("Upload completed");
    })
});
