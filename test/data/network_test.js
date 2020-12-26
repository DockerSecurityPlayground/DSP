const expect = require('chai').expect;
const path = require('path');
const jsonfile = require('jsonfile');
const appRoot = require('app-root-path');
const labStates = require('../../app/util/LabStates.js');
const util = require('util');

const networkData = require(`${appRoot}/app/data/network`);
const appChecker = require(`${appRoot}/app/util/AppChecker`);
const testLab = 'existentLab';
const noNetworkTest = 'newTestLab';
const helper = require('../helper');
const repoName = helper.userRepoName();

const testObj = jsonfile.readFileSync(`${appRoot}/test/data/files/network_data.json`);


describe('Data Network Test', () => {
  before((d) => {
    appChecker.initErrors();
    appChecker.initConditions();
    d();
  })
  beforeEach(function d(done) {
    helper.start();
    done();
  });
  // Get original configuration
  it('should save data', (done) => {
    networkData.save(testLab, testObj, null, (err) => {
      expect(err).to.be.null;
      done();
    });
  });

  it('should read correct network description', (done) => {
    networkData.get(repoName, testLab, (err, results) => {
      expect(err).to.be.null;
      expect(results.clistDrawed).to.be.eql(testObj.clistDrawed);
      expect(results.clistNotDrawed).to.be.eql(testObj.clistNotDrawed);
      expect(results.state).to.be.eql(labStates.STOPPED);
      done();
    });
  });

  // Lab with empty network
  const composeLab = "composeImportedLab"  ;
  // Lab without network.json file
  const composeLabNoNetwork = "composeNoNetworkLab"  ;


  it('is imported should return false if lab contains a valid network.json', (done) => {
    networkData.isImported(repoName, testLab, (err, isImported) => {
      expect(err).to.be.null;
      expect(isImported).to.be.false;
      done();
    });
  })

  it('is imported should return true if lab contains an invalid network.json', (done) => {
    networkData.isImported(repoName, composeLab, (err, isImported) => {
      expect(err).to.be.null;
      expect(isImported).to.be.true;
      done();
    });
  })

  it('is imported should return true if lab contains an invalid network.json', (done) => {
    networkData.isImported(repoName, composeLabNoNetwork, (err, isImported) => {
      expect(err).to.be.null;
      expect(isImported).to.be.true;
      done();
    });
  });


  it('should check if a network exists', (done) => {
    networkData.networkExists(repoName, testLab, (err, exists) => {
      expect(err).to.be.null;
      expect(exists).to.be.ok;
      done();
    });
  });
  it('Should gives false for a non existent network', (done) => {
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
      done();
    });
  });
  it('Can delete file test', (done) => {
    networkData.canDeleteFile('filename', (err) => {
      expect(err).to.be.null;
      done();
    });
  });
  afterEach((done) => {
    helper.end();
    done();
  })

});
