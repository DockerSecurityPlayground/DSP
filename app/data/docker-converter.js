const _ = require('underscore');
const dot = require('dot-object');
const appUtils = require('../util/AppUtils.js');
const path = require('path');
const yaml = require('js-yaml');
const dockerCapabilities = require('./docker_capabilities.js');

// Return JSON Docker Compose Template
function JDCTemplate() {
  // Note: 'version' field is obsolete in Docker Compose v2.x and removed to avoid warnings
  return {
    services: {},
    networks: {} };
}

function _parseComposeInput(composeInput) {
  if (!composeInput) {
    return {};
  }
  if (typeof composeInput === 'string') {
    return yaml.load(composeInput) || {};
  }
  return composeInput;
}

function _normalizeIPv4Network(ip) {
  const octets = String(ip || '').split('.');
  if (octets.length !== 4) {
    return '';
  }
  octets[3] = '0';
  return octets.join('.');
}

function _resolveComposeSubnet(networkDef, staticIps, fallbackIndex) {
  const subnet = networkDef
    && networkDef.ipam
    && Array.isArray(networkDef.ipam.config)
    && networkDef.ipam.config[0]
    && networkDef.ipam.config[0].subnet;

  if (typeof subnet === 'string' && subnet.trim() !== '') {
    const [ip] = subnet.split('/');
    return _normalizeIPv4Network(ip);
  }

  if (staticIps && staticIps.length > 0) {
    return _normalizeIPv4Network(staticIps[0]);
  }

  return `193.20.${fallbackIndex}.0`;
}

function _generateNetworkList(guiSubnet) {
  const base = String(guiSubnet || '').split('.');
  if (base.length !== 4) {
    return [];
  }
  return _.range(2, 256).map((hostOctet) => `${base[0]}.${base[1]}.${base[2]}.${hostOctet}`);
}

function _parsePortsFromCompose(servicePorts) {
  const ports = {};
  _.each(servicePorts || [], (portDef) => {
    if (typeof portDef === 'number') {
      ports[String(portDef)] = String(portDef);
      return;
    }

    if (typeof portDef === 'object' && portDef !== null) {
      if (portDef.target != null && portDef.published != null) {
        ports[String(portDef.target)] = String(portDef.published);
      }
      return;
    }

    if (typeof portDef !== 'string') {
      return;
    }

    const sanitized = portDef.split('/')[0];
    const segments = sanitized.split(':');
    if (segments.length === 1) {
      ports[segments[0]] = segments[0];
      return;
    }

    const containerPort = segments[segments.length - 1];
    const hostPort = segments[segments.length - 2];
    if (containerPort && hostPort) {
      ports[String(containerPort)] = String(hostPort);
    }
  });
  return ports;
}

function _parseEnvironmentsFromCompose(serviceEnvironment) {
  const environments = [];

  if (Array.isArray(serviceEnvironment)) {
    _.each(serviceEnvironment, (envDef) => {
      if (typeof envDef === 'string') {
        const separatorIndex = envDef.indexOf('=');
        if (separatorIndex !== -1) {
          environments.push({
            name: envDef.substring(0, separatorIndex),
            value: envDef.substring(separatorIndex + 1)
          });
        } else if (envDef) {
          environments.push({ name: envDef, value: '' });
        }
      } else if (envDef && typeof envDef === 'object') {
        _.each(envDef, (value, key) => {
          environments.push({ name: key, value: value == null ? '' : String(value) });
        });
      }
    });
    return environments;
  }

  _.each(serviceEnvironment || {}, (value, key) => {
    environments.push({ name: key, value: value == null ? '' : String(value) });
  });

  return environments;
}

function _parseVolumesFromCompose(serviceVolumes) {
  const volumes = [];
  _.each(serviceVolumes || [], (volumeDef) => {
    if (typeof volumeDef === 'string') {
      const parts = volumeDef.split(':');
      if (parts.length >= 2) {
        volumes.push({
          host: parts[0],
          container: parts[1]
        });
      }
      return;
    }

    if (volumeDef && typeof volumeDef === 'object' && volumeDef.source && volumeDef.target) {
      volumes.push({
        host: volumeDef.source,
        container: volumeDef.target
      });
    }
  });
  return volumes;
}

function _parseComposeDependencyList(value) {
  const dependencies = {};
  if (Array.isArray(value)) {
    _.each(value, (dependencyName) => {
      dependencies[dependencyName] = true;
    });
    return dependencies;
  }

  _.each(value || {}, (dependencyDef, dependencyName) => {
    if (dependencyDef === false) {
      return;
    }
    dependencies[dependencyName] = true;
  });

  return dependencies;
}

