const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const path = require('path');
const multipart = require('connect-multiparty');
const busboy = require('connect-busboy');


const app = express();
const http = require('http');
const fs = require('fs');
const labels = require('./app/handlers/labels');
const snippets = require('./app/handlers/snippets')
const labs = require('./app/handlers/labs');
const configHandler = require('./app/handlers/config');
const networkHandler = require('./app/handlers/network');
const repoHandler = require('./app/handlers/repos');
const dockerImages = require('./app/handlers/docker-images');
const serviceHandler = require('./app/handlers/services')
const dockerfilesHandler = require('./app/handlers/dockerfiles')
// const installationHandler = require('./app/handlers/installation.js');
const treeRoutes = require('./app/handlers/tree_routes.js');
const Checker = require('./app/util/AppChecker.js');
const multer = require('multer');
const webSocketHandler = require('./app/util/ws_handler.js');
const wsInstallationHandler = require('./app/util/ws_installation.js');
const localConfig = require('./config/local.config.json');
const healthChecker = require('./app/util/HealthLabState.js');
const errorHandler = require('express-error-handler');

const port = +process.env.PORT || 18181;
const host = process.env.DSP_IFACE || "127.0.0.1";
// var upload = multer({ dest: "uploads/" });
const storage = multer.memoryStorage();
const upload = multer({ storage });
const server = http.createServer(app);
const AppUtils = require('./app/util/AppUtils.js');
const dockerSocket = require('./app/util/docker_socket');

// const webshellConfigFile =
const log = AppUtils.getLogger();

