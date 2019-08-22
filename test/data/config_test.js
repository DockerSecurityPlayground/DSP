const expect = require('chai').expect;
const configData = require('../../app/data/config.js');
const path = require('path');

const appRoot = require('app-root-path');

const appChecker = require(`${appRoot}/app/util/AppChecker`);
const helper = require('../helper');


const obj = { name: 'usertest', mainDir: 'dsp', githubURL: 'http://eoifnaeoinefo.com' };
const testPath = path.join(appRoot.toString(), 'test', 'testDSPDir', 'test');
describe('configTest', () => {
  before((done) => {
    appChecker.initErrors();
    appChecker.initConditions();
    helper.initStubs();
    done();
  })
  // Get original configuration
  beforeEach((done) => {
    helper.start();
    done();
  });

  // End before
  it('should update configuration', (done) => {
    configData.updateConfig(obj, (err) => {
      expect(err).to.be.eql(null);

      configData.getConfig((errTwo, ret) => {
        expect(errTwo).to.be.eql(null);
        expect(ret).to.be.eql(obj);
        done();
      });
    });
  });

  it('Should update even if the same path is sent', (done) => {
    const actualPath = helper.readTestConfig();
    configData.updateConfig(actualPath, (err) => {
      expect(err).to.be.null;
      done();
    });
  });
  // mainDir/userName_repo
  it('should give user path ', (done) => {
    // set original config
      configData.getUserPath((otherErr, userPath) => {
        expect(otherErr).to.be.null;
        expect(userPath).to.be.eql(testPath);
        done();
      });
  });
  // mainDir/userName_repo/labels.json
  it('should give user label ', (done) => {
    const labelPath = path.join(testPath, 'labels.json');
    // set original config
    configData.getLabelFile((err, lp) => {
      expect(labelPath).to.be.eql(lp);
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
    ];


    wrongConfig.forEach((ele) => {
      it(`Testing with : ${ele.assertion}`, (done) => {
        configData.updateConfig(ele.config, (err) => {
          expect(err).not.to.be.null;
          done();
        });
      });
    });
  }());

  it('Test normalization path', (done) => {
    const ct = {
      name: 'rightName',
      mainDir: 'maree///testiamo',
    };

    configData.updateConfig(ct, (err) => {
      expect(err).to.be.null;
      const newTest = helper.readTestConfig();
      expect(newTest.mainDir).to.be.eql('maree/testiamo');
      done();
    });
  });

  it('it should give an error with incorrect mainDir path', (done) => {
    done();
  });

  // Recover  configuration
  afterEach((done) => {
    helper.end();
    done();
  });
});
