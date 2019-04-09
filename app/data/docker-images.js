const dockerImages = require('mydockerjs').imageMgr;
const dot = require('dot-object');
const _ = require('underscore');
const path = require('path');
const jsonfile = require('jsonfile');
const async = require('async');
const Walker = require('walker');
const homedir = require('homedir');
const configData = require('./config.js');
const pathIcons = 'assets/docker_image_icons/';
const pathExists = require('path-exists');
const jsonFile = 'images_to_build.json';
const networkManager = require('./network.js')
const AppUtils = require('../util/AppUtils');
const log = AppUtils.getLogger();

function getRepoImagePath(namerepo, callback) {
  async.waterfall([
    (cb) => configData.getConfig(cb),
    (config, cb) => {
      const ps = path.join(homedir(), config.mainDir, namerepo, '.docker-images')
      pathExists(ps)
        .then((exists) => {
          if (exists) {
            cb(null, ps);
          }
          else {
            cb(new Error("image path file does not exists!"), null);
          }
        })
    }
  ],
  (err, results) => {
    if (err) { callback(err); } else callback(null, results);
  });
}

function getRepoImages(namerepo, callback) {
  async.waterfall([
    (cb) => getRepoImagePath(namerepo,cb),
    (imagePath, cb) => {
      imageListFile = path.join(imagePath, 'image_list.json')
      jsonfile.readFile(imageListFile, cb)
    }
  ],
  (err, results) => {
    if (err) { callback(err); } else callback(null, results);
  });
}

function getRepoImageNames(namerepo, callback) {
  arr = []
  getRepoImages(namerepo, (err, res) => {
    if (err) {
      callback(err,null)
    }
    else {
      _.each(res, (image) => {
        arr.push(image.image_name)
      })
      callback(null, arr)
    }
  })
}
function containsRepoImage(namerepo, nameimage, callback) {
  let imagePath = ""
  async.waterfall([
      (cb) => getRepoImagePath(namerepo, cb),
      (ip, cb) => {
        imagePath = ip
        getRepoImages(namerepo, cb)
      },
      (images, cb) => {
        imageName = _.where(images, {
          image_name:nameimage
          })
        cb(null, imageName.length != 0)
      }
  ], (err, data) => { callback(err, data); })
}

function buildImage(namerepo, nameimage, callback, notifyCallback) {
  let imagePath = ""
  async.waterfall([
      (cb) => getRepoImagePath(namerepo, cb),
      (ip, cb) => {
        imagePath = ip
        getRepoImages(namerepo, cb)
      },
      (images, cb) => {
        imageName = _.where(images, {
          image_name:nameimage
          })
        if (imageName.length == 0) {
          cb(new Error(`Image ${nameimage} does not exists`))
        }
        else {
          image = imageName[0]
          pathDockerfile = path.join(imagePath, image.image_path)
          dockerImages.buildImage(pathDockerfile, image.image_name, cb, notifyCallback)
        }
      }
  ], (err) => { callback(err); })
}


// buildImage : function buildImage(dockerPath, imageName, callback) {
function buildImages(thepath, callback, notifyBuild) {
  const pathJSON = path.join(thepath, jsonFile);
  jsonfile.readFile(pathJSON, (err, data) => {
    if (err) callback(err);
    else {
      async.eachSeries(data.images, (item, cb) => {
        const p = item.path;
        const imageName = item.imageName;
        dockerImages.buildImage(path.join(thepath, p), imageName, (errBuild, images) => {
          if (errBuild) cb(errBuild);
          else {
            if (notifyBuild && typeof notifyBuild === 'function') {
              notifyBuild(images);
            }
            cb(null);
          }
        });
      },
      (errAsync) => callback(errAsync));
    }
  });
}
function getCurrentImages(labImages, images) {
  retImages =  []
  ims = images.map(i => i.name)
  _.each(labImages, function(i) {
      newI = {}
      newI.name = i
      newI.contains = _.contains(ims, i) ? true : false;
      retImages.push(newI);
})
  return retImages
}

// Take images of a lab from a network.json
function getImagesLabNames(reponame, labname, callback) {
  let listIms = []
  let arrRet = []
  // Get network.json
  networkManager.get(reponame, labname, (err, data) => {
    if (err) {
        callback(err)
      } else {
        // Get images
        _.each(data.clistToDraw, (ele) => {
          listIms.push(ele.selectedImage.name)
        })
        callback(null, listIms)
      }
    })
}

function getImagesLab(reponame, labname, allImages, callback) {
  let listIms = []
  let arrRet = []
  networkManager.get(reponame, labname, (err, data) => {
    if (err) {
        callback(err)
      } else {
        // Get images
        _.each(data.clistToDraw, (ele) => {
          listIms.push(ele.selectedImage.name)
        })
        arrRet = getCurrentImages(listIms, allImages)
        callback(null, arrRet)
      }
    })
  }
