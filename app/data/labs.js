const jsonfile = require('jsonfile');
const async = require('async');
const os = require('os');
const path = require('path');
const fs = require('fs');
const pathExists = require('path-exists');
const yaml = require('js-yaml');
const fileType = require('file-type');
const StreamZip = require('node-stream-zip')
const labelData = require('./labels.js');
const networkData = require('./network');
const config = require('./config.js');
const rimraf = require('rimraf');
const unzipper = require('unzipper');
const _ = require('underscore');
const appUtils = require('../util/AppUtils');
const LabStates = require('../util/LabStates.js');
const c = require('../../config/local.config.json');
const { isDSPDir } = require('../util/AppUtils');
const log = appUtils.getLogger();

// Check if a buffer is a zip
function _isZip(b, callback) {
  // No yaml: is it a zip ? 
  fileType.fromBuffer(b)
    .then((data) => {
      if (data && data.ext && data.mime && data.ext == 'zip' && data.mime == 'application/zip') {
        callback(null, true)
      } else {
        callback(null, false);
      }
    }, (err) => callback(err));
}
function extractZip(randomPath, labName, callback) {
  let labPath = "";
  async.waterfall([
    (cb) => config.getUserPath(cb),
    (up, cb) => {
      labPath = path.join(up, labName);
      const zip = new StreamZip({
        file: randomPath, storeEntrie: true
      });

      zip.on('error', (err) => cb(err));
      zip.on('entry', (entry) => {
        // remove maliciously paths
        let pathname = path.resolve(labPath, entry.name);
        if (/\.\./.test(path.relative('./temp', pathname))) {
          log.warn("[zip warn]: ignoring maliciously crafted paths in zip file:", entry.name);
          return;
        }
        if ('/' === entry.name[entry.name.length - 1]) {
          log.info('[DIR]', entry.name);
          return;
        }

        zip.stream(entry.name, (err, stream) => {
          if (err) {
            cb(err);
          } else {
            stream.on('error', (err) => cb(err));
            // Create dir and pip recursively
            fs.mkdir(path.dirname(pathname),
              { recursive: true },
              (err) => {
                if (err) {
                  cb(err);
                } else {
                  stream.pipe(fs.createWriteSream(pathname));
                  cb(null);
                }
              });
          }
        });
      });
    }
  ])
}


function isValidZip(b, needToRemove = false, callback) {
  let randomName;
  let randomPath;
  let isStoredZip = false;
  let found = {
    compose: false,
    information: false,
    network: false
  }

  _isZip(b, (err, isZip) => {
    if (err)
      callback(err);
    else {
      if (!isZip) {
        callback(null, { valid: false });
      } else {
        let isError = false;
        // It is zip, need to manage
        async.waterfall([
          (cb) => {
            randomName = appUtils.getRandomName() + ".zip";
            randomPath = path.join(os.tmpdir(), randomName);
            fs.writeFile(randomPath, new Uint8Array(b), cb);
          }, (cb) => {
            isStoredZip = true;
            // File written, now we read to understand if it contains the right structure
            const zip = new StreamZip({
              file: randomPath,
              // storeEntries: true
            });
            zip.on('error', err => {
              isError = true;
              // Some error on opening zip
              cb(err);
            });

            zip.on('ready', () => {
              for (const entry of Object.values(zip.entries())) {
                // let splittedArr = entry.name.split(path.sep);
                if (entry.name == "docker-compose.yml" || entry.name == "docker-compose.yaml") {
                  found.compose = true;
                }
              }
              if (!isError)
                cb(null);
            });
            // Ok, remove the file
          }, (cb) => {
            if (needToRemove)
              fs.unlink(randomPath, cb)
            else cb(null);
          }], (err) => {
            // If something wrong before unlinking, try to unlink by a sync function
            if (err && isStoredZip) {
              try {
                fs.unlinkSync(randomPath);
                callback(err);

              } catch (err2) {
                // Something really wrong happens
                callback(err2)
              }
            }
            // Actually, the only condition is docker-compose
            callback(err, { valid: found.compose, tmpPath: randomPath});
          });
      }
      // // Now we need to analize internal content of files
      // const zip = new StreamZip({

      // })
    }
  });
}

function existLab(repoName, labName, callback) {
  async.waterfall([
    (cb) => config.getMainDir(cb),
    (mainDir, cb) => {
      appUtils.isDSPDir(path.join(mainDir, repoName, labName), (exists) => {
        cb(null, exists);
      })
    }], (err, isDir) => {
      callback(err, isDir);
    });
}

function existLabUser(labName, callback) {
  config.getConfig((err, c) => {
    err ? callback(err) : existLab(c.name, labName, callback);
  })
}

// Mv lab in a temporary directory
function mvLab(labName, tmpName, callback) {
  config.getUserPath((err, up) => {
    if (err) callback(err);
    else fs.rename(path.join(up, labName), path.join(os.tmpdir(), tmpName), callback);
  });
}
function deleteTempLab(tmpName, callback) {
  rimraf(path.join(os.tmpdir(), tmpName), callback);
}

