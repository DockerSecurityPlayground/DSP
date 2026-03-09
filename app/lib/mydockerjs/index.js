const imageMgr = require('./lib/image-mgr.js');
const dockerComposer = require('./lib/docker-composer.js');
const docker = require('./lib/docker.js');
const dockerUtils = require('./lib/docker-utils.js');

const api = {
  dockerComposer,
  imageMgr,
  docker,
  dockerUtils };

module.exports = api;
