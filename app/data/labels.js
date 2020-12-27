const async = require('async');
const labsData = require('./labs.js');
const jsonfile = require('jsonfile');
const _ = require('underscore');
const path = require('path');
const AppUtils = require('../util/AppUtils.js');

const ERR_NOT_FOUND = new Error('labels not found');

const log = AppUtils.getLogger();
// It takes jsonArr and a new label and updates jsonArr
function updateLabel(jsonArr, data) {
  let ele = { name: '',
    description: '',
    color: '#056C9F' };
  ele = _.extend({}, ele, data);

  // Name cannot be null
  if (ele.name === '') {
    throw new Error('Name empty');
  }
  else if (typeof ele.name !== 'string') {
    throw new Error('Name is not a string');
  }
  else if (typeof ele.color !== 'string') {
    throw new Error('Color is not a string');
  }
  else if (typeof ele.description !== 'string') {
    throw new Error('Descriptions is not a string');
  }
  const i = _.findIndex(jsonArr, { name: ele.name });
  //  not found : it's a new label
  if (i === -1) {
    jsonArr.push({
      name: ele.name,
      description: ele.description,
      color: ele.color,
    });
  } else {
    jsonArr[i] = {
      name: ele.name,
      description: ele.description,
      color: ele.color,
    };
    // log.info('label found:');
    // log.info(jsonArr[i]);
  }
  // Ok return jsonArr
  return { index: i, arr: jsonArr };
}
//  Init the label file .json into the directory
//  Throw exception on upper layer if some error
const initLabels = function initLabels(labelName, cb) {
  const obj = { labels: [] };
  jsonfile.writeFile(labelName, obj, cb);
};


const existsLabel = function existsLabel(labelname, callback) {
  getLabels(labelname, (err, res) => {
    if (err) {
      console.log(err.toString());
      // Is error label not found? label does not exist return false, otherwise forward error
     (err == ERR_NOT_FOUND) ? callback(null, false) : callback(err);
    } else callback(null, true);
  });
}

//  Get user labels object : {labels : [] }
const getLabels = function getLabels(labelname, callback) {
  log.info(`[DATA get labels of ${labelname}]`);
  async.waterfall([
    // If success open JSON File
    (cb) => jsonfile.readFile(labelname, cb),
  ],
  // Ok it's terminated with an   array of objects
  (err, arrayJSON) => {
    if (!arrayJSON || !arrayJSON.labels) {
      callback(ERR_NOT_FOUND);
    } else callback(err, arrayJSON.labels);
  });
};
// Create more labels  if then it's a lab label editing
// Else it's a repo label edit
const createLabels = function createLabels(labelname, arr, callback) {
  log.info(`[DATA CREATE ${labelname} LABELS]`);
  // console.trace()
  labelname = labelname || '';
  async.waterfall([
    (cb) => jsonfile.readFile(labelname, cb),
    // Now update array
    (jsonObj, cb) => {
      let labArr = jsonObj.labels;
      let alreadyError;
      let updateError;
      // log.info('labels received:');
      // log.info(arr);
      if (arr instanceof Array || arr.labels instanceof Array) {
        const arrToUpdate = (arr.labels instanceof Array) ? arr.labels : arr;
        arrToUpdate.forEach((data) => {
          try {
            const ret = updateLabel(labArr, data);
            labArr = ret.arr;
            const index = ret.index;
            // Check for every lab
            if (index !== -1) {
              // Cannot be possible
              alreadyError = new Error('Label already exists');
            }
          }
          catch (ue) {
            updateError = ue;
          }
        }); // End foreach
        if (alreadyError) cb(alreadyError);
        else if (updateError) cb(updateError);
        else cb(null, labArr);
      } else cb(new Error('Error type: expected Array'));
    },
    // Now write file
    (jsonUpdate, cb) => jsonfile.writeFile(labelname, { labels: jsonUpdate }, cb),
  ],
  (err) => callback(err));
};

const getLabel = function getLabel(labelfile, name, callback) {
  getLabels(labelfile, (err, obj) => {
    if (err) callback(err);
    else {
      const ret = _.last(_.where(obj, { name }));
      callback(err, ret);
    }
  });
};


