const dockerImages = require('./docker-images.js');
const _ = require('underscore');
const appUtils = require('../util/AppUtils');
const log = appUtils.getLogger();

function findContainerImage(allImages, selectedImage) {
  return _.findWhere(allImages, { name: selectedImage.name });
}

function getUpdatedCommand(currentAction, imageActions) {
  // Find updated actions
  const updatedAction = _.findWhere(imageActions, { name: currentAction.name });
  if (updatedAction && updatedAction.command) {
    return updatedAction.command;
  }
  else return "IMAGE_ERROR";

}
function getBackgroundMode(currentAction, imageActions) {
  const updatedAction = _.findWhere(imageActions, { name: currentAction.name });
  if (updatedAction && updatedAction.backgroundMode) return true;
    else return false;
}

exports.getActionsSync = (clistToDraw) => {
  const actions = [];
  // Get the actions
  // For each container
  _.each(clistToDraw, (ele) => {
    const cname = ele.name;
    const cActions = ele.actions;
    if (cActions) {
      // For each action in actions of container
      _.each(cActions, (a) => {
        const aa = _.extend({}, a, { cname });
        // Add to all actions
        actions.push(aa);
      });
    }
  });
  return _.sortBy(actions, 'priority');
};


exports.getActions = (clistToDraw, cb) => {
  let actionError;
  dockerImages.getListImages((err, images) => {
    if (err) cb(err);
    else {
      const actions = [];
      // Get the actions
      // For each container
      _.each(clistToDraw, (ele) => {
        const cname = ele.name;
        const cActions = ele.actions;
        // Get updated image
        const updatedImage = findContainerImage(images, ele.selectedImage);
        if (!updatedImage) {
          cb(new Error('Container has an image that doesn\'t exists in current docker images!'));
        }
        else if (cActions) {
          // For each action in actions of container
          _.each(cActions, (a) => {
            const aa = _.extend({}, a, { cname });
            aa.command = getUpdatedCommand(aa, updatedImage.actions);
	    if (aa.command == "IMAGE_ERROR") {
		      throw new Error(`Cannot find ${aa.name} action in ${updatedImage.name} image!`);
	    }

            aa.backgroundMode = getBackgroundMode(aa, updatedImage.actions);
            if (!aa.command) {
              actionError = new Error(`Cannot find ${aa.name} action in ${updatedImage.name} image!`);
            }
            // Add to all actions
            actions.push(aa);
          });
        }
      });
      if (actionError) cb(actionError);
      else cb(null, _.sortBy(actions, 'priority'));
    }
  });
};
function getArg(key, arg) {
  let flag;
   // Arg escaping
  arg.val = arg.val.replace(/[\\$'"]/g, '\\$&');
  // Check if is a long opt or a normal opt
  if (key.length === 1) {
    flag = '-';
  }
  else flag = '--';
  // If isn't boolean it's a text argument
  if (arg.type !== 'boolean') {
    return `${flag}${key} '${arg.val}' `;
  }
  // Boolean argument
  else return (arg.val === 'true') ? `${flag}${key} ` : ' ';
}

exports.getComposeOptions = function getComposeOptions(clistToDraw) {
  let options = "";
  _.each(clistToDraw, (c) => {
    // --scale <name_service>=N)
    if (c.scale && c.scale.isEnabled && c.scale.num) {
      log.info(`[Docker-compose option] Scale option  for service ${c.name} (num)= ${c.scale.num}`);
      options += ` --scale ${c.name}=${c.scale.num}`
    }
  });
  return options;
};

function _getCTFCommand(a) {
  const ctf = a.args["ctf"].val;
  const thePath = (a.args["username"].val == "root") ? "/root/proof.txt" : "/home/"+ a.args["username"].val + "/proof.txt";
  const command = `echo "${ctf}" > ${thePath}`;
  return `/bin/sh -c "${command} "`;
}

function _getExecCommand(a) {
  const command = a.args["command"].val;
  return `/bin/sh -c "${command} "`;
}

// function _getUsernameCommand(a) {
//   const name = a.args["name"].val;
//   const password = a.args["password"].val;
//   const command = `mkdir /home/${name}; adduser  ${name} ; echo ${name}:${password} | chpasswd`;
//   return `/bin/sh -c "${command} "`;

// }
function _getLabelCommand(a) {
  const args = a.args;
  let strArgs = '';
  // Concatenate arguments
  _.each(args, (arg, key) => {
//    log.info("key:"+key)
//  log.info("arg:"+arg)
    // strArgs += `${flag}${key} '${arg.val}' `;
    strArgs += getArg(key, arg);
  });
  const command = `${a.command} ${strArgs}`;
  // Default Interpreter
  return `/bin/sh -c "${command} "`;
}

exports.getCommand = function getCommand(a) {
  let commandRet;
  switch (a.name) {
    case "ctf":
      commandRet = _getCTFCommand(a);
      break;
    case "exec":
      commandRet = _getExecCommand(a);
      break;
    default:
      commandRet = _getLabelCommand(a);
      break;
  }
  return commandRet;
};