function restoreLab(tmpName, labName, callback) {
  config.getUserPath((err, up) => {
    if (err) callback(err);
    else fs.rename(path.join(os.tmpdir(), tmpName), path.join(up, labName), callback);
  });
}

function renameLab(oldName, newName, cb) {
  // banally return if equal
  if (oldName === newName) {
    cb(null);
  }
  else {
    config.getUserPath((err, up) => {
      const oldPath = path.join(up, oldName);
      const newPath = path.join(up, newName);
      if (err) cb(err);
      else if (!fs.existsSync(oldPath)) {
        cb(new Error(`${oldPath},' doesn't exists!'`));
      } else if (fs.existsSync(newPath)) {
        cb(new Error(`${newPath},' already exists!'`));
      } else {
        fs.rename(oldPath, newPath, (errRename) => {
          if (errRename) cb(errRename);
          else {
            LabStates.editState(path.basename(up), oldName, { labName: newName }, cb);
          }
        });
      }
    });
  }
}

function newLab(name, information, callback) {
  let up = '';
  let userName;
  async.waterfall([

    // Get config userpath
    (cb) => config.getUserPath(cb),

    // Check if a directory exists
    (userPath, cb) => {
      up = userPath;
      userName = path.basename(userPath);
      pathExists(path.join(userPath, name))
        .then((exists) => {
          if (exists) {
            cb(new Error('already exists'));
          } else cb(null);
        });
    },
    // Create directory
    (cb) => {
      fs.mkdir(path.join(up, name), (err) => {
        if (err) cb(err);
        else cb(null);
      });
    },

    // Create identif ier of lab
    (cb) => {
      fs.open(path.join(up, name, '.dsp'), 'wx', (err, fd) => {
        if (err) cb(err);
        else {
          fs.close(fd, (closeErr) => cb(closeErr));
        }
      });
    },

    // Create description file
    (cb) => {
      let infos = {};
      const pathToWrite = path.join(up, name, 'information.json');
      infos.description = '';
      infos.goal = '';
      infos.solution = '';
      infos.description = 'Medium';
      infos.author = userName;
      infos = _.extend(infos, information);

      jsonfile.writeFile(pathToWrite, infos, cb);
    },
    // Create initial state
    (cb) => {
      const repoName = path.basename(up);
      LabStates.newState(repoName, name, 'NO_NETWORK', cb);
    },
    // Create label file
    (cb) => {
      const nameLabel = path.join(up, name, c.config.name_labelfile);
      labelData.initLabels(nameLabel, cb);
    }],
    (err) => {
      callback(err)
    });
}


function newLabFromCompose(nameLab, composeFileStream, override, callback) {
  log.info("[+] In new lab compose");
  let randomName = '';
  let existent;
  let buffers = [];
  let userPath;

  async.waterfall([
    (cb) => config.getUserPath(cb),
    (up, cb) => {
      userPath = up;
      existLabUser(nameLab, cb);
    },
    (exist, cb) => {
      // Store for next functions
      existent = exist;
      if (exist) {
        // If you need to override, rename old project
        if (override) {
          randomName = appUtils.getRandomName();
          mvLab(nameLab, randomName, (err) => {
            // If err, stop, otherwise create new lab
            (err) ? cb(err) : newLab(nameLab, {}, cb);
          });
        } else {
          cb(new Error("Lab already existent"));
        }
        // Ok not exist create
      } else {
        newLab(nameLab, {}, cb);
      }
    }, (cb) => {
      composeFileStream.on('data', (b) => {
        buffers.push(b);
      })
      composeFileStream.on('end', () => {
        const fakeStructure = {
          'networkList': [],
          'canvasJSON': "IMPORTED",
          'clistToDraw': [],
          'clistNotToDraw': []
        };
        const buffer = Buffer.concat(buffers);
        // TBD Check if it is compose
        if (appUtils.isYaml(buffer.toString())) {
          log.info("Is yaml");
          const compose = yaml.safeLoad(buffer.toString());
          networkData.save(nameLab, fakeStructure, buffer.toString(), cb);
        } else {
          // No yaml: is it a zip ? 
          isValidZip(buffer, false, (err, data) => {
            if (err) cb(err)
            else {
              /// Valid Zip, save lab
              if (data.valid) {
                fs.createReadStream(data.tmpPath)
                .pipe(unzipper.Extract({path : path.join(userPath, nameLab)}))
                .on('close', () => {
                  networkData.saveWithoutCompose(nameLab, fakeStructure, cb);
                })
                .on('error', (err) => cb(err));
              }
            }
          });
        }
      });
      // New lab is created, remove random lab
    }, (compose, cb) => {
      if (existent && override)
        deleteTempLab(randomName, cb)
      else cb(null);
    }], (err) => {
      // If already exist, try to restore previous lab
      if (existent && err && override) {
        restoreLab(randomName, nameLab, (err2) => {
          callback(err2);
        })
      }
      callback(err)
    });
}