function _serviceNetworkEntries(service) {
  if (!service || !service.networks) {
    return {};
  }

  if (Array.isArray(service.networks)) {
    const entries = {};
    _.each(service.networks, (networkName) => {
      entries[networkName] = {};
    });
    return entries;
  }

  return service.networks;
}

function _isKeepAliveEntrypoint(entrypoint) {
  if (!entrypoint) {
    return false;
  }

  if (typeof entrypoint === 'string') {
    return entrypoint.indexOf('tail') !== -1 && entrypoint.indexOf('/dev/null') !== -1;
  }

  if (Array.isArray(entrypoint)) {
    return entrypoint.join(' ').indexOf('tail -f /dev/null') !== -1;
  }

  return false;
}

function _collectComposeNetworkNames(services, networks) {
  const names = {};

  _.each(networks || {}, (networkDef, networkName) => {
    names[networkName] = true;
  });

  _.each(services || {}, (serviceDef) => {
    _.each(_serviceNetworkEntries(serviceDef), (networkConfig, networkName) => {
      names[networkName] = true;
    });
  });

  return _.keys(names);
}

function _collectStaticIpsByNetwork(services) {
  const ipsByNetwork = {};
  _.each(services || {}, (serviceDef) => {
    _.each(_serviceNetworkEntries(serviceDef), (networkConfig, networkName) => {
      if (networkConfig && networkConfig.ipv4_address) {
        if (!ipsByNetwork[networkName]) {
          ipsByNetwork[networkName] = [];
        }
        ipsByNetwork[networkName].push(networkConfig.ipv4_address);
      }
    });
  });
  return ipsByNetwork;
}

function ComposeDockerConvert(composeInput) {
  const compose = _parseComposeInput(composeInput);
  const services = compose.services || {};
  const networks = compose.networks || {};
  const staticIpsByNetwork = _collectStaticIpsByNetwork(services);
  const allNetworkNames = _collectComposeNetworkNames(services, networks);

  const networkList = _.map(allNetworkNames, (networkName, index) => {
    const guiSubnet = _resolveComposeSubnet(networks[networkName], staticIpsByNetwork[networkName], index + 1);
    const listIP = _generateNetworkList(guiSubnet);

    _.each(staticIpsByNetwork[networkName] || [], (ip) => {
      if (_normalizeIPv4Network(ip) === guiSubnet) {
        const ipIndex = listIP.indexOf(ip);
        if (ipIndex !== -1) {
          listIP.splice(ipIndex, 1);
        }
      }
    });

    return {
      name: networkName,
      subnet: guiSubnet,
      color: 'black',
      listIP: listIP
    };
  });

  const clistToDraw = _.map(services, (serviceDef, serviceName) => {
    const containerNetworks = {};
    _.each(_serviceNetworkEntries(serviceDef), (networkConfig, networkName) => {
      const staticIp = networkConfig && networkConfig.ipv4_address ? networkConfig.ipv4_address : '';
      containerNetworks[networkName] = {
        ip: staticIp,
        isChecked: true,
        position: 'right',
        isVisible: true,
        isDynamic: !staticIp
      };
    });

    return {
      name: serviceName,
      selectedImage: { name: serviceDef && serviceDef.image ? serviceDef.image : '' },
      ports: _parsePortsFromCompose(serviceDef && serviceDef.ports),
      actions: [],
      volumes: _parseVolumesFromCompose(serviceDef && serviceDef.volumes),
      filesToCopy: [],
      networks: containerNetworks,
      environments: _parseEnvironmentsFromCompose(serviceDef && (serviceDef.environment || serviceDef.environments)),
      dependsOn: _parseComposeDependencyList(serviceDef && serviceDef.depends_on),
      links: _parseComposeDependencyList(serviceDef && serviceDef.links),
      isShellEnabled: true,
      keepAlive: _isKeepAliveEntrypoint(serviceDef && serviceDef.entrypoint)
    };
  });

  return {
    networkList: networkList,
    canvasJSON: 'IMPORTED',
    clistToDraw: clistToDraw,
    clistNotToDraw: []
  };
}

