const dockerJS = require('mydockerjs').docker;
const di = require('mydockerjs').imageMgr;
const _ = require('underscore');
const appUtils = require('../util/AppUtils.js');
const log = appUtils.getLogger();
const service_prefix="dsp_hacktool"
const oneline_prefix="dsp_oneline"
const allowedNetworks = ['external', 'public', 'default'];
const routerIDs = ['router', 'firewall'];
const async = require('async');

const DSP_VOLUME_NAME = `dsp_volume`;
const DSP_TARGET_VOLUME_NAME = `/dsp`;

const KALI_SERVICE_IMAGE = "dockersecplayground/kali:latest"
const KALI_SERVICE_NAME = `${service_prefix}_managed_kali`;

const BROWSER_SERVICE_IMAGE = "dockersecplayground/hackbrowser:v1.0"
const BROWSER_SERVICE_NAME = `${service_prefix}_managed_browser`;

const WIRESHARK_SERVICE_NAME = `${service_prefix}_managed_wireshark`;
const WIRESHARK_IMAGE_NAME = "ffeldhaus/wireshark"
const WIRESHARK_VOLUME_NAME = `/home/wireshark`;

const TCPDUMP_SERVICE_NAME = `${service_prefix}_managed_tcpdump`;
const TCPDUMP_IMAGE_NAME = "itsthenetwork/alpine-tcpdump";
const TCPDUMP_CMD = "-i any -s 65535 -w "

const HTTPD_SERVICE_NAME = `${service_prefix}_managed_httpd`;
const HTTPD_SERVICE_IMAGE =  "httpd:2.4"
const HTTPD_VOLUME_NAME =  "/usr/local/apache2/htdocs/"

const HACK_TOOLS_CONFIG_FILE = require('../../config/hack_tools.json');
const hackTools = HACK_TOOLS_CONFIG_FILE.images;

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
function runHttpdService(callback, hostPort, notifyCallback) {
  const ports = {};
  ports["80"] = hostPort;
  
  dockerJS.run(HTTPD_SERVICE_IMAGE, callback, {
    ports:ports,
    detached: true,
    cap_add: "NET_ADMIN",
    volumes: [{
      hostPath: DSP_VOLUME_NAME,
      containerPath: HTTPD_VOLUME_NAME
    }],
    name: HTTPD_SERVICE_NAME,
  });
}

function runWireshark(callback, hostPort, notifyCallback) {
  const ports = {}
  // ports["14500"] = hostPort
  
  dockerJS.run(WIRESHARK_IMAGE_NAME, callback, {
    // ports: ports,
    volumes: [{
      hostPath: DSP_VOLUME_NAME,
      containerPath: WIRESHARK_VOLUME_NAME
    }],
    name: WIRESHARK_SERVICE_NAME,
    cap_add: "NET_ADMIN",
    detached: true,
    networkHost: true,
    environments: [{
      name: "XPRA_PW",
      value: "wireshark"
    }]
  }, notifyCallback);
}

function _getTcpdumpServices(callback) {
  dockerJS.ps((err, services) => {
    if (err) 
      callback(err);
    else {
      services = JSON.parse(services);
      
      const names = services.map((s) => s.Names[0].slice(1)).filter((ss) => ss.startsWith(TCPDUMP_SERVICE_NAME))
      callback(null, names)
    }
  })
}

function _runTcpdump(callback, lab, service, sessionName, notifyCallback) {
  const containerName = `${lab.toLowerCase()}_${service}_1`
  dockerJS.run(TCPDUMP_IMAGE_NAME, callback, {
    name: TCPDUMP_SERVICE_NAME + "_" + service,
    net: `container:${containerName}`,
    rm: true,
    detached: true,
    cmd: `${TCPDUMP_CMD} /dsp/${sessionName}_${service}.pcap`,
    volumes: [{
      hostPath: DSP_VOLUME_NAME,
      containerPath: DSP_TARGET_VOLUME_NAME
    }]


  });
}

function runTcpdump(callback, lab, machinesToBeSniffed, sessionName, notifyCallback) {
  if (!sessionName) {
    const ts = Date.now();
    const date_ob = new Date(ts);
    const date = date_ob.getDate();
    const month = date_ob.getMonth() + 1;
    const year = date_ob.getFullYear();
    const second = date_ob.getMilliseconds();
    sessionName = year + "-" + month + "-" + date + "-" + second;
  }
  const machines = Object.keys(_.omit(machinesToBeSniffed, (v, k, object) => v == false));
  async.each(machines, (m, c) => {
    _runTcpdump(c, lab, m, sessionName, notifyCallback);
  }, (err) => callback(err))
}

function isHttpdServiceInstalled(callback) {
  di.isImageInstalled(HTTPD_SERVICE_IMAGE, callback);
}
function isWiresharkInstalled(callback) {
  di.isImageInstalled(WIRESHARK_IMAGE_NAME, callback);
}
function isTcpdumpInstalled(callback) {
  di.isImageInstalled(TCPDUMP_IMAGE_NAME, callback);
}

function installHttpdService(callback, notifyCallback) {
  di.pullImage(HTTPD_SERVICE_IMAGE, "latest", callback, notifyCallback)
}

function stopHttpdService(callback) {
  dockerJS.rm(HTTPD_SERVICE_NAME, callback, true);
}

