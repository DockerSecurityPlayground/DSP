const dockerJS = require('mydockerjs').docker;
const _ = require('underscore');
const appUtils = require('../util/AppUtils.js');
const log = appUtils.getLogger();
const service_prefix="dsp_hacktool"
const allowedNetworks = ['external', 'public', 'default'];

function getServices(callback) {
  const arrRet = []
  dockerJS.ps((err, containersJSON) => {
    if(err) {
      callback(err);
    } else {
      containersObj = JSON.parse(containersJSON);
      _.each(containersObj, (c) => {
        let objToInsert = {}
        objToInsert.name = c.Names[0].slice(1);
        objToInsert.id = c.Id;
        arrRet.push(objToInsert)
      });
      callback(null, arrRet);
    }
  }, true)
}
function startService(name, callback) {
  const nameService = `${service_prefix}_${name}`
  dockerJS.start(nameService, callback)
}

function stopService(name, callback) {
  const nameService = `${service_prefix}_${name}`
  dockerJS.stop(nameService, callback)
}

function runService(image, name,options, callback) {
  const nameService = `${service_prefix}_${name}`
  // TODO: Check if is existent
  dockerJS.run(image,callback, _.extend({}, {name: nameService},  options))
}

function attachServiceToNetwork(nameContainer, networkName, callback) {
  const nameService = `${service_prefix}_${nameContainer}`
  dockerJS.connectToNetwork(nameContainer, networkName, callback);
}
function detachServiceToNetwork(nameContainer, networkName, callback) {
  const nameService = `${service_prefix}_${nameContainer}`
  dockerJS.disconnectFromNetwork(nameContainer, networkName, callback);
}

function getInfoContainer(nameContainer, callback) {
  dockerJS.getInfoContainer(nameContainer, callback);
}
function isAllowedNetwork(nameLab, networkName) {
      const nameWithoutLabName = networkName.replace(`${nameLab}_`, '');
      let isAllowed = false;
      _.each(allowedNetworks, (an) => {
        if(nameWithoutLabName.startsWith(an)) {
          isAllowed = true;
        }
      });
      return isAllowed
}

function __getLabNetwork(nameLab, networks) {
  const networksLab = [];
  _.each(networks, (n) => {
    if (n.Name.startsWith(nameLab)) {
      if(isAllowedNetwork(nameLab, n.Name)) {
      networksLab.push({
        name: n.Name,
        id: n.Id,
        containers: n.Containers
        })
      }
    }
  });
  return networksLab;
}
//
// Only 16 and 24 are supported
function _generateSubnet(ipvaddress) {
  const splitted = ipvaddress.split("/");
  const subnet = splitted[1];
  let address = splitted[0];
  const retAddresses = [];
  if (subnet ==  16) {
    let lip = address.lastIndexOf(".");
    let networkBase = address.substr(0, lip);
    lip = networkBase.lastIndexOf(".");
    networkBase = networkBase.substr(0, lip);
    for (i = 2; i <= 255; i++) {
      for (j = 2; j <= 255; j++) {
        retAddresses.push(`${networkBase}.${i}.${j}`);
      }
    }
  } else if (subnet ==  24) {
    let lip = address.lastIndexOf(".");
    let networkBase = address.substr(0, lip);
    for (i = 2; i <= 255; i++) {
        retAddresses.push(`${networkBase}.${i}`);
      }
    }
  return retAddresses;
}

function _getFreeAddress(containers) {
  log.info("Search a free address");
  const busyAddresses = [];
  let retAddress = '';
  let allAddresses = [];
  _.each(containers, (containerInfo) => {
    if (containerInfo.IPv4Address) {
      if (allAddresses.length == 0)
        allAddresses = _generateSubnet(containerInfo.IPv4Address)
      // 172.19.0.2/16
      splitted = containerInfo.IPv4Address.split("/")
      busyAddresses.push(splitted[0]);
    }
  });
  _.some(allAddresses, (a) => {
    if (!_.contains(busyAddresses, a)) {
      log.info(`${a} is free`);
      retAddress = a;
      return true;
    }
  });
  return retAddress
}

function getFreeAddress(networkName, callback) {
  dockerJS.getNetwork(networkName, (err, data) => {
    if (err) {
      callback(err);
    } else {
      const network = JSON.parse(data)
      freeAddress = _getFreeAddress(network.Containers);
      callback(null, freeAddress);
    }
  });
}

function getNetworksLab(nameLab, callback) {
  let networksLab = [];
  dockerJS.networkList((err, data) => {
    if (err) {
      callback(err);
    } else {
      obj = JSON.parse(data)
      networksLab = __getLabNetwork(nameLab, obj);
      _.each(networksLab, (n) => {
      })
    }
  });
}



module.exports = {
  getServices,
  startService,
  stopService,
  detachServiceToNetwork,
  attachServiceToNetwork,
  getFreeAddress,
  getNetworksLab,
  runService
}
