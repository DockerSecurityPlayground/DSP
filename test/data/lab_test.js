const chai = require('chai');
const expect = require('chai').expect;
const labsData = require('../../app/data/labs.js');
const path = require('path');
const appRoot = require('app-root-path');
const fs = require('fs');
const appChecker = require(`${appRoot}/app/util/AppChecker`);
const jsonfile = require('jsonfile');
const helper = require('../helper');
const _ = require('underscore');
const chaiFS = require('chai-fs');
const labStates = require('../../app/util/LabStates.js');


const testInfo = {
  description: 'ciccio', goal: 'test', solution: 'test',
};
const baseDataDir = path.join(appRoot.toString(), 'test', 'data');

describe('LABS TEST', () => {
  before((d) => {
    appChecker.initErrors();
    appChecker.initConditions();
    d();
  })
  beforeEach(function dd() {
    chai.use(chaiFS);
    helper.start();
  });

  // getLabs
  it('Should give all labs', (done) => {
    labsData.getLabs(helper.userRepo(), (err, data) => {
      const sorted = _.sortBy(data);
      const defaultLabs = _.sortBy(['composeImportedLab', 'composeNoNetworkLab', 'test', 'test2', 'testreadme', 'testreadmedir', 'toEditLab', 'existentLab']);
      expect(err).to.be.null;
      expect(sorted).to.be.eql(defaultLabs);
      done();
    });
  });

  it('Should give true if a lab exist', (done) => {
    labsData.existLab("test", "test", (err, data) => {
      try {
        expect(err).to.be.null;
        expect(data).to.be.ok;
        done();
      } catch (e) {
        done(e);

      }
    })
  });
  it('Should give false if a lab does not exist', (done) => {
    labsData.existLab("test", "invalidtestdir", (err, data) => {
      try {
        expect(err).to.be.null;
        expect(data).to.be.false;
        done();
      } catch (e) {
        done(e);

      }

    })
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

  /** 
   * COMPOSE TESTSS
   */
  const composeLab = "composeLab";
  const composeImportedLab = "composeImportedLab";
  const composeLabZip = "composeLabZip";
  const goodZip = "CVE.zip"
  const notGoodZip = "notgood.zip"

  it("Should create a new lab from docker-compose", (done) => {
    const composeStream = fs.createReadStream(path.join(baseDataDir, 'docker-compose-test.yml'));
    labsData.newLabFromCompose(composeLab, composeStream, false, (err) => {
      try {
        console.log(err);
        expect(err).to.be.null;
        expect(path.join(helper.userRepo(), composeLab)).to.be.a.directory().with.files([
          'information.json',
          '.dsp',
          'labels.json',
          'network.json',
          'docker-compose.yml'
        ]);
        done();
      } catch (e) {
        done(e);
      }
    });
  });


  it("Should overwrite lab if already exist and flag is true", (done) => {
    const composeStream = fs.createReadStream(path.join(baseDataDir, 'docker-compose-test.yml'));
    labsData.newLabFromCompose(composeImportedLab, composeStream, true, (err) => {
      try {
        expect(err).to.be.null;
        expect(path.join(helper.userRepo(), composeImportedLab)).to.be.a.directory().with.files([
          'information.json',
          '.dsp',
          'labels.json',
          'network.json',
          'docker-compose.yml'
        ]);
        done();
      } catch (e) {
        done(e);
      }
    });
  });

  it("Should give true for a valid zip file ", (done) => {
    const fileTest = fs.readFileSync(path.join(baseDataDir, goodZip));
    labsData.isValidZip(fileTest, true, (err, isValid) => {
      expect(err).to.be.null;
      expect(isValid.valid).to.be.ok;
      done(err);
    })
  });
  it("Should give false for a file that is not a zip file ", (done) => {
    const fileTest = fs.readFileSync(path.join(baseDataDir, 'docker-converter.js'));
    labsData.isValidZip(fileTest, true, (err, isValid) => {
      expect(err).to.be.null;
      expect(isValid.valid).to.be.false;
      done(err);
    })
  });
  it("Should give false for a invalid zip file ", (done) => {
    const fileTest = fs.readFileSync(path.join(baseDataDir, notGoodZip));
    labsData.isValidZip(fileTest, true, (err, isValid) => {
      expect(err).to.be.null;
      expect(isValid.valid).to.be.false;
      done(err);
    })
  });

  it("Should give error if file is not docker-compose", (done) => {
    const composeStream = fs.createReadStream(path.join(baseDataDir, 'docker-converter.js'));
    labsData.newLabFromCompose(composeLab, composeStream, false, (err) => {
      expect(err).not.to.be.null;
      done();
    });
  });

  it("Should import good zip file", (done) => {
    const composeStream = fs.createReadStream(path.join(baseDataDir, goodZip));
    labsData.newLabFromCompose(composeLabZip, composeStream, false, (err) => {
      try {
        expect(err).to.be.null;
        expect(path.join(helper.userRepo(), composeLabZip)).to.be.a.directory().with.files([
          'information.json',
          '.dsp',
          'README.md',
          'app.py',
          'network.json',
          'labels.json',
          'docker-compose.yml'
        ]);
        // Check content file
        const expected = fs.readFileSync(path.join(baseDataDir, 'vulhub.yml'))
        const actual = fs.readFileSync(path.join(helper.userRepo(),composeLabZip, 'docker-compose.yml'))
        expect(actual.toString()).to.be.eql(expected.toString());

        done();
      } catch (e) {
        done(e);
      }
    });
  });

  it("Should not import good zip file", (done) => {
    const composeStream = fs.createReadStream(path.join(baseDataDir, notGoodZip));
    labsData.newLabFromCompose(composeLab, composeStream, false, (err) => {
      try {
        expect(err).not.to.be.null;
        done();
      } catch (e) {
        done(e);
      }
    });
  });

  // saveinformation
  it('Should edit lab information', (done) => {
    const newInformation = {
      description: 'newCiccio', goal: 'newTest', solution: 'newTest'
    };
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
    const labels = {
      labels: [
        { name: 'Label Green', description: 'Green', color: '#7cba8d' },
        { name: 'Label Red', description: 'Red', color: 'red' },
      ]
    };
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
      expect(_.findWhere(statesJSON, { labName: 'existentLab', repoName: 'test' })).to.be.undefined;
      expect(_.findWhere(statesJSON, { labName: 'newAnotherLab', repoName: 'test' })).to.not.be.undefined;
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
      expect(infos.readme).to.be.undefined;
      done();
    });
  });

  it('Should give information + readme', (done) => {
    const infoNew =
    {
      description: 'testDescription',
      goal: 'testGoal',
      solution: 'testSolution',
    };
    labsData.getInformation(helper.userRepoName(), 'testreadme', (err, infos) => {
      const readmeContent = fs.readFileSync(path.join(appRoot.toString(), 'test', 'data', 'README.md'));
      expect(err).to.be.null;
      expect(infos.description).to.be.eql(infoNew.description);
      expect(infos.solution).to.be.eql(infoNew.solution);
      expect(infos.goal).to.be.eql(infoNew.goal);
      expect(infos.author).to.be.eql("gx1");
      expect(infos.readme).to.be.eql(readmeContent.toString());
      done();
    });
  });

  it('Should give information without readme if readme is a dir', (done) => {
    const infoNew =
    {
      description: 'testDescription',
      goal: 'testGoal',
      solution: 'testSolution',
    };
    labsData.getInformation(helper.userRepoName(), 'testreadmedir', (err, infos) => {
      expect(err).to.be.null;
      expect(infos.description).to.be.eql(infoNew.description);
      expect(infos.solution).to.be.eql(infoNew.solution);
      expect(infos.goal).to.be.eql(infoNew.goal);
      expect(infos.author).to.be.eql("gx1");
      expect(infos.readme).to.be.undefined;
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
