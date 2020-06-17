// const appRoot = require('app-root-path');
const appRoot = require('app-root-path');
const WebSocket = require('ws');
const installationHandler = require('./ws_installation.js');
const dockerActions = require('./ws_docker_actions.js');
const wsGitHandler = require('./ws_git_manager');
const AppUtils = require('../util/AppUtils');
const cmd = require('node-cmd');

const log = AppUtils.getLogger();

let bufferLine;
let counterLine = 0;
const MAXLINES = 15;


function sendResponse(ws, err) {
  log.info('[WEB SOCKET Response]');
  let resp;
  if (err) {
    log.error(`Web socket error: ${err}`);
    resp = {
      status: 'error',
      code: err.code || 500,
      message: err.message,
    };
  } else {
    log.info('Web socket success response');
    resp = {
      status: 'success',
      message: 'success',
    };
  }

  if (ws.readyState === WebSocket.OPEN) { ws.send(JSON.stringify(resp)); }
}
function sendProgressMessage(ws, message) {
  const resp = {
    message,
    status: 'progress',
  };
  if (ws.readyState === WebSocket.OPEN) { ws.send(JSON.stringify(resp)); }
}

function manageInstallation(ws, jsonMessage) {
  installationHandler.installation(
    jsonMessage.config,
    jsonMessage.repo,
    // End callback
    (err) => {
      sendResponse(ws, err);
    },
    // Called during installation
    (dataline) => {
    // In order to reduce overhead ws.send use a buffer
      if (counterLine < MAXLINES) {
        bufferLine += dataline;
        counterLine += 1;
      } else {
        counterLine = 0;
        sendProgressMessage(ws, bufferLine);
        bufferLine = '';
      }
    }
  );
}

// function manageAreImagesInstalled(ws, jsonMessage) {
//   const params = jsonMessage.params;
//   dockerActions.areImagesInstalled(params, (err) => {
//     sendResponse(ws, err);
//     sendProgressMessage(ws, dataline);
//   });
// }

function manageDockerBuild(ws, jsonMessage) {
  const body = jsonMessage.body;
  const params = jsonMessage.params;
  dockerActions.build(params, body, (err) => {
    sendResponse(ws, err);
  }, (dataline) => {
    sendProgressMessage(ws, dataline);
  });
}
function manageDockerRun(ws,jsonMessage) {
     const params = jsonMessage.params;
     dockerActions.dockerRun(params, err => {
         sendResponse(ws,err);
     }, (dataline) => {
       sendProgressMessage(ws,dataline);
     });
 }


function manageDockerUp(ws, jsonMessage) {
  const body = jsonMessage.body;
  const params = jsonMessage.params;
  dockerActions.composeUp(params, body, (err) => {
    sendResponse(ws, err);
  }, (dataline) => {
    sendProgressMessage(ws, dataline);
  });
}
function manageWiresharkRun(ws, jsonMessage) {
  const body = jsonMessage.body;
  dockerActions.wiresharkRun(body, err => {
    sendResponse(ws, err);
  }, (dataline) => {
    sendProgressMessage(ws, dataline);
  });
}

function manageWiresharkStop(ws, jsonMessage) {
  dockerActions.wiresharkStop(err => {
    sendResponse(ws, err);
  })
}

function manageKaliRun(ws, jsonMessage) {
  dockerActions.kaliRun(err => {
    sendResponse(ws, err);
  }, (dataline) => {
    sendProgressMessage(ws, dataline);
  });
}
function manageBrowserRun(ws, jsonMessage) {
  const body = jsonMessage.body;
  dockerActions.browserRun(body, err => {
    sendResponse(ws, err);
  }, (dataline) => {
    sendProgressMessage(ws, dataline);
  });
}

function manageCaptureRun(ws, jsonMessage) {
  const body = jsonMessage.body;
  dockerActions.captureRun(body, err => {
    sendResponse(ws, err);
  }, (dataline) => {
    sendProgressMessage(ws, dataline);
  });
}
function manageHttpdRun(ws, jsonMessage) {
  const body = jsonMessage.body;
  dockerActions.httpdRun(body, err => {
    sendResponse(ws, err);
  }, (dataline) => {
    sendProgressMessage(ws, dataline);
  });
}

function manageDockerDown(ws, jsonMessage) {
  const body = jsonMessage.body;
  const params = jsonMessage.params;
  dockerActions.composeDown(params, body, (err) => {
    sendResponse(ws, err);
  }, (dataline) => {
    sendProgressMessage(ws, dataline);
  });
}
function manageRemoveImage(ws, jsonMessage) {
  const body = jsonMessage.body;
  const params = jsonMessage.params;
  dockerActions.removeImage(params, body, (err) => {
    sendResponse(ws, err);
  })
}
function manageDownloadImages(ws, jsonMessage) {
  const body = jsonMessage.body;
  const params = jsonMessage.params;
  dockerActions.downloadImages(params, body, (err) => {
    sendResponse(ws, err);
  }, (dataline) => {
    sendProgressMessage(ws, dataline);
  });
}