function deleteLab(name, callback) {
  let userPath;
  async.waterfall([
    (cb) => { config.getUserPath(cb); },
    (up, cb) => {
      userPath = up;
      const toDelete = path.join(userPath, name);
      rimraf(toDelete, cb);
    },
    (cb) => {
      LabStates.exists(path.basename(userPath), name, cb);
    },
    // Remove from table of states only if exists
    (exists, cb) => {
      if (exists) {
        LabStates.removeState(path.basename(userPath), name, cb);
      } else {
        cb(new Error("Lab not exists in state"));
      }
    }
  ],
    (err) => {
      callback(err);
    });
}


function fillDirs(dirs, userPath, callback) {
  // log.info('calling fillDirs')
  const endDirs = [];

  async.each(dirs, (d, innerCallback) => {
    const dd = path.join(userPath, d);
    appUtils.isDSPDir(dd, (isDir) => {
      if (isDir) endDirs.push(d);
      // End callback of item
      innerCallback();
    });
  },
    (err) => {
      if (err) callback(err);
      else {
        callback(null, endDirs);
      }
    });
}

function getDirectories(srcpath) {
  return fs.readdirSync(srcpath)
    .filter(file => fs.statSync(path.join(srcpath, file)).isDirectory());
}

// Get user labs
function getLabs(thePath, callback) {
  const dirs = getDirectories(thePath);
  fillDirs(dirs, thePath, callback);
}


function saveLabels(labName, labels, callback) {
  let userPath = '';
  async.waterfall([
    // Get user path
    (cb) => {
      config.getUserPath((err, up) => {
        if (err) cb(err);
        else {
          userPath = up;
          cb(null);
        }
      });
    },
    (cb) => {
      if (!labels) cb(null);
      // Set the labels
      else {
        // ok create label
        const labelPath = path.join(userPath, labName, 'labels.json');
        // log.info('labels received:')
        // log.info(labels)
        // log.info(labelPath)
        // init label
        labelData.initLabels(labelPath);
        // Create labels
        labelData.createLabels(labelPath, labels.labels, (err) => {
          if (err) cb(err);
          else cb(null, labels);
        });
      }
    }],   // End labels update function
    // final function
    (err, results) => {
      if (err) callback(err);
      else callback(err, results);
    });
}

function saveInformation(name, information, callback) {
  log.info("[Save Information]");
  let userPath;
  // log.info('in save information')
  async.waterfall([

    (cb) => config.getUserPath(cb),
    // Update informatino in labState
    (up, cb) => {
      userPath = up;
      //  const repoName = path.basename(userPath);
      //  LabStates.editState(repoName, name, { repoName, labName: name }, cb);
      cb(null);
    },
    // If user sends readme, update readme
    (cb) => {
      if (information.readme) {
        log.info("[+] Update readme");
        const readmeFile = path.join(userPath, name, 'README.md');
        fs.writeFile(readmeFile, information.readme, cb);
      } else cb(null);
    },
    // Now save here
    (cb) => {
      const informationFile = path.join(userPath, name, 'information.json');
      const author = path.basename(userPath);
      const toSave = information;
      toSave.author = author;
      jsonfile.writeFile(informationFile, toSave, (err) => {
        if (err) cb(err);
        else cb(null, information);
      });
    }],
    (err, results) => {
      if (err) callback(err);
      else callback(err, results);
    });
}


function getInformation(nameRepo, nameLab, callback) {
  let labName = "";
  async.waterfall([
    // Get config userpath
    (cb) => config.getConfig(cb),
    // Read json information file
    (cfile, cb) => {
      labName = path.join(appUtils.getHome(), cfile.mainDir, nameRepo, nameLab);
      const informationFile = path.join(labName, 'information.json');
      jsonfile.readFile(informationFile, cb);
    }, (jsonDescription, cb) => {
      const readmeFile = path.join(labName, 'README.md');
      appUtils.getFile(readmeFile, (err, content) => {
        // Warn that something wrong in the readme
        if (err) {
          log.warn("README does not exist or is not readable");
          cb(null, jsonDescription);
        } else {
          jsonDescription.readme = content.toString();
          cb(null, jsonDescription);
        }
      })
    }
  ],
    (err, jsonDescription) => {
      if (err) callback(err);
      else callback(null, jsonDescription);
    });
}

function getLabUserInformation(nameLab, callback) {
  async.waterfall([
    // Get config userpath
    (cb) => config.getConfig(cb),
    // Read json information file
    (cfile, cb) => {
      const repoName = cfile.name;
      getInformation(repoName, nameLab, cb);
    }], (err, jsonDescription) => {
      if (err) callback(err);
      else callback(null, jsonDescription)
    });
}

exports.newLab = newLab;
exports.existLab = existLab;
exports.existLabUser = existLabUser;
exports.newLabFromCompose = newLabFromCompose;
exports.deleteLab = deleteLab;
exports.saveLabels = saveLabels;
// json file information {description , goal, solution }
exports.renameLab = renameLab;
exports.saveInformation = saveInformation;
exports.getInformation = getInformation;
exports.getLabUserInformation = getLabUserInformation;
exports.getLabs = getLabs;
exports.isValidZip = isValidZip;