function _isRepoPath(thePath) {
  return (path.basename(thePath) !== ".data" &&
          path.basename(thePath) !== ".docker-images" &&
          path.basename(thePath) !== ".git"
      );
}
function getImagesAllLabs(namerepo, callback) {
  log.info("[Docker Images] Get Images All Labs");
  let images = [];
  let lab_images = [];
  let allImages = [];
  log.info("[Docker Images] Get All Images");
  async.waterfall([
    (cb) => getListImages(cb),
    (ims, cb) => {
      allImages = ims;
      configData.getConfig(cb)
    },
    (config, cb) => {
      const ps = path.join(homedir(), config.mainDir, namerepo);
      cb(null, ps);
    },
    (pathRepo, cb) => {
      pathExists(pathRepo).then(ex => {
        if (!ex) cb(new Error(`${pathRepo} does not exists`));
        else {
          cb(null, pathRepo);
        }
      });
    },
    // Get repo paths
    (pathRepo, cb) => {
      let labsPath = [];
      Walker(pathRepo)
        .filterDir((dir, stat) => {
          // Only one subdir
          const re = new RegExp(`${pathRepo}/?([^/]+/?){0,1}$`);
          return (re.test(dir));
        })
        .on('dir', (dir, stat) => {
          if (dir !== pathRepo && _isRepoPath(dir)) {
            labsPath.push(dir);
          }
        })
        .on('error', (err, entry, stat) => {
          cb(err);
        })
        .on('end', () => {
          cb(null, labsPath);
        });
    },
    (labsPath, cb) => {
      async.each(labsPath, (lb, c) => {
        log.info(`[Docker Images] Get Lab ${path.basename(lb)} Images`);

        getImagesLab(namerepo, path.basename(lb), allImages, (err, data) => {
          if (err) {
            // Do not block other images
            log.error(`${path.basename(lb)} Lab has not network.json file!`);
            data = [];
          }
           let nameLab = path.basename(lb)
           lab_images.push({
               nameLab : nameLab,
               images : data
           })
        images = _.union(images, data);
           c(null);
        });
      }, cb);
    }
  ], (err) => {
      if (err) {
        callback(err);
      } else {
        callback(null, {
            lab_images,
            images
        });
      }
    });
  }
function areImagesInstalled(labImages, callback) {
  let images = []
  _.each(labImages, (li) => {
    images.push(li.name);
  });
  dockerImages.areImagesInstalled(images, callback);
}
function getImagesAllRepos(callback) {
  let repoImages = {};
  let repoPaths = [];

  async.waterfall([
    (cb) => configData.getConfig(cb),
    (config, cb) => {
      const ps = path.join(homedir(), config.mainDir);
      cb(null, ps);
    },
    (mainDirPath, cb) => {
      repoPaths = [];
      Walker(mainDirPath)
        .filterDir((dir, stat) => {
          // Only one subdir
          const re = new RegExp(`${mainDirPath}/?([^/]+/?){0,1}$`);
          return (re.test(dir));
        })
        .on('dir', (dir, stat) => {
          if (dir !== mainDirPath) {
            AppUtils.isDSPDir(dir, (isDSP) => {
              if(isDSP) {
                repoPaths.push(dir);
              }
            })
          }
        })
        .on('error', (err, entry, stat) => {
          cb(err);
        })
        // Ok all paths
        .on('end', () => {
            async.eachSeries(repoPaths, (r, c) => {
              let rb = path.basename(r);
              log.info(`[Docker Images] Find ${rb} repository`);
              getImagesAllLabs(rb, (err, images) => {
                if(err) {
                  log.error(err);
                  c(err);
                } else {
                  repoImages[rb] = images;
                  c(null);
                }
              })
          }, (err) => {
            cb(err, repoImages);
          });
        });
      }], (err, repoImages) => callback(err, repoImages));
}

function getListImages(callback) {
    // log.info("in get list images data")
    dockerImages.getDetailedList((err, data, completeDescription) => {
      if (err) {
        callback(err);
      } else {
        // Set icons
        let images = data;
        // Remove untagged images
        images = _.filter(images, (e) => {
          const ret = !(e.name === '<none>:<none>');
          return ret;
        });
        _.each(images, (ele) => {
          try {
            const convertedLabels = dot.object(ele.labels);
            if (convertedLabels.type) {
              switch (convertedLabels.type) {
                case 'server' : convertedLabels.icon = `${pathIcons}server.png`;
                  break;
                case 'entry_point' : convertedLabels.icon = `${pathIcons}entry_point.png`;
                  break;

                case 'host' : convertedLabels.icon = `${pathIcons}host.png`;
                  break;

                case 'router' : convertedLabels.icon = `${pathIcons}router.png`;
                  break;
                default:
                  convertedLabels.icon = `${pathIcons}host.png`;
                  break;
              }
          }

          const pathIcon = `${pathIcons}host.png`;
          if (!convertedLabels.icon) convertedLabels.icon = pathIcon;
          // ports conversion
          if (convertedLabels.ports) {
            const portsToConvert = `[  ${convertedLabels.ports} ]`;
            ele.exposedPorts = JSON.parse(portsToConvert);
          }

          // Action conversion
          if (convertedLabels.actions) {
            ele.actions = convertedLabels.actions;
            // Add name to keys
            _.each(ele.actions, (v, k) => {
              v.name = k;
            });
            // Set default selectedAction
            // ele.selectedAction = ele.actions[_.keys(ele.actions)[0]]
          }
          ele.icon = convertedLabels.icon;
        }
          // Some images could not properly be converted by dot notation
          catch (labelError) {
            ele.icon = `${pathIcons}host.png`;
          }
        });
        callback(err, images);
      }
    });
}

module.exports = {
  buildImages,
  getRepoImages,
  getRepoImages,
  getImagesLab,
  getImagesLabNames,
  getImagesAllLabs,
  getImagesAllRepos,
  areImagesInstalled,
  // Change from data - err to err, data
  // Set icon if labels doesn't contains a correct path
  getListImages
};
