const appRoot = require('app-root-path');
const path = require('path');
const jsonfile = require('jsonfile');
const helper = require('../test/helper');

const localConfigPath = path.join(appRoot.path, 'config', 'local.config.json');
const configurationFile = jsonfile.readFileSync(localConfigPath);

console.log('test mode ON');
configurationFile.config.test = true;
jsonfile.writeFileSync(localConfigPath, configurationFile, { spaces: 32 });

helper.testInit();
helper.createDSP();
