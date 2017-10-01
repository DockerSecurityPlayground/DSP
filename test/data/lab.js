const chai = require('chai');
const expect = require('chai').expect;
const labsData = require('../../app/data/labs.js');
const path = require('path');
const fs = require('fs');
const jsonfile = require('jsonfile');
const helper = require('../helper');
const _ = require('underscore');
const chaiFS = require('chai-fs');

const testInfo = {
  description: 'ciccio', goal: 'test', solution: 'test',
};

describe('LABS TEST', () => {
  before(function dd() {
    if (!helper.isTestEnabled()) {
      console.error('Test is not enabled');
      this.skip();
    }
    chai.use(chaiFS);
    helper.createDSP();
  });

  // getLabs
  it.skip('Should give all labs', (done) => {
    labsData.getLabs(helper.userRepo(), (err, data) => {
      const sorted = _.sortBy(data);
      const defaultLabs = _.sortBy(['anotherNetwork', 'existentLab', 'networkTestDir', 'networkTestDir2', 'newLab', 'newTestLab']);
      expect(err).to.be.null;
      expect(sorted).to.be.eql(defaultLabs);
      done();
    });
  });
  // newLab
  it('Should create a new lab with setted informations', (done) => {
    labsData.newLab('NNLab', testInfo, (err) => {
      expect(err).to.be.null;
      const thePath = path.join(helper.userRepo(), 'NNLab', 'informations.json');
      expect(jsonfile.readFileSync(thePath).description).to.be.eql(testInfo.description);
      expect(jsonfile.readFileSync(thePath).goal).to.be.eql(testInfo.goal);
      expect(jsonfile.readFileSync(thePath).solution).to.be.eql(testInfo.solution);
//      expect(jsonfile.readFileSync(thePath).author).to.be.eql(helper.userRepoName());
      done();
    });
  });

  // saveInformations
  it('Should edit lab informations', (done) => {
    const newInformation = {
      description: 'newCiccio', goal: 'newTest', solution: 'newTest' };
    labsData.saveInformations('toEditLab', newInformation, (err) => {
      expect(err).to.be.null;
      const thePath = path.join(helper.userRepo(), 'toEditLab', 'informations.json');
      expect(jsonfile.readFileSync(thePath).description).to.be.eql(newInformation.description);
      expect(jsonfile.readFileSync(thePath).goal).to.be.eql(newInformation.goal);
      expect(jsonfile.readFileSync(thePath).solution).to.be.eql(newInformation.solution);
      // Read file state
      done();
    });
  });

  it('Should save labels of lab', (done) => {
    const labels = { labels: [
      { name: 'Label Green', description: 'Green', color: '#7cba8d' },
      { name: 'Label Red', description: 'Red', color: 'red' },
    ] };
    const newPath = path.join(helper.userRepo(), 'newLabelLab');
    let jsLabels = jsonfile.readFileSync(path.join(newPath, 'labels.json'));
    expect(jsLabels).to.be.ok;
    expect(jsLabels.labels).to.be.eql([]);
    labsData.saveLabels('newLabelLab', labels, (err) => {
      expect(err).to.be.null;
      jsLabels = jsonfile.readFileSync(path.join(newPath, 'labels.json'));
      expect(jsLabels).to.eql(labels);
      done();
    });
  });

  // renameLab
  it('Should rename lab', (done) => {
    let statesJSON = jsonfile.readFileSync(path.join(helper.projectTestDir(), 'lab_states.json'));
    expect(_.findWhere(statesJSON, { labName: 'existentLab', repoName: 'test_repo'})).to.not.be.undefined;
    expect(_.findWhere(statesJSON, { labName: 'newAnotherLab', repoName: 'test_repo'})).to.be.undefined;
    expect(path.join(helper.userRepo(), 'existentLab')).to.be.a.path;
    labsData.renameLab('existentLab', 'newAnotherLab', (err) => {
      let statesJSON = jsonfile.readFileSync(path.join(helper.projectTestDir(), 'lab_states.json'));
      expect(err).to.be.null;
      expect(path.join(helper.userRepo(), 'existentLab')).to.not.be.a.path;
      expect(path.join(helper.userRepo(), 'newAnotherLab')).to.not.be.a.path;
      expect(_.findWhere(statesJSON, { labName: 'existentLab', repoName: 'test_repo'})).to.be.undefined;
      expect(_.findWhere(statesJSON, { labName: 'newAnotherLab', repoName: 'test_repo'})).to.not.be.undefined;
      done();
    });
  });


  // deleteLab
  it('Should delete lab', (done) => {
    const pathTest = path.join(helper.userRepo(), 'newAnotherLab');
    expect(pathTest).to.be.a.path;
    labsData.deleteLab('newLab', (err) => {
      expect(err).to.be.null;
      expect(pathTest).not.to.be.a.path;
      done();
    });
  });


  // GetInformations
  it('Should give informations', (done) => {
    const infoNew =
      {
        description: 'newCiccio',
        goal: 'newTest',
        solution: 'newTest',
      };
    labsData.getInformations(helper.userRepoName(), 'newTestLab', (err, infos) => {
      expect(err).to.be.null;
      expect(infos.description).to.be.eql(infoNew.description);
      expect(infos.solution).to.be.eql(infoNew.solution);
      expect(infos.goal).to.be.eql(infoNew.goal);
      expect(infos.author).to.be.eql(helper.userRepoName());
      done();
    });
  });

  // Rename exceptions
  it("Should throw an error if try to rename a lab that don't exists", (done) => {
    const pathTest = path.join(helper.userRepo(), 'cicciolino');
    expect(fs.existsSync(pathTest)).to.not.be.ok;
    labsData.renameLab('peppolre', 'peppe', (err) => {
      expect(err).not.to.be.null;
      done();
    });
  });

  it('Should throw an error if try to rename a lab that already exists', (done) => {
    labsData.renameLab('cicciolino', 'reetetp', (err) => {
      expect(err).not.to.be.null;
      done();
    });
    after(() => {
    });
  });
});
