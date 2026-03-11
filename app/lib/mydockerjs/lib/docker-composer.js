const yaml = require('js-yaml');
const utils = require('./utils');
const _ = require('underscore');
const docker = require('./docker');
const { getDockerComposeCommandSync } = require('./docker-utils')
const path = require('path');
const os = require('os');
const fs = require('fs');

// yml if false, yaml otherwise
function getComposeFile(thePath) {
  // Docker yaml if alternative true
  const retPath = path.join(thePath, 'docker-compose.yml');
  const retPath2 = path.join(thePath, 'docker-compose.yaml');

  return (fs.existsSync(retPath)) ? retPath : retPath2;
}

function generate(data) {
  return yaml.dump(data);
}
// Complete docker-compose execution
function dcExec(thePath, command, callback, notifyCallback, options = "") {
  const dockerComposeCommand = getDockerComposeCommandSync();
  if (!dockerComposeCommand) {
    if (typeof callback === 'function') {
      callback(new Error('docker compose command not found'));
    }
    return null;
  }

  const pid = utils.cmd(
   `${dockerComposeCommand} -f "${getComposeFile(thePath)}" ${command} ${options}`,
    callback);
  // Notify
  if (notifyCallback && typeof notifyCallback === 'function') {
    utils.docker_logs(pid, notifyCallback);
  }
  return pid;
}

function isRunning(thePath, callback) {
  dcExec(thePath, 'ps -q', (err, data) => {
    if (err) callback(err);
    else if (data === '') callback(null, false);
    else callback(null, true);
  });
}

function getContainerID(thePath, service, callback) {
  return dcExec(thePath, `ps -q ${service}`, (err, data) => {
    if (err) {
      callback(err, data);
    }
    else {
      let containerID = data;
      // Replace newlines
      containerID = containerID.replace(/(\r\n|\n|\r)/gm, '');
      callback(null, containerID);
    }
  });
}

// Call docker-compose up in thePath and returns the process pid
function up(thePath, callback, dataNotify, options = "") {
  const pid = dcExec(thePath, 'up -d', callback, dataNotify, options);
  return pid;
}


// Call docker-compose down in path and returns the process pid
function down(thePath, callback, dataNotify) {
  const pid = dcExec(thePath, 'down --remove-orphans', callback, dataNotify);
  return pid;
}

function cp(thePath, service, src, dst, callback) {
  getContainerID(thePath, service, (err, data) => {
  // No err : get containerID = data
    if (!err) {
      const containerID = data;
      // Cal docker exec
      return docker.cp(containerID, src, dst, callback);
    }
    else {
      callback(err);
      return null;
    }
  });
}
function cpFrom(thePath, service, src, dst, callback) {
  getContainerID(thePath, service, (err, data) => {
  // No err : get containerID = data
    if (!err) {
      const containerID = data;
      // Cal docker exec
      return docker.cpFrom(containerID, src, dst, callback);
    }
    else {
      callback(err);
      return null;
    }
  });
}

function exec(thePath, service, command, callback, paramsInput, notifyCallback) {
  // Used for store possible errors
  let dataLine = '';
  const paramsProto = {
    detached: false,
  };
  let pid;
  // Get the params
  const params = _.extend({}, paramsProto, paramsInput);
  // Detached for Linux and mac
  if (os.platform() !== 'win32' && !params.detached) {
    pid = dcExec(thePath, `exec ${service} ${command}`, (err, data) => {
      if (err)
      {
        // Override old existent error
        let stringErr = `Error occurred: ${err.message}.`;
        if (dataLine !== '') {
          stringErr += `DOCKER GIVES: ${dataLine}`;
        }
        callback(new Error(stringErr));
      }
      else callback(null, data);
    });
    // Capture possible errors
    utils.docker_stdout(pid, (dl) => {
      dataLine += dl;
    });
    utils.docker_stdout(pid, notifyCallback);
  }
  // Workaround for detached mode docker-compose and windows-mode
  else {
    getContainerID(thePath, service, (err, data) => {
      // No err : get containerID = data
      if (!err) {
        const containerID = data;
      // Cal docker exec
        pid = docker.exec(containerID, command, callback, params);
        utils.docker_stdout(pid, notifyCallback);
      }
      else callback(err);
    });
  }
}

exports.generate = generate;
exports.up = up;
exports.down = down;
exports.exec = exec;
exports.cp = cp;
exports.cpFrom = cpFrom;
exports.getContainerID = getContainerID;
exports.isRunning = isRunning;
