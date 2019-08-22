const expect = require('chai').expect;
const chai = require('chai');
const chaiHTTP = require('chai-http');
const chaiFS = require('chai-fs');
const path = require('path');
const fs = require('fs');
const homedir = require('homedir');
const helper = require('../helper');


const testPath = path.join(homedir(), 'DSP_TESTING_NEW');
const userTestPath = path.join(homedir(), 'DSP_TESTING_NEW', 'newName');
const configTest = {
  config:
  {
    name: 'newName',
    mainDir: 'DSP_TESTING_NEW',
  },
};

const api = `${helper.api}/config`;

describe('config test', () => {
  before((d) => {
    chai.use(chaiHTTP);
    chai.use(chaiFS);
    d();
  })
  beforeEach((done) => {
    helper.start();
    // helper.testInit();
      // READ USERNAME
    done();
  });

  it.skip('Should get configuration file', (done) => {
    chai.request(helper.localhost)
    .get(api)
    .end((err, res) => {
      expect(err).to.be.null;
      expect(res.body.data.config).to.be.eql(helper.testConfig());
      done();
    });
  });

  // GET LABELS REPO
  it.only('Should change configuration file', (done) => {
    // DSP_TESTING_DIR Exists as assumption
    expect(helper.projectTestDir()).to.be.a.path();
    const oldProjectDir = helper.projectTestDir();
    const oldUserDir = helper.userRepo();
    // const oldUserName = helper.userRepoName();

    console.log('letto');
    chai.request(helper.localhost)
     .post(api)
     .send(configTest)
     .end((err) => {
       expect(err).to.be.eql(null);
      //  const newUserName = helper.userRepoName();
       expect(oldProjectDir).to.not.be.a.path(); // Delete old
       // New configuration saved
       expect(configTest.config.mainDir).to.be.eql(helper.readTestConfig().mainDir);
       expect(configTest.config.name).to.be.eql(helper.readTestConfig().name);
       // test path created
       expect(testPath).to.be.a.directory();
       expect(userTestPath).to.be.a.directory();

       // Old directories there are't more
       expect(oldProjectDir).to.not.be.a.path();
       expect(oldUserDir).to.not.be.a.path();
       // console.log(LabStates.getStatesSync());
      // labStates.forEach((ls) => {
      //   if (ls.repoName === oldUserName || ls.repoName === newUserName)
      //   {
      //     console.log(`Testing ${ls.repoName} / ${ls.labName}`);
      //     expect(LabStates.existsSync(oldUserName, ls.labName)).to.not.be.ok;
      //     expect(LabStates.existsSync(newUserName, ls.labName)).to.be.ok;
      //   }
      // });
       done();
     });
  });

  it('Should update even if the same path is sent', (done) => {
    const oldUserDir = helper.userRepo();
    const anotherTest = {
      config:
      {
        name: 'chinatown',
        // Same path
        mainDir: 'DSP_TESTING_INSTALLATION_DIRECTORY'
      }
    };
    const anotherTestRoot = path.join(homedir(), anotherTest.config.mainDir);
    const anotherTestPath = path.join(anotherTestRoot,
        anotherTest.config.name);
    chai.request(helper.localhost)
    .post(api)
    .send({ config: anotherTest.config })
    .end((err) => {
      console.log(err);
      expect(err).to.be.eql(null);
      expect(oldUserDir).to.not.be.a.path(); // Remove old user path direcory
      expect(anotherTestRoot).to.be.a.directory(); // Update root dir
      expect(anotherTestPath).to.be.a.directory(); // Update user dir
      expect(anotherTest.config.mainDir).to.be.eql(helper.readTestConfig().mainDir);
      expect(anotherTest.config.name).to.be.eql(helper.readTestConfig().name);
      // New configuration saved
      // test path created

      done();
    });
  });

  it('Should not update config file if the main directory already exists', (done) => {
    // Create testPath
    const oldConfig = helper.readTestConfig();
    const oldRootPath = helper.projectTestDir();
    const oldUserPath = helper.userRepo();
    fs.mkdirSync(testPath);
    expect(oldUserPath).to.be.a.path();
    chai.request(helper.localhost)
    .post(api)
    .send(configTest)
    .end((err) => {
      expect(err).to.not.be.eql(null);
      const actualConfig = helper.readTestConfig();
      // Old directory shoyld exists
      expect(oldRootPath).to.be.a.directory();
      expect(oldUserPath).to.be.a.directory();
      // Actual configuration Should be equal to old configuration
      expect(oldConfig.mainDir).to.be.eql(actualConfig.mainDir);
      expect(oldConfig.name).to.be.eql(actualConfig.name);
      done();
    });
  });

  (function wrongParameters() {
    const wrongConfig = [
      {
        config: {
          name: 'with space',
          mainDir: 'mainDirete',
        },
        assertion: 'Test name with spaces',
      },
      {
        config: {
          name: 'rightName',
          mainDir: 'retaieon*:ewa',
        },
        assertion: 'No correct name mainDir',
      },
      {
        config: {
          name: 'pathSimple',
          mainDir: 'maree/eafwimeeioam',
        },
        assertion: 'No correct path',
      },
      {
        config: {
          name: 'rightName',
          mainDir: 'maree///eafwimeeioam',
        },
        assertion: 'No correct path',
      },
    ];


    wrongConfig.forEach((ele) => {
      it(`Testing with : ${ele.assertion}`, (done) => {
        chai.request(helper.localhost)
        .post(api)
        .send({ config: ele.config })
        .end((err) => {
          expect(err).to.not.be.null;
          done();
        });
      });
    });
  }());
 after((d) => {
   helper.end();
   d();
 })
});
