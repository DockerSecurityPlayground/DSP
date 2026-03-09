const utils = require('./utils');
const _ = require('underscore');
const http = require('http');

function getRepos(r) {

}
function _manageResponse(err, params, json, callback) {
  try {
    if (err) {
      callback(err);
    } else {
      if (params.onlytagged) {
        json = filterUntagged(json);
      }
      callback(null, json);
    }
  } catch (e) {
    callback(e);
  }
}
// Remove untagged images
function filterUntagged(jsonList) {
  const jsonListParse = JSON.parse(jsonList);
  const jsonRet = [];
  _.each(jsonListParse, (e) => {
    if (e.RepoTags && e.RepoTags[0] !== '<none>:<none>')
      { jsonRet.push(e); }
  });
  return JSON.stringify(jsonRet);
}
const api = {

  getNames: function getNames(callback, paramsInput) {
    this.getJSONList((err, json) => {
      const arr = [];
      if (err)
    { callback(err); }
      else {
        try {
        const data = JSON.parse(json);
        _.each(data, (image) => {
          const rt = image.RepoTags;
          //if (!_.isEmpty(rt) && rt[0]) {
          if (!_.isEmpty(rt)) {
            _.each(rt, (r) => {
              if (r) {
                arr.push(r);
              }
            });
          }
        });
        callback(null, arr);
      } catch (e) {
          callback(e);
        }
      }
    }, paramsInput);
  },
  getDetailedList: function getDetailedList(callback, paramsInput) {
    this.getJSONList((err, json) => {
      const arr = [];
      try {
        const lines = json.split("\n");
        const fixedLines = lines.filter((l) => !l.includes('{"status":'))
        json = fixedLines[0];
        const data = JSON.parse(json);
        _.each(data, (image) => {
          const rt = image.RepoTags;
          if (!_.isEmpty(rt)) {
              _.each(rt, (r) => {
                if (r) {
                const d = { name: r };
                d.labels = {};
                if (!_.isEmpty(image.Labels)) {
                  d.labels = image.Labels;
                }
                if (!_.isEmpty(image.Id)) {
                  d.Id = image.Id;
                }

                arr.push(d);
            }
            })
          }
        });
        callback(err, arr);
      }
      catch (e) {
        callback(e);
      }
    }, paramsInput);
  },
  getJSONList: function getJSONList(callback, paramsInput) {
    const paramsProto = {
      onlytagged: false,
    };


    const params = _.extend({}, paramsProto, paramsInput);
    utils.unixRequest('/images/json', 'GET', (err, json) => {
      try {
      _manageResponse(err, params, json, callback);
      } 
      // Try another time
      catch (e) {
          callback(e)
      }
    });
  },

  removeUntagged: function removeUntagged(callback) {
    utils.cmd('docker rmi $(docker images | grep "^<none>" | awk "{print $3}")', callback);
  },
  buildImage: function buildImage(dockerPath, imageName, callback, notifyCallback) {
    const pid = utils.cmd(`cd ${dockerPath}; docker build -t ${imageName} .`, callback);
    if (notifyCallback && typeof notifyCallback === 'function') {
      utils.docker_stdout(pid, notifyCallback);
    }
    return pid;
  },
  pushImage : function pushImage(name, tag, retCallback, notifyCallback) {
  // const api = `/images/${name}/push?tag=${tag}`
    const pid = utils.cmd(`docker push ${name}:${tag}`, retCallback);
    if (notifyCallback && typeof notifyCallback === 'function') {
      utils.docker_stdout(pid, notifyCallback);
    }
    return pid;
  // utils.unixRequest(api, "POST", retCallback, notifyCallback)
  },
  pullImage : function pullImage(name, tag, retCallback, notifyCallback) {
  const api = `/images/create?fromImage=${name}&tag=${tag}`
  utils.unixRequest(api, "POST", retCallback, notifyCallback)

},
  removeImage : function removeImage(name, tag, callback) {
    utils.cmd(`docker rmi ${name}:${tag}`, callback)
  },
  isImageInstalled: function isImageInstalled(imageName, callback) {
    api.getNames((err, images) => {
      if (err) {
        callback(err);
      }
      else {
        callback(null, _.contains(images, imageName))
      }
    })
  },
  areImagesInstalled: function areImagesInstalled(imagesToSearch, callback) {
    areInstalled = true
    notInstalled = []
    api.getNames((err, images) => {

      if (err) {
        callback(err);
      }
      else {
        _.each(imagesToSearch, (image) => {
          if(!_.contains(images, image)) {
            areInstalled = false
            notInstalled.push(image)
          }
        })
        callback(null, { areInstalled,
            notInstalled
          })
      }
    })
  }
};

module.exports = api;