function manageSyncGithub(ws, jsonMessage) {
  wsGitHandler.synchronizeLocalGithub(jsonMessage.body, (err) => sendResponse(ws, err));
}


function manageAddProject(ws, jsonMessage) {
  wsGitHandler.addProject(jsonMessage.body, (err) => {
    if (err) {
      log.error(err);
      sendResponse(ws, new Error(err));
    }
    else {
      // Restart command
      sendResponse(ws,null);
    }
  });
}
// Update a single project
function manageUpdateProject(ws, jsonMessage) {
  wsGitHandler.updateProject(jsonMessage.body, (err) => {
    if (err) {
      log.error(err);
      sendResponse(ws, new Error(err));
    }
    else {
      // Restart command
      sendResponse(ws,null);
    }
  });
}

// Update multiple projects
function manageUpdateProjects(ws) {
  wsGitHandler.updateProjects((err) => {
    sendResponse(ws, err);
  });
}

function manageUpdateApplication(ws) {
  const appRootString = appRoot.toString();
  log.info('[WS_HANDLER] Update Application [====]');
  wsGitHandler.updateApplication((err) => {
    if (err) {
      log.error(err);
      sendResponse(ws, err);
    }
    else {
      // Restart command
      sendResponse(ws, null);
      log.info('Restart server');
      cmd.get(`sh ${appRootString}/server_restart.sh`);
    }
  });
}

function manageEditRepository(ws, jsonMessage) {
  wsGitHandler.editRepository(jsonMessage.body, (err) => {
    if (err) {
      log.error(err);
      sendResponse(ws, new Error(err));
    } else {
      // Restart command
      sendResponse(ws, null);
    }
  });
}

function managePullPersonalRepo(ws, jsonMessage){
  log.info('[WS_HANDLER] Pulling Personal Repo');
  wsGitHandler.pullPersonalRepo((err) => {
    if (err) {
      log.error(err);
      sendResponse(ws, new Error(err));
    } else {
      // Restart command
      sendResponse(ws, null);
    }
  });
}

function managePushPersonalRepo(ws, jsonMessage){
  log.info('[WS_HANDLER] Pushing Personal Repo');
  wsGitHandler.pushPersonalRepo(jsonMessage.body, (err) => {
    if (err) {
      log.error(err);
      sendResponse(ws, new Error(err));
    } else {
      // Restart command
      sendResponse(ws, null);
    }
  });
}

exports.init = function init(server) {
  const wss = new WebSocket.Server({
    server,
    perMessageDeflate: false,
  });

  wss.on('connection', (ws) => {
    // You might use location.query.access_token to authenticate or share sessions
    // or ws.upgradeReq.headers.cookie (see http://stackoverflow.com/a/16395220/151312)
    ws.on('message', (message) => {
      try {
      const jsonMessage = JSON.parse(message);
      switch (jsonMessage.action) {
        case 'installation':
          manageInstallation(ws, jsonMessage);
          break;
        // case 'are_images_installed':
        //   manageAreImagesInstalled(wc, jsonMessage);
        case 'docker_run':
          manageDockerRun(ws, jsonMessage);
          break;
        case 'docker_up':
          manageDockerUp(ws, jsonMessage);
          break;
        case 'wireshark_run':
          manageWiresharkRun(ws, jsonMessage);
          break;
        case 'wireshark_stop':
          manageWiresharkStop(ws, jsonMessage);
          break;
        case 'kali_run':
          manageKaliRun(ws, jsonMessage);
          break;
        case 'browser_run':
          manageBrowserRun(ws, jsonMessage);
          break;
        case 'capture_run':
          manageCaptureRun(ws, jsonMessage);
          break;
        case 'httpd_run':
          manageHttpdRun(ws, jsonMessage);
          break;
        case 'docker_build':
          manageDockerBuild(ws, jsonMessage);
          break;
        case 'docker_down':
          manageDockerDown(ws, jsonMessage);
          break;
        case 'remove_image':
          manageRemoveImage(ws, jsonMessage);
          break;
        case 'download_images':
          manageDownloadImages(ws, jsonMessage);
          break;
        case 'synchronize_github':
          manageSyncGithub(ws, jsonMessage);
          break;
        case 'update_project':
          manageUpdateProject(ws, jsonMessage);
          break;
        case 'update_projects':
          manageUpdateProjects(ws, jsonMessage);
          break;
        case 'add_project':
          manageAddProject(ws, jsonMessage);
          break;
        case 'edit_repository':
          manageEditRepository(ws,jsonMessage);
          break;
        case 'update_application':
          manageUpdateApplication(ws, jsonMessage);
          break;
        case 'pull_personal_repo':
          managePullPersonalRepo(ws, jsonMessage);
          break;
        case 'push_personal_repo':
          managePushPersonalRepo(ws, jsonMessage);
          break;
        default:
          log.error(`in web socket message: ${jsonMessage.action} is no registered`);
          sendResponse(ws, new Error(`${jsonMessage.action} is not registered`));
          break;
        }
      }
    catch(e) {
      log.error(e);
      //sendResponse(ws, null);
    }
    });
  });
};
