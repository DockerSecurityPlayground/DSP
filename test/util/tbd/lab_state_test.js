const chai = require('chai');
const path = require('path');
const jsonfile = require('jsonfile');
const fs = require('fs');
const helper = require('../helper');
const chaiFS = require('chai-fs');
const _ = require('underscore');
const LabStates = require('../../app/util/LabStates.js');

const expect = chai.expect;
const stateFile = path.join(helper.projectTestDir(), 'lab_states.json');

function _getTest() {
  const testStates = [
    { repoName: 'stoppedRepo',
      labName: 'one',
      state: 'STOPPED'
    },
    { repoName: 'stoppedRepo',
      labName: 'two',
      state: 'STOPPED'
    },
    { repoName: 'another_repo',
      labName: 'dsp 1',
      state: 'NO_NETWORK'
    },
    { repoName: 'another_repo',
      labName: 'noDSPLab',
      state: 'STOPPED'
    },
    { repoName: 'test_repo',
      labName: 'anotherNetwork',
      state: 'RUNNING'
    },
    { repoName: 'test_repo',
      labName: 'networkTestDir2',
      state: 'RUNNING'
    }];
  return testStates;
}


function _getState(repoName, labName) {
  const jsonArray = jsonfile.readFileSync(stateFile);
  return _.findWhere(jsonArray, { repoName, labName });
}


function _init() {
  // Create test dir
  if (fs.existsSync(stateFile)) {
    console.log('Have to remove');
    fs.unlinkSync(stateFile);
  }
  jsonfile.writeFileSync(stateFile,
        _getTest());
}