function mergeComposeData(existingCompose, graphCompose, options) {
  const existing = existingCompose || {};
  const graph = graphCompose || {};
  const mergeOptions = options || {};
  const graphControlledServiceFields = [
    'image',
    'stdin_open',
    'tty',
    'entrypoint',
    'ports',
    'networks',
    'depends_on',
    'links',
    'environment',
    'volumes',
    'cap_add',
    'privileged'
  ];

  const merged = _.extend({}, existing, graph);

  const existingServices = existing.services || {};
  const graphServices = graph.services || {};
  const serviceNames = mergeOptions.serviceNames || _.keys(graphServices);
  const mergedServices = {};
  _.each(serviceNames, (serviceName) => {
    if (graphServices[serviceName]) {
      mergedServices[serviceName] = _.extend(
        {},
        _.omit(existingServices[serviceName] || {}, graphControlledServiceFields),
        graphServices[serviceName]
      );
    } else if (existingServices[serviceName]) {
      mergedServices[serviceName] = _.extend({}, existingServices[serviceName]);
    }
  });
  merged.services = mergedServices;

  const existingNetworks = existing.networks || {};
  const graphNetworks = graph.networks || {};
  const networkNames = mergeOptions.networkNames || _.keys(graphNetworks);
  const mergedNetworks = {};
  _.each(networkNames, (networkName) => {
    if (graphNetworks[networkName]) {
      mergedNetworks[networkName] = _.extend({}, existingNetworks[networkName] || {}, graphNetworks[networkName]);
    } else if (existingNetworks[networkName]) {
      mergedNetworks[networkName] = _.extend({}, existingNetworks[networkName]);
    }
  });
  merged.networks = mergedNetworks;

  return merged;
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

function JDCResolveContainerImage(container) {
  const selectedImage = container && container.selectedImage;
  const imageRef = container && container.image;

  if (typeof selectedImage === 'string' && selectedImage.trim() !== '') {
    return selectedImage;
  }
  if (selectedImage && selectedImage.name) {
    if (selectedImage.tag) {
      return `${selectedImage.name}:${selectedImage.tag}`;
    }
    return selectedImage.name;
  }
  if (typeof imageRef === 'string' && imageRef.trim() !== '') {
    return imageRef;
  }
  return null;
}


function JDCgetCapabilities(selectedImage) {
  const log = appUtils.getLogger();
  const returnCaps = [];
  if (!selectedImage || !selectedImage.labels) {
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
    if (!container || !container.name) {
      log.warn('[DOCKER CONVERTER]: skipping invalid container without name');
      return;
    }
    const ns = this.JDCGetContainerNetworks(container);
    const imageName = JDCResolveContainerImage(container);
    if (!imageName) {
      log.warn(`[DOCKER CONVERTER]: skipping container '${container.name}' without image reference`);
      return;
    }
    const containerImage = container.selectedImage || {};
    const service = {
      image: imageName,
      stdin_open: true,
      tty: true,
    };
    if (container.keepAlive) {
      service.entrypoint = ['tail', '-f', '/dev/null'];
    }
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
    // Normalize subnet: ensure network address (last octet = 0) for /24 networks
    let subnet = e.subnet;
    
    // If subnet doesn't include CIDR notation, normalize and add /24
    if (!subnet.includes('/')) {
      // Extract first 3 octets and set last to 0 for network address
      const octets = subnet.split('.');
      if (octets.length === 4) {
        octets[3] = '0';
        subnet = octets.join('.');
      }
      subnet = `${subnet}/24`;
    } else {
      // If it already has CIDR notation, normalize the network address
      const [ip, mask] = subnet.split('/');
      const octets = ip.split('.');
      if (octets.length === 4) {
        octets[3] = '0';
        subnet = `${octets.join('.')}/${mask}`;
      }
    }
    
    allNetworks[e.name] = {
      ipam: {
        config: [{ subnet: subnet }] } };
  });
  return allNetworks;
}

// Create a JSON docker-compose object
function JSONDockerComposeConvert(containers, networkList) {
  const log = appUtils.getLogger();
  // create top level
  const object = this.JDCTemplate();
  const services = this.JDCGetServices(containers);
  const networks = this.JDCGetNetworks(networkList);
  object.services = services;
  object.networks = networks;
  log.debug('[DOCKER CONVERTER] Generated docker-compose:', JSON.stringify(object));
  return JSON.stringify(object);
}

exports.JDCTemplate = JDCTemplate;
exports.JDCGetContainerNetworks = JDCGetContainerNetworks;
exports.JDCGetServices = JDCGetServices;
// Get container networks in docker-compose style
exports.JDCGetNetworks = JDCGetNetworks;
exports.JSONDockerComposeConvert = JSONDockerComposeConvert;
exports.ComposeDockerConvert = ComposeDockerConvert;
exports.mergeComposeData = mergeComposeData;