const _replaceLabel = function _replaceLabel(labelfile, labelname, newLabel, callback) {
  async.waterfall([
    (cb) => existsLabel(labelfile, cb),
    (exists, cb) => {
        (!exists) ? initLabels(labelfile) : {};
        cb(null);
    // Find labels from labelfile
    }, (cb) =>  {
    getLabels(labelfile, (err, json) => {
        if (err) cb(err);
        else cb(null, json);
      });
    },
    // find label
    (json, cb) => {
      // Find label
      const i = _.findIndex(json, { name: labelname });
      // Label is not defined, let's exit
      if (i === -1) cb(null, null);
      else {
        // Replace label
        json[i] = newLabel;
        // Reset labels
        initLabels(labelfile);
        createLabels(labelfile, json, (err) => {
          if (err) cb(err);
          else cb(null, json[i]);
        });
      }
    },
  ],
  (err, results) => {
    if (err)  { 
      callback(err);

    }
    else callback(err, results);
  });
};

// changeLabel function
const changeLabel = function changeLabel(labelfile, labelname, newLabel, callback) {
  let oldLabels;
  let tmpLabelName = "";
  const repodir = path.dirname(labelfile);
  log.info("[DATA Change Label]");
  async.waterfall([
    // Save old labels
    (cb) => AppUtils.storeTmpFile(labelfile, cb),
    (randomName, cb) =>  {
      tmpLabelName = randomName;
      _replaceLabel(labelfile, labelname, newLabel, cb);
    },
    // (cb) => getLabels(labelfile, cb),
    // (labels, cb) => {
    //   oldLabels = labels;
    //   cb(null);
    // },
    // Update repo
    // Find labs
    (results, cb) => labsData.getLabs(repodir, cb),
    // Update for each
    (labs, cb) => {
      // log.info("labs:")
      // log.info(labs)
      async.each(labs, (ele, call) => {
        // get labname
        const labPath = path.join(repodir, ele, 'labels.json');
        _replaceLabel(labPath, labelname, newLabel, call);
      }, (err) => cb(err));
    }], // end waterfall
    (err) => {
       // If some error restore old labels
      if (err) {
        // TBD: Restore other labels in labs
        AppUtils.restoreTmpFile(tmpLabelName, labelfile, callback)
        // callback(err);
      } else callback(null);
    });
};

// If same name overwrites
const createLabel = function createLabel(labelname, data, callback) {
  labelname = labelname || '';
  createLabels(labelname, [data], callback);
};

function _deleteLabel(filename, name, callback) {
  async.waterfall([
    (cb) => getLabels(filename, cb),
    (labArr, cb) => {
      const i = _.findIndex(labArr, { name });
      if (i !== -1) labArr.splice(i, 1);
      cb(null, { labels: labArr });
    },
    // Rewrite
    (labels, cb) => jsonfile.writeFile(filename, labels, cb),
  ],
  (err) => callback(err));
}

const deleteLabel = function deleteLabel(filename, name, isUserRepo, callback) {
  filename = filename || '';
  const repodir = path.dirname(filename);
  // Recursive delete
  if (isUserRepo) {
    async.waterfall([
        // First remove from repo
      (cb) => _deleteLabel(filename, name, cb),
        // Then find labs
      (cb) => labsData.getLabs(repodir, cb),
      // Remove for each
      (labs, cb) => {
        async.each(labs, (ele, call) => {
          // get labname
          const labPath = path.join(repodir, ele, 'labels.json');
          _deleteLabel(labPath, name, call);
        },
        (err) => cb(err));
      },
    // End remove for each
    ], // end waterfall
    (err) => callback(err));
  // Simply remove label from lab
  } else _deleteLabel(filename, name, callback);
};

exports.initLabels = initLabels;
exports.deleteLabel = deleteLabel;
exports.getLabels = getLabels;
exports.getLabel = getLabel;
exports.existsLabel = existsLabel;
exports.changeLabel = changeLabel;
exports.createLabel = createLabel;
exports.createLabels = createLabels;
exports.version = '0.1.0';