const readline = require('readline');
const path = require('path');
const fs = require('fs');
const configUser = require('../config/config_user.json');
const homedir = require('homedir');
const appRoot = require('app-root-path');
const rimraf = require('rimraf');


const rl = readline.createInterface({
    input: process.stdin,
      output: process.stdout
});

function rmRootDir() {
  const mainPath = path.join(homedir(), configUser.mainDir);
  console.log(`Remove root dir:${mainPath}`);
  rimraf.sync(mainPath);

}
function rmConfigUser() {
  console.log('Remove config user');
  fs.unlinkSync(path.join(appRoot.path, 'config', 'config_user.json'));
}
rl.question('Are you sure to uninstall? Make sure you\'ve saved all your local labs first! [Press yes to uninstall]\n', (answer) => {
    // TODO: Log the answer in a database
    if( answer === 'yes') {
      rmRootDir();
      rmConfigUser();
      console.log('Done');
    }
    else console.log('Ok I don\'t uninstall');
    rl.close();
});