describe('LAB STATE TEST', () => {
  beforeEach(function d(done) {
    helper.start();
    done();
  });

  (function testGetLabs() {
    _getTest().forEach((element) => {
      it(`Testing ${element.repoName}:${element.labName}`, (done) => {
        LabStates.getState(element.repoName, element.labName, (err, state) => {
          expect(err).to.be.null;
          expect(state).to.be.eql(element.state);
          done();
        });
      });
    });
  }());

  it('Update NO_NETWORK', (done) => {
    const repoName = 'another_repo';
    const labName = 'noDSPLab';
    LabStates.setNoNetworkState(repoName, labName, (err) => {
      expect(err).to.be.null;
      const toSearch = _getState(repoName, labName).state;
      expect(toSearch).to.be.eql('NO_NETWORK');
      done();
    });
  });

  it('Update stopped', (done) => {
    const repoName = 'another_repo';
    const labName = 'dsp 1';
    LabStates.setStopState(repoName, labName, (err) => {
      expect(err).to.be.null;
      const toSearch = _getState(repoName, labName).state;
      expect(toSearch).to.be.eql('STOPPED');
      done();
    });
  });

  it('Should update an existent state', (done) => {
    const repoName = 'another_repo';
    const labName = 'noDSPLab';
    LabStates.setRunningState(repoName, labName, (err) => {
      expect(err).to.be.null;
      const toSearch = _getState(repoName, labName).state;
      expect(toSearch).to.be.eql('RUNNING');
      done();
    });
  });

  it('SYNC Should create a new state', () => {
    const testRepoName = 'newRepo';
    const testLabName = 'newLab';
    // Create test dir
    jsonfile.writeFileSync(stateFile,
          _getTest());

    LabStates.newStateSync(testRepoName, testLabName, 'RUNNING');
    const toSearch = _getState(testRepoName, testLabName);
    expect(toSearch).not.to.be.null;
    expect(toSearch.repoName).to.be.eql(testRepoName);
    expect(toSearch.labName).to.be.eql(testLabName);
    expect(toSearch.state).to.be.eql('RUNNING');
  });

  it('Should create a new state', (done) => {
    const testRepoName = 'newRepo';
    const testLabName = 'newLab';
    // Create test dir
    jsonfile.writeFileSync(stateFile,
          _getTest());

    LabStates.newState(testRepoName, testLabName, 'RUNNING', (err) => {
      expect(err).to.be.null;
      const toSearch = _getState(testRepoName, testLabName);
      expect(toSearch).not.to.be.null;
      expect(toSearch.repoName).to.be.eql(testRepoName);
      expect(toSearch.labName).to.be.eql(testLabName);
      expect(toSearch.state).to.be.eql('RUNNING');
      done();
    });
  });

  it('Should delete a state', (done) => {
    const repoName = 'another_repo';
    const labName = 'noDSPLab';
    // Create test dir
    jsonfile.writeFileSync(stateFile,
          _getTest());
    LabStates.removeState('another_repo', 'noDSPLab', (err) => {
      expect(err).to.be.null;
      expect(_getState(repoName, labName)).to.be.eql.null;
      done();
    });
  });

  it('Should delete all states of a repo', (done) => {
    const repoName = 'another_repo';
    jsonfile.writeFileSync(stateFile,
          _getTest());
    LabStates.removeStates('another_repo', (err) => {
      expect(err).to.be.null;
      expect(_getState(repoName, 'noDSPLab')).to.be.eql.undefined;
      expect(_getState(repoName, 'dsp 1')).to.be.eql.undefined;
      expect(_getState('test_repo', 'anotherNetwork')).not.to.be.eql.undefined;
      done();
    });
  });

  it('Should edit an existent state', (done) => {
    const repoName = 'another_repo';
    const labName = 'noDSPLab';
    const newlabName = 'my name is jack';
    const newrepoName = 'myrepo';
    // Create test dir
    jsonfile.writeFileSync(stateFile,
         _getTest());
    LabStates.editState(repoName, labName, {
      labName: newlabName,
      repoName: newrepoName
    }, (err) => {
      expect(err).to.be.null;
      expect(_getState(repoName, labName)).to.be.eql.null;
      expect(_getState(newrepoName, newlabName)).not.to.be.eql.null;
      done();
    });
  });

  it('Test all stopped', (done) => {
    const repoName = 'stoppedRepo';
    LabStates.checkAll(repoName, 'STOPPED', (err, areStopped, labsWrong) => {
      expect(err).to.be.null;
      expect(areStopped).to.be.ok;
      expect(labsWrong).to.be.eql([]);
      done();
    });
  });
  it('Test all running', (done) => {
    const repoName = 'test_repo';
    LabStates.checkAll(repoName, 'RUNNING', (err, areStopped, labsWrong) => {
      expect(err).to.be.null;
      expect(areStopped).to.be.ok;
      expect(labsWrong).to.be.eql([]);
      done();
    });
  });

  it(' Exists true ', (done) => {
    const repoName = 'another_repo';
    const labName = 'dsp 1';
    LabStates.exists(repoName, labName, (err, exists) => {
      expect(err).to.be.null;
      expect(exists).to.be.ok;
      done();
    });
  });
  it(' Exists false ', (done) => {
    const repoName = 'another_repo';
    const labName = 'jackvigorsol';
    LabStates.exists(repoName, labName, (err, exists) => {
      expect(err).to.be.null;
      expect(exists).to.be.false;
      done();
    });
  });

  it(' Exists true sync', () => {
    const repoName = 'another_repo';
    const labName = 'dsp 1';
    expect(LabStates.existsSync(repoName, labName)).to.be.ok;
  });

  it(' Exists false ', () => {
    const repoName = 'another_repo';
    const labName = 'jackvigorsol';
    expect(LabStates.existsSync(repoName, labName)).to.not.be.ok;
  });

  it('Should edit all states', (done) => {
    LabStates.editStates('test_repo', { repoName: 'jack', state: 'STOPPED' }, (err) => {
      expect(err).to.be.null;
      const tests = _getTest();
      tests.forEach((ele) => {
        if (ele.labName === 'anotherNetwork' || ele.labName === 'networkTestDir2') {
          // Old must be null
          expect(_getState(ele.repoName, ele.labName)).to.be.eql.null;
        // Update the state
          expect(_getState('jack', ele.labName).state).to.be.eql('STOPPED');
        }
      });
      done();
    });
  });
  it('Should init all states', (done) => {
    LabStates.initStates('test_repo', (err) => {
      expect(err).to.be.null;
      const tests = _getTest();
      tests.forEach((ele) => {
        if (ele.repoName === 'test_repo') {
          expect(_getState(ele.repoName, ele.labName).state).to.be.eql('STOPPED');
        }
      });
      done();
    });
  });
  it('Test no all STOPPED', (done) => {
    // This is no stopped but NO_NETWORK
    const repoName = 'another_repo';
    const labName = 'dsp 1';
    const stateNoStopped = _getState(repoName, labName);

    LabStates.checkAll(repoName, 'STOPPED', (err, areStopped, labsWrong) => {
      expect(err).to.be.null;
      expect(areStopped).not.to.be.ok;
      expect(labsWrong).to.be.eql([stateNoStopped]);
      done();
    });
  });
  afterEach((d) => {
    helper.end();
    d();
  })
});
