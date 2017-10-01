const expect = require('chai').expect;
const path = require('path');
const jsonfile = require('jsonfile');
const appRoot = require('app-root-path');
const labStates = require('../../app/util/LabStates.js');
const util = require('util');

const networkData = require(`${appRoot}/app/data/network`);
const appChecker = require(`${appRoot}/app/util/appChecker`);
const testLab = 'existentLab';
const noNetworkTest = 'newTestLab';
const helper = require('../helper');

const testObj = jsonfile.readFileSync(`${appRoot}/test/data/files/network_data.json`);


describe('Data Network Test', () => {
  before(function d(done) {
    appChecker.init((err) => {
      expect(err).to.be.null;
      if (!helper.isTestEnabled()) {
        console.log('Have to skip, test on first');
        this.skip();
      }
      helper.createDSP();
      done();
    });
  });
  // Get original configuration
  it('should save data', (done) => {
    networkData.save(testLab, testObj, null, (err) => {
      expect(err).to.be.null;
      done();
    });
  });

  it('should read correct network description', (done) => {
    const configData = jsonfile.readFileSync(path.join(appRoot.toString(), 'config', 'test_user.json'));
    const repoName = configData.name;
    networkData.get(repoName, testLab, (err, results) => {
      expect(err).to.be.null;
      expect(results.clistDrawed).to.be.eql(testObj.clistDrawed);
      expect(results.clistNotDrawed).to.be.eql(testObj.clistNotDrawed);
      expect(results.state).to.be.eql(labStates.STOPPED);
      done();
    });
  });

  it('should check if a network exists', (done) => {
    const configData = jsonfile.readFileSync(path.join(appRoot.toString(), 'config', 'test_user.json'));
    const repoName = configData.name;
    networkData.networkExists(repoName, testLab, (err, exists) => {
      expect(err).to.be.null;
      expect(exists).to.be.ok;
      done();
    });
  });
  it('Should gives false for a non existent network', (done) => {
    const configData = jsonfile.readFileSync(path.join(appRoot.toString(), 'config', 'test_user.json'));
    const repoName = configData.name;
    networkData.networkExists(repoName, noNetworkTest, (err, exists) => {
      expect(err).to.be.null;
      expect(exists).not.to.be.ok;
      done();
    });
  });
  it('Should throw an exception if send no existend lab', (done) => {
    networkData.save('noexistent', testObj, null, (err) => {
      expect(err).not.to.be.null;
      expect(err.message).to.contain('ENOENT');
      done();
    });
  });

  // test_hello.sh is inside a container the CompleteSimpleExample
  it('Cannot delete file test', (done) => {
     networkData.canDeleteFile('test_hello.sh', (err) => {
       expect(err).not.to.be.null;
       expect(err.code).to.be.eql(1007);
       console.log(err.message);
       done();
     });
  });
  it('Can delete file test', (done) => {
     networkData.canDeleteFile('filename', (err) => {
       expect(err).to.be.null;
       done();
     });
  });
  
});