function isTruthyEnv(value) {
  if (!value) {
    return false;
  }
  const normalized = String(value).trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

function getOrCreateAutoInstallConfig() {
  const configPath = AppUtils.path_userconfig();
  try {
    return AppUtils.getConfigSync();
  } catch (err) {
    if (err && err.code === 'ENOENT') {
      const defaultConfig = {
        name: 'dsp-app',
        mainDir: '.dsp',
        githubURL: '',
        dockerRepo: 'dockersecplayground'
      };
      fs.mkdirSync(path.dirname(configPath), { recursive: true });
      fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
      log.warn(`DSP_AUTOINSTALL enabled and config file missing, created default config at ${configPath}`);
      return defaultConfig;
    }
    throw err;
  }
}

function startAutoInstallationIfEnabled(done) {
  if (!isTruthyEnv(process.env.DSP_AUTOINSTALL)) {
    return done(null);
  }

  Checker.isInstalled((installed) => {
    if (installed) {
      log.info('DSP_AUTOINSTALL enabled, installation skipped because DSP is already installed');
      return done(null);
    }

    let config;
    try {
      config = getOrCreateAutoInstallConfig();
    } catch (err) {
      log.error(`DSP_AUTOINSTALL enabled but cannot read config file at ${AppUtils.path_userconfig()}: ${err.message}`);
      return done(err);
    }

    log.info(`DSP_AUTOINSTALL enabled, starting automatic installation using ${AppUtils.path_userconfig()}`);
    wsInstallationHandler.installation(
      config,
      {},
      (err) => {
        if (err) {
          log.error(`Automatic installation failed: ${err.message}`);
          return done(err);
        } else {
          log.info('Automatic installation completed successfully');
          return done(null);
        }
      },
      (progressLine) => {
        if (progressLine) {
          log.info(progressLine.toString().trim());
        }
      }
    );
  });
}

function startHealthCheckerIfInstalled() {
  Checker.isInstalled((isInstalled) => {
    if (!localConfig.config.test && isInstalled) {
      healthChecker.run((err) => {
        if (err) {
          log.error('Health checker error!');
          log.error(err);
        }
      });
    }
  });
}

function startServer() {
  server.listen(port, host, () => {
    if (localConfig.config.test) { log.warn('Testing mode enabled'); }
    log.info(`Server listening on ${host}:${port}`);
  });
}

app.use(busboy());
// Initialize the checker
Checker.init((err) => {
  if (err) {
    console.error(err.message);
    throw err;
  }
  startAutoInstallationIfEnabled((autoInstallErr) => {
    if (autoInstallErr) {
      throw autoInstallErr;
    }
    startHealthCheckerIfInstalled();
    startServer();
  });
});

// app.use(multipart({
//   uploadDir: localConfig.tmpDir
// }));

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
// Parse application/x-www-form-urlencoded & JSON
// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(bodyParser.json());

// Extend the dimension of body
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.use(methodOverride('X-HTTP-Method-Override'));
app.use('/webshell', express.static(path.join(__dirname, 'public', 'webshell')));
// app.use((err, req, res) => {
//  res.status(500);
//  res.end(`${err}\n`);
// });

// IT's TOO MUCH INFO FOR OUR APP , ANYWAY FOR FURTHER DEVELOPMENT UNCOMMENT
// app.use(log.requestLogger());

// Installation
// app.post('/dsp_v1/installation/', installationHandler.installation);

app.all('/', (req, res, next) => {
  // console.log("SONO QUI");
  Checker.isInstalled((installed) => {
    if (installed) {
      next();
    } else if (!res.headersSent) {
      res.redirect('/installation.html');
    }
  });
});

app.use(express.static(`${__dirname}/public`));
app.use((req, res, next) => {
  Checker.isInstalled((installed) => {
    if (installed) {
      next();
    } else {
      if (!res.headersSent) {
        res.redirect('/installation.html');
      }
    }
  });
});

// Api images
app.get('/dsp_v1/docker_images/', networkHandler.getListImages);
app.get('/dsp_v1/dsp_images', dockerImages.getImagesAllRepos);
app.get('/dsp_v1/dsp_images/:reponame', dockerImages.getImagesRepo);
app.get('/dsp_v1/dsp_images/:reponame/:labname', dockerImages.getImagesLab);

app.post('/dsp_v1/dockerfiles/:dockerfile', dockerfilesHandler.createDockerFile);
app.put('/dsp_v1/dockerfiles/:dockerfile', dockerfilesHandler.editDockerFile);
app.get('/dsp_v1/dockerfiles', dockerfilesHandler.getDockerFiles);
app.get('/dsp_v1/dockerfiles/:dockerfile', dockerfilesHandler.getDockerFile);
app.delete('/dsp_v1/dockerfiles/:dockerfile', dockerfilesHandler.deleteDockerFile);

//Api snippets
app.get('/dsp_v1/snippets/', snippets.allSnippets);

//Api Hack Tools
app.get('/dsp_v1/hack_tools/', serviceHandler.getListHackTools);
app.delete('/dsp_v1/hack_tools/:name', serviceHandler.deleteHackTool);
// Api labels
app.get('/dsp_v1/labels/:repo', labels.allLabels);
app.get('/dsp_v1/labels/:repo/:nameLab', labels.labelsOfLab);
// new label in a repository
app.post('/dsp_v1/labels/:repo', labels.addLabel);
// Change label
app.put('/dsp_v1/labels/:repo', labels.updateLabel);
app.delete('/dsp_v1/labels/:repo/:labelname', labels.deleteLabel);

// get all the repositories in main dir
app.get('/dsp_v1/all/', labs.getAll);
app.post('/dsp_v1/all/', labs.importLab);

// Api labs
app.post('/api/upload-docker-compose/:labname', labs.uploadCompose);
app.get('/dsp_v1/labs/:repo', labs.getLabs);
app.get('/dsp_v1/labs/:repo/:labname', labs.getInformation);
app.get('/dsp_v1/userlab/:labname', labs.getLabUserInformation);
app.put('/dsp_v1/labs/:labname', labs.saveInformation);
app.post('/dsp_v1/labs/:labname', (req, res) => {
  if (req.query.wantToCopy) {
    labs.copyLab(req, res);
  }
  else labs.newLab(req, res);
});

app.delete('/dsp_v1/labs/:labname', labs.deleteLab);

// Api config
app.get('/dsp_v1/config', configHandler.getConfig);
app.post('/dsp_v1/config', configHandler.updateConfig);


// Api docker network
app.get('/dsp_v1/docker_network/:namerepo/:namelab', networkHandler.get);
app.get('/dsp_v1/docker_network/is-imported/:namerepo/:namelab', networkHandler.isImported);
app.get('/dsp_v1/docker_network/:namelab', networkHandler.getUser);
app.post('/dsp_v1/docker_network/:namelab', networkHandler.save);

// API DOCKER MANAGMENT
app.get('/dsp_v1/services', serviceHandler.getServices);
app.post('/dsp_v1/services/:nameservice', serviceHandler.runService);
app.put('/dsp_v1/services/start/:nameservice', serviceHandler.startService);
app.get('/dsp_v1/services/browser', serviceHandler.isBrowserRun);
app.delete('/dsp_v1/services/browser', serviceHandler.stopBrowser);
app.get('/dsp_v1/services/httpd', serviceHandler.isHttpdRun);
app.delete('/dsp_v1/services/httpd', serviceHandler.stopHttpd);
app.get('/dsp_v1/services/kali', serviceHandler.isKaliRun);
app.delete('/dsp_v1/services/kali', serviceHandler.stopKali);
app.get('/dsp_v1/services/wireshark', serviceHandler.isWiresharkRun);
app.delete('/dsp_v1/services/wireshark', serviceHandler.stopWireshark);
app.get('/dsp_v1/services/tcpdump', serviceHandler.isTcpdumpRun);
app.delete('/dsp_v1/services/tcpdump', serviceHandler.stopTcpdump);
app.put('/dsp_v1/services/stop/:nameservice', serviceHandler.stopService);
app.post('/dsp_v1/services/defaultnetwork/:nameservice', serviceHandler.setAsDefault);
app.delete('/dsp_v1/services/:nameservice', serviceHandler.removeService);


// API GIT REPOS
app.get('/dsp_v1/git-repos', repoHandler.get);
app.delete('/dsp_v1/git-repos/:name', repoHandler.remove);

app.get('/dsp_v1/networkservices/:namerepo/:namelab', serviceHandler.getNetworkList);
app.post('/dsp_v1/networkservices', serviceHandler.attachNetwork);
app.delete('/dsp_v1/networkservices', serviceHandler.detachNetwork);

// Open docker shell
app.post('/dsp_v1/dockershell', networkHandler.dockershell)
// Copy from container to download dir
app.post('/dsp_v1/dockercopy', networkHandler.dockercopy)
app.post('/dsp_v1/dockerupload', networkHandler.dockerupload)

// Check if a dir exists
app.post('/dsp_v1/dir_exists', networkHandler.dirExists);
// Manage repositories

// Only for avatar
// app.post('/upload', upload.single('avatar'), (req, res) => {
//   if (req.file && req.file.buffer) {
//     const buffer = req.file.buffer;
//     const wstream = fs.createWriteStream('./public/assets/img/avatar.jpeg');
//     wstream.write(buffer);
//     wstream.end();
//   }
//   res.redirect('/');
// });



// File manager chooser
// Home chooser
app.get('/api/tree/', treeRoutes.treeSearch);
// Lab chooser
app.get('/api/tree/repo', treeRoutes.projectTreeSearch);
app.get('/api/resource', treeRoutes.resourceSearch);
app.post('/api/tree/repo', treeRoutes.uploadFile);
app.delete('/api/tree/repo/', treeRoutes.deleteFile);
//
app.use('/', (req, res) => {
  res.sendFile(`${__dirname}/public/index.html`);
});

app.use(log.errorLogger());
// Log the error
app.use((err, req, res, next) => {
  log.error(err);
  next(err);
});


// Respond to errors and conditionally shut
// down the server. Pass in the server object
// so the error handler can shut it down
// gracefully:
app.use(errorHandler({ server }));
//  function fourOhFour(req, res) {
//    res.writeHead(404, { 'Content-Type': 'application/json' });
//    res.end(`${JSON.stringify(helpers.invalid_resource())}\n`);
//  }


// Initialize web socket handler
webSocketHandler.init(server);
dockerSocket.init(server);
// Set COMPOSE_INTERACTIVE_NO_CLI=1
process.env.COMPOSE_INTERACTIVE_NO_CLI = 1

