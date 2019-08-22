const chai = require('chai');
const appRoot = require('app-root-path');
const path = require('path');
const homedir = require('homedir');
const fs = require('fs');
const jsonfile = require('jsonfile');
const chaiFS = require('chai-fs');
const rimraf = require('rimraf');
const projectInit = require(`${appRoot}/app/util/project_init.js`);
const helper = require('../helper.js');

const expect = chai.expect;
let nameTestConfig;
let pathConfig;
let testConfig;
let projectTestDir;
let testUserPath;
let testUserRepoCloned;

describe('INSTALLATION LOW LEVEL', () => {
  before((done) => {
    chai.use(chaiFS);
    helper.start();
    pathConfig = path.join(appRoot.toString(), 'config', nameTestConfig);

    testConfig = {
      name: 'test_repo',
      mainDir: 'DSP_TESTING_INSTALLATION_DIRECTORY',
      githubURL: 'https://github.com/giper45/personalTestRepo.git',
    };

    projectTestDir = path.join(homedir(), testConfig.mainDir);
    testUserPath = path.join(projectTestDir, testConfig.name);
    testUserRepoCloned = path.join(testUserPath, 'MITM');
    // Destroy before test
    if (fs.existsSync(pathConfig)) { fs.unlinkSync(pathConfig); }
    if (fs.existsSync(projectTestDir)) {
      console.log('Have to destroy');
      rimraf.sync(projectTestDir);
    }
    done();
  });


  it('Should create config file', (done) => {
    expect(pathConfig).not.to.be.a.file;
    projectInit.createConfig(nameTestConfig, testConfig, (err) => {
      expect(err).to.be.null;
      expect(pathConfig).to.be.a.file;
      const configJSON = jsonfile.readFileSync(pathConfig);
      expect(configJSON).to.be.eql(testConfig);
      done();
    });
  });


  // TBD
  it.skip("Shouldn't create another config file if already exists", (done) => {
    projectInit.createConfig(nameTestConfig, testConfig, (err) => {
      expect(err).not.to.be.null;
      done();
    });
  });

  it('Should create all tree directories', (done) => {
    expect(projectTestDir).not.to.be.directory;
    projectInit.createDSP(nameTestConfig, (err) => {
      expect(err).to.be.null;
      expect(projectTestDir).to.be.directory();
      expect(path.join(projectTestDir, 'lab_states.json')).to.be.file();
      expect(testUserPath).to.be.directory();
      expect(fs.existsSync(testUserRepoCloned)).to.be.ok;
      expect(fs.existsSync(path.join(testUserPath, 'labels.json'))).to.be.ok;
      expect(path.join(testUserPath, '.dsp')).to.be.file();
      expect(path.join(testUserPath, '.data')).to.be.directory();

      done();
    });
  });

  it.skip('Should initialize the main repos', (done) => {
    projectInit.initRepos((err) => {
      expect(err).to.be.null;
      done();
    },
    (dataline) => console.log(dataline));
  });


  after(() => {
  });
});
