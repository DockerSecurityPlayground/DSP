const _ = require('underscore');
const dot = require('dot-object');
const appUtils = require('../util/AppUtils.js');
const path = require('path');
const dockerCapabilities = require('./docker_capabilities.js');

// Return JSON Docker Compose Template
function JDCTemplate() {
  return {
    version: '2',
    services: {},
    networks: {} };
}

function JDCGetContainerNetworks(container) {
  const networks = container.networks;
  const ns = {};
  // Add network to network services {n1 : {} , n2: {}}
  _.each(networks, (nValue, key) => {
    // Only checkeds
    if (nValue.isChecked && !nValue.isDynamic) {
      ns[key] = { ipv4_address: nValue.ip  };
    } else if (nValue.isDynamic) {
      ns[key] = {};
    }
  });
  return ns;
}

function JDCGetPorts(c) {
  const ports = c.ports;
  const ret = [];
  _.each(ports, (pHost, pContainer) => {
    ret.push(`${pHost}:${pContainer}`);
  });
  return ret;
}

function JDCGetEnvironments(container) {
  const ret = [];
  const env = container.environments;
  _.each(env, (ele) => {
    if (ele.name && ele.value && ele.name !== '' && ele.value !== '') {
      ret.push(`${ele.name}=${ele.value}`);
    }
  });

  return ret;
}


function JDCGetDependencies(container) {
  const dependencies = { dependsOn: [], links: [] };
  const ds = container.dependsOn;
  const ls = container.links;
  _.each(ds, (d, k) => {
    // If true
    if (d) dependencies.dependsOn.push(k);
  });
  _.each(ls, (l, k) => {
    // If true
    if (l) dependencies.links.push(k);
  });

  return dependencies;
}


function JDCgetCapabilities(selectedImage) {
  const log = appUtils.getLogger();
  const returnCaps = [];
  if (!selectedImage.labels) {
    return [];
  }
  else {
    // Exclude com.docker and com labels
    const labelKeys = Object.keys(selectedImage.labels);
    labelKeys.forEach((lk) => {
      if (lk.startsWith("com.docker") || lk == "com") {
        delete selectedImage.labels[lk];
      }
    })
    const convertedLabels = dot.object(selectedImage.labels);
    if (convertedLabels && convertedLabels.caps_add) {
      const convertedCaps = convertedLabels.caps_add.split(',');
      convertedCaps.forEach((cap) => {
        const cleanedCap = cap.trim();
        // If is a valid cap add
        if (dockerCapabilities.check(cleanedCap)) {
          returnCaps.push(cleanedCap);
        }
        else log.warn(`${cap} is not a valid cap! No converted`);
      });
      // TBD CHECK OF CAPS
      return returnCaps;
    }
    else return [];
  }
}


function JDCGetServices(containers) {
  const log = appUtils.getLogger();
  const services = {};
  // For each container
  _.each(containers, (container) => {
    const ns = this.JDCGetContainerNetworks(container);
    const containerImage = container.selectedImage;
    const service = {
      image: containerImage.name,
      stdin_open: true,
      tty: true,
    };
    const ports = JDCGetPorts(container);
    const dependencies = JDCGetDependencies(container);

    if (!_.isEmpty(ports)) service.ports = ports;
    // addn etowrks only if ns isn't empty
    if (!_.isEmpty(ns)) service.networks = ns;
    if (!_.isEmpty(dependencies.dependsOn)) service.depends_on = dependencies.dependsOn;
    if (!_.isEmpty(dependencies.links)) service.links = dependencies.links;
    const environments = JDCGetEnvironments(container);
    if (!_.isEmpty(environments)) service.environment = environments;
    // No volume by default in order to support portability
    if (container.volumes && !_.isEmpty(container.volumes)) {
      const volumes = [];
      _.each(container.volumes, (v) => {
        if (v.host && v.container) {
          if (v.host.charAt(0) === '/') {
            volumes.push(`.${path.normalize(v.host)}:${v.container}`);
          }
          else volumes.push(`./${path.normalize(v.host)}:${v.container}`);
        }
        else log.warn('[DOCKER CONVERTER]: Volume to insert but no correct host and container params');
      });
      if (!_.isEmpty(volumes)) service.volumes = volumes;
    }

    // Add  capabilities
    const caps = JDCgetCapabilities(containerImage);
    if (!_.isEmpty(caps)) service.cap_add = caps;
    // Privileged
    if (containerImage.labels && containerImage.labels.privileged) {
      service.privileged = true;
    }
    // Add service
    services[container.name] = service;
  });
  return services;
}

// Get container networks in docker-compose style
function JDCGetNetworks(networkList) {
  const allNetworks = {};
  _.each(networkList, (e) => {
    const subnetString = `${e.subnet}/24`;
    allNetworks[e.name] = {
      ipam: {
        config: [{ subnet: subnetString }] } };
  });
  return allNetworks;
}

// Create a JSON docker-compose object
function JSONDockerComposeConvert(containers, networkList) {
  // create top level
  const object = this.JDCTemplate();
  const services = this.JDCGetServices(containers);
  const networks = this.JDCGetNetworks(networkList);
  object.services = services;
  object.networks = networks;
  return JSON.stringify(object);
}

exports.JDCTemplate = JDCTemplate;
exports.JDCGetContainerNetworks = JDCGetContainerNetworks;
exports.JDCGetServices = JDCGetServices;
// Get container networks in docker-compose style
exports.JDCGetNetworks = JDCGetNetworks;
exports.JSONDockerComposeConvert = JSONDockerComposeConvert;
