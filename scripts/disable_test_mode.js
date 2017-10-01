const appRoot = require('app-root-path');
const path = require('path');
const jsonfile = require('jsonfile');

const localConfigPath = path.join(appRoot.path, 'config', 'local.config.json');
const configurationFile = jsonfile.readFileSync(localConfigPath);
console.log('test mode OFF');
configurationFile.config.test = false;
jsonfile.writeFileSync(localConfigPath, configurationFile, { spaces: 32 });
