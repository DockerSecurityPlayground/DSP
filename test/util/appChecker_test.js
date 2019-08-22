const chai = require('chai');
const path = require('path');
const appRoot = require('app-root-path');
const fs = require('fs');
const Checker = require('../../app/util/AppChecker.js');

const AppConditions = Checker.AppConditions;
const JoiAppConditions = Checker.JoiAppConditions;
const expect = chai.expect;

function filenameTests() {
  // Correct
  expect(() => AppConditions.check('pere', 'filetype')).to.not.throw(Error);
  expect(() => AppConditions.check('ciccioformaggio', 'filetype')).not.to.throw(Error);
  // Wrongs number
  expect(() => AppConditions.check(121, 'filetype')).to.throw(Error);
  // Strange characeters
  expect(() => AppConditions.check('/*feaif°', 'filetype')).to.throw(Error);
  expect(() => AppConditions.check('%%omfoepwam$', 'filetype')).to.throw(Error);
  // Empty
  expect(() => AppConditions.check('     ', 'filetype')).to.throw(Error);
  expect(() => AppConditions.check('', 'filetype')).to.throw(Error);
}
describe('AppChecker test', () => {
  before((done) => {
    Checker.initErrors();
    Checker.initConditions();
    done();
  });
  it('Filename condition test', () => {
    filenameTests();
  });


  it('Check params test correct', (done) => {
    Checker.checkParams({ norepo: 'ciao' }, ['repo'], (err) => {
      expect(err).not.to.be.null;
      done();
    });
  });

  it('Check params test no correct', (done) => {
    Checker.checkParams({ repo: 'ciao' }, ['repo'], (err) => {
      expect(err).to.be.null;
      done();
    });
  });


  it('Check string with correct testing', (done) => {
    Checker.checkString('sono string', (err) => {
      expect(err).to.be.null;
      done();
    });
  });

  it('Check string with no correct testing', (done) => {
    Checker.checkString(21, (err) => {
      expect(err).not.to.be.null;
      done();
    });
  });

  it('Check URL correct', (done) => {
    JoiAppConditions.check('https://httpd.apache.org', 'url', (err) => {
      expect(err).to.be.null;
      done();
    });
  });
  it('Check URL wrong', (done) => {
    JoiAppConditions.check('rete://git:rtrt@httpd.apache.org', 'url', (err) => {
      expect(err).not.to.be.null;
      done();
    });
  });
  describe('Handlers test', () => {
    it('GetLabs', () => {
      expect(() => AppConditions.check({ params: {} }, 'getLabsCheck')).to.throw(Error);
      expect(() => AppConditions.check({ params: { repo: 'jack' } }, 'getLabsCheck')).to.not.throw(Error);
    });
  });


  describe('Error give', () => {
    Checker.initErrors();
    it('Should give corect error', (done) => {
      expect(Checker.errorDirAlreadyExists().code).to.be.eql(1006);
      done();
    });
    it('Should give correct string for ws response', () => {
      const testStates = [
        { repoName: 'test_repo',
          labName: 'anotherNetwork',
          state: 'RUNNING'
        },
        { repoName: 'test_repo',
          labName: 'networkTestDir2',
          state: 'RUNNING'
        }];
      const stateOne = testStates[0];
      const stateTwo = testStates[1];
      const stringExpected = `[ ${stateOne.repoName}/${stateOne.labName}, ${stateTwo.repoName}/${stateTwo.labName} ]`;
      const error = Checker.errorLabNoStopped(testStates);
      expect(error.message).to.be.eql(stringExpected);
      expect(error.code).to.be.eql(1005);
    });
  });

  it.skip('SHould give true if isInstalled', (done) => {
    Checker.isInstalled((err, ex) => {
      expect(err).to.be.null;
      expect(ex).to.be.ok;
      done();
    });
  });

  it.skip('SHould give false if isNotInstalled', (done) => {
    const configPath = path.join(appRoot.toString(), 'config', 'config_user.json');
    const newPath = path.join(appRoot.toString(), 'config', 'tmp.json');

    // First rename
    fs.renameSync(configPath, newPath);

    Checker.isInstalled((err, ex) => {
      expect(err).to.be.null;
      expect(ex).not.to.be.ok;
      fs.renameSync(newPath, configPath);
      done();
    });
  });
});

