const { exec } = require('child_process');
const _ = require('underscore');
const path = require('path');
const homedir = require('homedir');
const os = require('os');
const url = require('url')
const validUrl = require('valid-url')
const http = require('http')

const serverUrl = 'http:/v1.24';
const unixSock = '/var/run/docker.sock';
// For Windows : the path of docker toolbox certificates
const toolboxPath = path.join(homedir(), '.docker', 'machine', 'machines', 'default');
const certPath = path.join(toolboxPath, 'cert.pem');
const caPath = path.join(toolboxPath, 'ca.pem');
const keyPath = path.join(toolboxPath, 'key.pem');
const urlDockerToolbox = '192.168.99.100';
const portListenDockerToolbox = '2376';

const winParams = `--cert ${certPath} --cacert ${caPath} --key ${keyPath}`;
const windowsServer = `https://${urlDockerToolbox}:${portListenDockerToolbox}`;


// Change data,err convention in err ,data convention
exports.cmd = function cmdF(command, callback) {
  const child = exec(command, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
    if (typeof callback === 'function') {
      callback(err, stdout || '');
    }
  });
  return child;
};
exports.run = function run(command, callback) {
  const child = exec(command, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
    if (typeof callback === 'function') {
      callback(err, stdout || '');
    }
  });
  return child;
};

exports.changeDir = function changeDir(thePath) {
  return `cd '${path.normalize(thePath)}'; `;
};

exports.addFlags = function addFlags(flags) {
  let fStr = '';
  _.each(flags, (val, key) => {
    fStr += `--${key}=${val} `;
  });

  return fStr;
};

exports.getDaemonOptions = (processEnvVar) => {
  let toRet = {
      socketPath: os.platform() !== 'win32' ? '/var/run/docker.sock'  : '//./pipe/docker_engine'
  }

  if (processEnvVar) {
    const splitted = processEnvVar.split(":")
    // Capture 127.0.0.1:2375
    if (splitted.length == 2 && /^\d+$/.test(splitted[1])) {
      toRet = {
        hostname: splitted[0],
        port: parseInt(splitted[1])
      }
      // Else if is validUrl
    } else if (validUrl.isUri(processEnvVar)) {
      const parsed = url.parse(processEnvVar)
      toRet = {
        hostname: parsed.hostname,
        port: parseInt(parsed.port)
      }
    }
  }
  return toRet;
}

exports.unixRequest= (api, method, retCallback, notifyCallback) => {
  const daemonOptions = this.getDaemonOptions(process.env.DOCKER_HOST);
  const options = _.extend({
    path: api,
    method: method,
  }, daemonOptions);

  let err = ""
  body = "";

  const callback = res => {
    if (res.statusCode !== 200) {
      err = res.statusCode
    }
      res.setEncoding('utf8');
      res.on('data', data => {
        body += data
        if (typeof notifyCallback === 'function') {
          notifyCallback(data);
        }
      });
      res.on('end', function () {
        if (err) {
          try {
            retCallback(`Error: status ${err}; ${JSON.parse(body).message}`)
          } catch(e) {
            // No JSON Error
            retCallback(`Error: status ${err}; ${body}`)
          }
        } else {
        retCallback(null, body);
        }
      });
      res.on('error', error => retCallback(error));
  };

  const clientRequest = http.request(options, callback);
  clientRequest.end();
}

exports.curl = (api, method, callback) => {
  let url;
  if (os.platform() !== 'win32') {
    url = serverUrl + api;
    // TODO METHODS ANALYSIS

    return exports.cmd(`curl  -s -S -X ${method} --unix-socket ${unixSock} "${url}"`, callback);
  }
  // For Windows another way
  else {
    url = windowsServer + api;
    return exports.cmd(`curl ${winParams} ${url}`, callback);
  }
};


exports.docker_stdout = function dockerStdout(pid, f) {
  let dataLine = '';
  // listen to the docker terminal output
  if (pid && pid.stdout && typeof f === 'function') {
    pid.stdout.on(
    'data',
    (data) => {
      dataLine = data;
      if (dataLine[dataLine.length - 1] === '\n') {
        f(dataLine);
      }
    }
  );
  }
};

exports.print = function print(err, data) {
  if (err) {
    console.log(err)
  }
  else console.log(data)
}
// Each log line call the f function
exports.docker_logs = function dockerLogs(pid, f) {
  let dataLine = '';
  // listen to the docker terminal output
  if (pid && pid.stderr && typeof f === 'function') {
    pid.stderr.on(
    'data',
    (data) => {
      dataLine += data;
      if (dataLine[dataLine.length - 1] === '\n') {
        f(dataLine);
      }
    }
  );
  }
};

exports.escapeString = function escapeString(s) {
  // return '"'+ s.replace(/(["\s'$\\])/g,'\\$1')+'"';
  // return '"'+ s.replace(/(["'])/g,'\\$1')+'"';
  // return s.replace(/(["'])/g,'\\$1');
  return s.replace(/(['])/g,'\\$1');
};

