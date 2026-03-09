const utils = require('./utils');
const _ = require('underscore');
const Docker = require('dockerode');



const api = {

  exec: function exec(container, command, callback, paramsInput, notifyCallback) {
    const paramsProto = {
      detached: false,
    };
    // Get the params
    const params = _.extend({}, paramsProto, paramsInput);
    let options = '';
    if (params.detached)
    { options += '-d '; }
    if (params.interactive)
    { options += '-i '; }
    if (params.tty)
    { options += '-t '; }
    const escapedCommand = utils.escapeString(command);
    // const cmd = `echo '${escapedCommand}' | xargs -0 -t docker exec ${options}${container} /bin/sh -c `;
    const cmd = `docker exec ${options}${container} /bin/sh -c '${escapedCommand}'`;
    const pid = utils.cmd(cmd, callback);
    // Notify
    if (notifyCallback && typeof notifyCallback === 'function') {
      utils.docker_stdout(pid, notifyCallback);
      utils.docker_logs(pid, notifyCallback);
    }
    return pid;

  },

  // Get container infos
  getInfoContainer(id, callback) {
    return utils.unixRequest(`/containers/${id}/json`, 'GET', callback);
  },


  // Call docker cp
  cp(container, src, dst, callback) {
    return utils.cmd(`docker cp  ${src} ${container}:${dst}`, callback);
  },
  // Get from container
  cpFrom(container, src, dst, callback) {
    return utils.cmd(`docker cp ${container}:${src} ${dst}`, callback);
  },


  // Run a container
  run(image, callback, paramsInput, notifyCallback, errorCallback) {
    const paramsProto = {
      detached: false,
    };

    const params = _.extend({}, paramsProto, paramsInput);
    

    let flags = '';
    let cmd = '';
    if (params.detached)
    { flags += ' -d '; }
    if (params.networkHost) {
      flags += ' --network host ';
    }
    if (params.cap_add)
    { flags += ` --cap-add=${params.cap_add} ` }
    if (params.shmSize)
    { flags += `--shm-size ${params.shmSize} `; }
    if (params.cmd)
    { cmd = params.cmd; }
    if (params.name)
    { flags += ` --name=${params.name} `; }
    if (params.net) {
      if (params.net instanceof Array) {
        _.each(params.net, (v) => {
          flags += ` --net=${params.net}`;
        });
      } else {
        flags += ` --net=${params.net}`;
      }
    }
    if (params.interactive)
    { flags += ' -it '; }
    // TODO: Check port syntax
    if (params.ports) {
      _.each(params.ports, (value, key, obj) => {
        // {'container_port' : 'host_port' }
        flags += ` -p ${value}:${key} `;
      });
    }
    if (params.environments) {
      _.each(params.environments, (ele) => {
        flags += ` -e ${ele.name}='${ele.value}' `;
      });
    }
    if (params.volumes) {
      _.each(params.volumes, (ele) => {
        flags += ` -v ${ele.hostPath}:${ele.containerPath} `;
      });
    }
    if (params.logDriver == 'none') {
      flags += " --log-driver=none"
    }
    if (params.rm) {
      flags += " --rm";
    }
    if (params.privileged) {
      flags += " --privileged=true";
    }

    const toExec = `docker run ${flags} ${image} ${cmd}`;
    const pid = utils.cmd(toExec, callback);
    
    
    // Notify
    if (notifyCallback && typeof notifyCallback === 'function') {
      utils.docker_stdout(pid, notifyCallback);
    }
    if (errorCallback && typeof errorCallback === 'function') {
      utils.docker_logs(pid, errorCallback);
    }
    return pid;
  },
  taggedBuild(thePath, name, tag, callback, notifyCallback) {
    const cmd = `docker build -t ${name}:${tag} ${thePath}`
    const pid = utils.cmd(cmd, callback);
    if (notifyCallback && typeof notifyCallback === 'function') {
      utils.docker_stdout(pid, notifyCallback);
    };
  },
  build(thePath, name, callback, notifyCallback) {
    const cmd = `docker build -t ${name}:latest ${thePath}`
    const pid = utils.cmd(cmd, callback);
    if (notifyCallback && typeof notifyCallback === 'function') {
      utils.docker_stdout(pid, notifyCallback);
    };
  },
  // Start all containers
  startAll(callback) {
    const cmd = 'for i in $(docker ps -a -q); do docker start $i ; done';
    return utils.cmd(cmd, callback);
  },

  stopAll(callback) {
    const cmd = 'for i in $(docker ps -a -q); do docker stop $i ; done';
    return utils.cmd(cmd, callback);
  },
  // Stop container
  stop(name, callback) {
    const cmd = `docker stop ${name}`;
    return utils.cmd(cmd, callback);
  },
  // Start container
  start(name, callback) {
    const cmd = `docker start ${name}`;
    return utils.cmd(cmd, callback);
  },
  // Remove
  rm(name, callback, force=false) {
    const isForced = (force) ? "-f " : " ";
    const cmd = `docker rm ${isForced} ${name}`;
    return utils.cmd(cmd, callback);
  },
  // Remove all containers
  rmAll(callback) {
    return utils.cmd(' docker rm -f $(docker ps -a -q) ', callback);
  },


  dockerodePS(callback, allContainers=false) {
    const docker = new Docker({socketPath: '/var/run/docker.sock'});
    docker.listContainers({all: allContainers}, (err, containers) => {
      callback(err, containers);
    });
  },

  //
  // Returns active containers
  ps(callback, all=false) {
    const allContainers =  all ? 1:0;
    return utils.unixRequest(`/containers/json?all=${allContainers}`, 'GET', callback);
  },

  isRunning(name, callback) {
    this.dockerodePS((err, data) => {
      if (err) {
        callback(err);
      } else {
        let names = data.map((d) => d.Names[0].slice(1));
        let existing = names.filter((n) => n == name)
        callback(null, existing.length > 0);
      }
    }, true);
  },

  createNetwork(name, callback, paramsInput) {
    const paramsProto = {};
    const params = _.extend({}, paramsProto, paramsInput);
    const flags = utils.addFlags(params);
    const cmd = `docker network create ${flags} ${name}`;

    return utils.cmd(cmd, callback);
  },
  removeNetwork(name, callback) {
    const cmd = `docker network rm ${name}`;
    return utils.cmd(cmd, callback);
  },
  createVolume(name, callback) {
    const cmd = `docker volume create ${name}`;
    return utils.cmd(cmd, callback);
  },
  removeVolume(name, callback) {
    const cmd = `docker volume rm ${name}`;
    return utils.cmd(cmd, callback);
  },
  // Remove all unused networks
  networkPrune(callback) {
    const cmd = 'docker network prune -f';
    return utils.cmd(cmd, callback);
  },
  networkList(callback) {
    const docker = new Docker({socketPath: '/var/run/docker.sock'});
    return docker.listNetworks({}, callback);
    // return utils.unixRequest('/networks', 'GET', callback);
  },
  getNetwork(name, callback) {
    const docker = new Docker({socketPath: '/var/run/docker.sock'});
    const theNetwork = docker.getNetwork(name);
    return theNetwork.inspect(callback);
    // return utils.unixRequest(`/networks/${name}`, 'GET', callback);
  },
  connectToNetwork(nameContainer, nameNetwork, callback, ip) {
    let cmd ='';
    if (ip) {
      cmd = `docker network connect --ip ${ip} ${nameNetwork} ${nameContainer}`;
    } else {
      cmd = `docker network connect ${nameNetwork} ${nameContainer}`;
    }
    return utils.cmd(cmd, callback);
  },
  disconnectFromNetwork(nameContainer, nameNetwork, callback) {
    let cmd = '';
    cmd = `docker network disconnect ${nameNetwork} ${nameContainer}`;
    return utils.cmd(cmd, callback);
  }
};


module.exports = api;
