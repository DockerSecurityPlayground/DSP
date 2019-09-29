const dockerJS = require('mydockerjs').docker;
const _ = require('underscore');
const appUtils = require('../util/AppUtils.js');
const log = appUtils.getLogger();
const service_prefix="dsp_hacktool"
const allowedNetworks = ['external', 'public', 'default'];
const routerIDs = ['router', 'firewall'];
const async = require('async');

function parsePorts(ports) {
  const retPorts = []
  _.each(ports, (p) => {
    if(p.IP && p.PrivatePort && p.PublicPort) {
      let portToAdd = `${p.IP}:${p.PrivatePort} => ${p.PublicPort}`;
      retPorts.push(portToAdd);
    }
  });
  return retPorts
}

function getServices(callback) {
  const arrRet = []
  dockerJS.dockerodePS((err, containersObj) => {
    if(err) {
      callback(err);
    } else {
      _.each(containersObj, (c) => {
        if (c.Names[0].slice(1).startsWith(service_prefix)) {
        let objToInsert = {}
        let networkArr = [];
        objToInsert.name = c.Names[0].slice(1);
        objToInsert.id = c.Id;
        objToInsert.image = c.Image;
        objToInsert.command = c.Command;
        objToInsert.ports = parsePorts(c.Ports);
        objToInsert.state = c.State;
        let networks = c.NetworkSettings.Networks;
        _.each(Object.keys(networks), (k) => {
            networks[k].name = k;
            networkArr.push(networks[k]);
          });
        objToInsert.networks = networkArr;
        arrRet.push(objToInsert);
        }
      });
      callback(null, arrRet);
    }
  }, true);
}


function isService(name) {
  return  name.startsWith(service_prefix);
}


function runService(image, name,options, callback) {
  const nameService = `${service_prefix}_${name}`
  // TODO: Check if is existent
  dockerJS.run(image,callback, _.extend({}, {name: nameService},  options))
}

function startService(nameService, callback) {
  if (!isService(nameService)) {
    nameService = `${service_prefix}_${nameService}`;
  }
  dockerJS.start(nameService, callback)
}

function stopService(nameService, callback) {
  if (!isService(nameService)) {
    nameService = `${service_prefix}_${nameService}`;
  }
  dockerJS.stop(nameService, callback)
}
function removeService(nameService, callback) {
  if (!isService(nameService)) {
    nameService = `${service_prefix}_${nameService}`;
  }
  dockerJS.rm(nameService, callback);
}

function isDefaultNetwork(networkName) {
  return networkName.endsWith("default");
}

function _attachUserNetwork(nameService, networkName, callback) {
  async.waterfall([
    // Find a free address
    (cb) => getFreeAddress(networkName, cb),
    // Connect container to free address
    (ip, cb) => dockerJS.connectToNetwork(nameService, networkName, cb, ip)
  ], callback);
  // dockerJS.connectToNetwork(nameContainer, networkName, ip, callback);
}

function attachServiceToNetwork(nameService, networkName, callback) {
  log.info("Attach service to network");
  if (!isService(nameService)) {
    nameService = `${service_prefix}_${nameService}`
  }
  if (isDefaultNetwork(networkName)) {
    log.info("Attach to Default Network");
    dockerJS.connectToNetwork(nameService, networkName, callback);
  } else {
    log.info("Attach to User Network");
    _attachUserNetwork(nameService, networkName, callback);
  }
}

function detachServiceToNetwork(nameService, networkName, callback) {
  if (!isService(nameService)) {
    nameService = `${service_prefix}_${nameService}`
  }
  dockerJS.disconnectFromNetwork(nameService, networkName, callback);
}

function getInfoContainer(nameContainer, callback) {
  dockerJS.getInfoContainer(nameContainer, callback);
}
function isAllowedNetwork(nameLab, networkName) {
  return true;
      // const nameWithoutLabName = networkName.replace(`${nameLab}_`, '');
      // let isAllowed = false;
      // _.each(allowedNetworks, (an) => {
      //   if(nameWithoutLabName.startsWith(an)) {
      //     isAllowed = true;
      //   }
      // });
      // return isAllowed
}