function stopKaliService(callback) {
  dockerJS.rm(KALI_SERVICE_NAME, callback, true);
}

function runKaliService(callback) {
  dockerJS.run(KALI_SERVICE_IMAGE, callback, {
    detached: true,
    cap_add: "NET_ADMIN",
    volumes: [{
      hostPath: DSP_VOLUME_NAME,
      containerPath: DSP_TARGET_VOLUME_NAME
    }],
    name: KALI_SERVICE_NAME,
  });
}

function runBrowserService(callback, hostPort) {
  const ports = {}
  ports["5800"] = hostPort
  dockerJS.run(BROWSER_SERVICE_IMAGE, callback, {
    ports: ports,
    detached: true,
    cap_add: "NET_ADMIN",
    shmSize: "2g",
    volumes: [{
      hostPath: DSP_VOLUME_NAME,
      containerPath: DSP_TARGET_VOLUME_NAME
    }],
    name: BROWSER_SERVICE_NAME,
  });
}

function isBrowserServiceRun(callback) {
  dockerJS.isRunning(BROWSER_SERVICE_NAME, (err, isRun) => {
    callback(err, isRun);
 })
}

function isBrowserServiceInstalled(callback) {
  di.isImageInstalled(BROWSER_SERVICE_IMAGE, callback);
}

function stopBrowserService(callback) {
  dockerJS.rm(BROWSER_SERVICE_NAME, callback, true);
}
function installProxyService(callback, notifyCallback) {
  di.pullImage(BROWSER_SERVICE_IMAGE, "v1.0", callback, notifyCallback)
}

function isKaliServiceRun(callback) {
  dockerJS.isRunning(KALI_SERVICE_NAME, (err, isRun) => {
    callback(err, isRun);
 })
}

function isKaliServiceInstalled(callback) {
  di.isImageInstalled(KALI_SERVICE_IMAGE, callback);
}

function installKaliService(callback, notifyCallback) {
  di.pullImage(KALI_SERVICE_IMAGE, "latest", callback, notifyCallback)
}

function installBrowserService(callback, notifyCallback) {
  di.pullImage(BROWSER_SERVICE_IMAGE, "v1.0", callback, notifyCallback)
}

function installWireshark(callback, notifyCallback) {
  di.pullImage(WIRESHARK_IMAGE_NAME, "latest", callback, notifyCallback)
}

function installTcpdump(callback, notifyCallback) {
  di.pullImage(TCPDUMP_IMAGE_NAME, "latest", callback, notifyCallback)
}

function isHttpdServiceRun(callback) {
  dockerJS.isRunning(HTTPD_SERVICE_NAME, (err, isRun) => {
    callback(err, isRun);
 })
}
function isTcpdumpRun(callback) {
  _getTcpdumpServices((err, services) => {
    console.log("Services");
    console.log(services);
    
    
    if (err) 
      callback(err);
    else {
      callback(null, services.length > 0);
      }
  });
}

function stopWireshark(callback) {
  dockerJS.rm(WIRESHARK_SERVICE_NAME, callback, true);
}
function stopTcpdump(callback) {
  _getTcpdumpServices((err, services) => {
    console.log("SERVICES");
    console.log(services);
    
    
    if (err) 
      callback(err);
    else {
      async.each(services, (s, c) => {
        log.info(`Deleting ${s}`);
        dockerJS.rm(s, c, true);
      }, (err) => callback(err))
    }
  })
}

function isWiresharkRun(callback) {
  dockerJS.isRunning(WIRESHARK_SERVICE_NAME, (err, isRun) => {
    callback(err, isRun);
 })
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

function deleteHackTool(name, callback) {
  const hackToolName = `${oneline_prefix}_${name}`;
  async.waterfall([
    (cb) => dockerJS.isRunning(hackToolName, cb),
    (isRunning, cb) => {
      if (isRunning) {
      log.info("Remove hack tool")
      dockerJS.rm(hackToolName, cb, true);
    } else {
      log.info("Hack tool already finished!")
      cb(null)
    }
  }], callback(null))
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

function getImage(name) {
}
function get(name) {
  const ret = _.findWhere(hackTools, {label: name});
  if (!ret)
    throw new Error("Not existent hack tool")
  if (!ret.default_options)
    ret.default_options = {}
  return ret;
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
  stopWireshark,
  stopTcpdump,
  stopHttpdService,
  removeService,
  get,
  // getDefaultOptions,
  detachServiceToNetwork,
  attachServiceToNetwork,
  getFreeAddress,
  getNetworksLab,
  findRouterIp,
  runService,
  setDefaultGW,
  deleteHackTool,
  isWiresharkRun,
  isTcpdumpRun,
  isHttpdServiceRun,
  isWiresharkInstalled,
  isTcpdumpInstalled,
  isHttpdServiceInstalled,
  installWireshark,
  installTcpdump,
  installHttpdService,
  runWireshark,
  runHttpdService,
  runTcpdump,
  isKaliServiceRun,
  isKaliServiceInstalled,
  stopKaliService,
  runKaliService,
  installKaliService,
  installProxyService,  
  isBrowserServiceInstalled,
  isBrowserServiceRun,
  installBrowserService,
  stopBrowserService,
  runBrowserService
}
