const chai = require('chai');
const expect = require('chai').expect;
const labsData = require('../../app/data/labs.js');
const path = require('path');
const fs = require('fs');
const jsonfile = require('jsonfile');
const helper = require('../helper');
const _ = require('underscore');
const chaiFS = require('chai-fs');
const labStates = require('../../app/util/LabStates.js');

const testInfo = {
  description: 'ciccio', goal: 'test', solution: 'test',
};

describe('LABS TEST', () => {
  beforeEach(function dd() {
    chai.use(chaiFS);
    helper.start();
  });

  // getLabs
  it('Should give all labs', (done) => {
    labsData.getLabs(helper.userRepo(), (err, data) => {
      const sorted = _.sortBy(data);
      const defaultLabs = _.sortBy(['test', 'test2', 'toEditLab', 'existentLab']);
      expect(err).to.be.null;
      expect(sorted).to.be.eql(defaultLabs);
      done();
    });
  });
  // newLab
  it('Should create a new lab with setted information', (done) => {
    labsData.newLab('NNLab', testInfo, (err) => {
      expect(err).to.be.null;
      const thePath = path.join(helper.userRepo(), 'NNLab', 'information.json');
      expect(jsonfile.readFileSync(thePath).description).to.be.eql(testInfo.description);
      expect(jsonfile.readFileSync(thePath).goal).to.be.eql(testInfo.goal);
      expect(jsonfile.readFileSync(thePath).solution).to.be.eql(testInfo.solution);
//      expect(jsonfile.readFileSync(thePath).author).to.be.eql(helper.userRepoName());
      done();
    });
  });

  // saveinformation
  it('Should edit lab information', (done) => {
    const newInformation = {
      description: 'newCiccio', goal: 'newTest', solution: 'newTest' };
    labsData.saveInformation('toEditLab', newInformation, (err) => {
      expect(err).to.be.null;
      const thePath = path.join(helper.userRepo(), 'toEditLab', 'information.json');
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
    const newPath = path.join(helper.userRepo(), 'toEditLab');
    labsData.saveLabels('toEditLab', labels, (err) => {
      expect(err).to.be.null;
      jsLabels = jsonfile.readFileSync(path.join(newPath, 'labels.json'));
      expect(jsLabels).to.eql(labels);
      done();
    });
  });

  // renameLab
  it('Should rename lab', (done) => {
    labsData.renameLab('existentLab', 'newAnotherLab', (err) => {
      let statesJSON = jsonfile.readFileSync(path.join(helper.projectTestDir(), 'lab_states.json'));
      expect(err).to.be.null;
      expect(path.join(helper.userRepo(), 'existentLab')).to.not.be.a.path;
      expect(path.join(helper.userRepo(), 'newAnotherLab')).to.not.be.a.path;
      expect(_.findWhere(statesJSON, { labName: 'existentLab', repoName: 'test'})).to.be.undefined;
      expect(_.findWhere(statesJSON, { labName: 'newAnotherLab', repoName: 'test'})).to.not.be.undefined;
      done();
    });
  });


  // deleteLab
  it('Should give error if the lab is not present in state', (done) => {
    const pathTest = path.join(helper.userRepo(), 'toEditLab');
    labsData.deleteLab('toEditLab', (err) => {
      done();
    });
  })
  it('Should delete the lab', (done) => {
    const pathTest = path.join(helper.userRepo(), 'existentLab');
    labsData.deleteLab('existentLab', (err) => {
      expect(err).to.be.null;
      expect(pathTest).not.to.be.a.path;
      expect(labStates.existsSync(helper.userRepo(), 'existentLab')).to.be.false;
      done();
    });
  })


  // Getinformation
  it('Should give information', (done) => {
    const infoNew =
      {
        description: 'testDescription',
        goal: 'testGoal',
        solution: 'testSolution',
      };
    labsData.getInformation(helper.userRepoName(), 'test', (err, infos) => {
      expect(err).to.be.null;
      expect(infos.description).to.be.eql(infoNew.description);
      expect(infos.solution).to.be.eql(infoNew.solution);
      expect(infos.goal).to.be.eql(infoNew.goal);
      expect(infos.author).to.be.eql("gx1");
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
    afterEach((done) => {
      helper.end();
      done();
    });
  });
});