function __getLabNetwork(nameLab, networks) {
  const networksLab = [];
  _.each(networks, (n) => {
    const networkName = n.Name.toLowerCase();
    const ln = nameLab.toLowerCase().replace(/ /g,'');
    if (networkName.startsWith(ln)) {
      if(isAllowedNetwork(ln, networkName)) {
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
  log.info("Get a free address");
  dockerJS.getNetwork(networkName, (err, network) => {
    if (err) {
      callback(err);
    } else {
      freeAddress = _getFreeAddress(network.Containers);
      callback(null, freeAddress);
    }
  });
}

function getNetworksLab(nameLab, callback) {
  let networksLab = [];
  let retNetworks = [];
  async.waterfall([
    (cb) => dockerJS.networkList(cb),
    (obj, cb) => {
      networksLab = __getLabNetwork(nameLab, obj);
      async.eachSeries(networksLab, (n, c) => {
        console.log("NETWORKS");
        console.log(networksLab);
        dockerJS.getNetwork(n.name, (err, theNetwork) => {
          if (err) {
            log.err(err);
            c(err);
          } else {
            const N = n;
            N.containers = theNetwork.Containers;
            // N.isDefault = isDefaultNetwork(n.name);
            retNetworks.push(N);
            c(null);
          }
        });
      }, (err) => cb(err, retNetworks));
    }], (err, networks) => {
      callback(err, networks);
    });
}

  function findRouterIp(nameNetwork, callback) {
    let routerName = '';
    async.waterfall([
    (cb) => dockerJS.getNetwork(nameNetwork, cb),
    // Find the router in the network containers
    (theNetwork, cb) => {
      let theIp;
      log.info("NETWORK");
      if (isDefaultNetwork(nameNetwork)) {
        log.info("DEFAULT NETWORK");
        theIp = theNetwork.IPAM.Config[0].Gateway;
        cb(null, theIp);
      } else if (!theNetwork.Containers) {
        cb(new Error(`No Containers in ${theNetwork}`));
      } else {
        const containers = theNetwork.Containers;
        _.each(containers, (c) => {
          let containerName = c.Name;
          _.each(routerIDs, (rid) => {
            if (containerName.indexOf(rid) !== -1) {
              log.info(`${containerName} is network router! `);
              routerName = containerName;
              theIp = c.IPv4Address.split("/")[0];
            }
          });
        });
        if (routerName === '') {
          try {
            log.warn("No Router, try to set to default gw");
            theIp = theNetwork.IPAM.Config[0].Subnet.split("/")[0];
            // Check if the ip exists
            if (theIp) {
            cb(null, theIp);
            } else {
                cb(new Error("NO ROUTER DEFINED"));
              }
          } catch (e) {
            cb(null, theIp);
            cb(new Error(`${nameNetwork} does not contain routers`));
        }
      }   else {
          cb(null, theIp);
        }
      }
    },
    // Set default router
    (theIp, cb) => {
        cb(null, theIp);
      }], (err, theIp) => {
      callback(err, theIp);
    });
}

function setDefaultGW(nameService, ipRouter, callback) {
  async.waterfall([
    (cb) => {
    log.info(`Execute ip route replace default via ${ipRouter}`);
    dockerJS.exec(nameService, `ip route replace default via ${ipRouter}`, cb)
    }],(err) => callback(err));
}
    // if (err) {
    //   callback(err);
    // } else {
    //   obj = JSON.parse(data)
    //   networksLab = __getLabNetwork(nameLab, obj);
    //   callback(null, networksLab);
    // }
  // });

module.exports = {
  getServices,
  isService,
  startService,
  stopService,
  removeService,
  detachServiceToNetwork,
  attachServiceToNetwork,
  getFreeAddress,
  getNetworksLab,
  findRouterIp,
  runService,
  setDefaultGW
}
