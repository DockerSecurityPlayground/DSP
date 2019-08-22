const expect = require('chai').expect;
const chai = require('chai');
const appRoot = require('app-root-path');
const chaiFS = require('chai-fs');
const fs = require('fs');
const rimraf = require('rimraf');
const path = require('path');
const homedir = require('homedir');

const WebSocket = require('ws');

let nameTestConfig;
let pathConfig;
let testConfig;
let projectTestDir;

describe('API WEB SOCKETS TEST', () => {
  // Get original configuration
  before(() => {
    chai.use(chaiFS);
    // Read testuser
    nameTestConfig = 'test_user.json';
    pathConfig = path.join(appRoot.toString(), 'config', nameTestConfig);

    testConfig = {
      name: 'test_repo',
      mainDir: 'DSP_TESTING_INSTALLATION_DIRECTORY',
      githubURL: 'https://github.com/giper45/personalTestRepo.git',
    };

    projectTestDir = path.join(homedir(), testConfig.mainDir);

    // Destroy before test
    if (fs.existsSync(pathConfig)) { fs.unlinkSync(pathConfig); }

    if (fs.existsSync(projectTestDir)) { rimraf.sync(projectTestDir); }
  });

  // Correct setting
  it('Should install test project', (done) => {
    const ws = new WebSocket('ws://localhost:8080');

    ws.on('open', () => {
      console.log('COnnected');


      ws.send(JSON.stringify({
        action: 'installation',
        config: testConfig,
      }));
    });


    ws.on('message', (message) => {
      const data = JSON.parse(message);
      if (data.status === 'success') {
        expect(true).to.be.ok;
        done();
      } else if (data.status === 'error') {
        console.log(data);
        expect(false).to.be.ok;
        done();
      }
    });
  });
});
