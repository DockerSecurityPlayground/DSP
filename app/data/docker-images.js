const dockerImages = require('mydockerjs').imageMgr;
const dot = require('dot-object');
const _ = require('underscore');
const path = require('path');
const jsonfile = require('jsonfile');
const async = require('async');

const pathIcons = 'assets/docker_image_icons/';
const jsonFile = 'images_to_build.json';

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


module.exports = {
  buildImages,
  // Change from data - err to err, data
  // Set icon if labels doesn't contains a correct path
  getListImages: function getListImages(callback) {
    // log.info("in get list images data")
    dockerImages.getDetailedList((err, data) => {
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
        });
        callback(err, images);
      }
    });
  } };
