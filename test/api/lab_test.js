const expect = require('chai').expect;
const chai = require('chai');
const chaiHTTP = require('chai-http');
const chaiFS = require('chai-fs');
const path = require('path');
const jsonfile = require('jsonfile');
const appRoot = require('app-root-path');
const helper = require('../helper');
const _ = require('underscore');

const localConfig = require(`${appRoot}/config/local.config.json`);
const localhost = 'http://localhost:8080';
const api = '/dsp_v1/';


const labelsJSON = '[{"name":"Label Green","description":"Green","color":"#7cba8d"},{"name":"Label Red","description":"Red","color":"red"}] ';
const labelsTest = JSON.parse(labelsJSON);
const lab1JSON = '{"author": "test_repo","description":"descrizione repo1 lab1","goal":"obiettivo repo1 lab1","solution":"soluzione repo1 lab1"}';
const lab1Informations = JSON.parse(lab1JSON);

const existentInfo ={description: "newCiccio",goal:"newTest",solution:"newTest"} ;

const testsMiss = [
  { object:
  {
    description: 'Descript',
    solution: 'soluzione repo1 lab1',

  },
    testing: 'Testing no goal',
  },
  { object:
  {
    goal: 'obiettivo repo1 lab1',
    solution: 'soluzione repo1 lab1',

  },
    testing: 'Testing no descr',
  },
  { object:
  {
    description: 'Descript',
    goal: 'obiettivo repo1 lab1',
  },
    testing: 'Testing no solution',
  },
];
/*
in dsp_test there are 2 repo
test_repo and
another_repo


*/
describe('lab api test', () => {
  // Get original configuration
  beforeEach(function d(done) {
    chai.use(chaiHTTP);
    chai.use(chaiFS);
    this.testConfig = jsonfile.readFileSync(path.join(appRoot.toString(), 'config', 'test_user.json'));
    if (!localConfig.config.test) {
      console.log('PLS SET CONFIG TEST TO TRUE');
      this.skip();
    }
    helper.createDSP();
    done();
  });


  // GET LABS
  it('Should give labs ', (done) => {
    const labs = ['dsp 1', 'dsp 2', 'dsp 3', 'dsp 4'];
    chai.request(localhost)
    .get(`${api}labs/another_repo`)
    .end((err, res) => {
      expect(res.body.data.labs).to.be.eql(labs);
      done();
    });
  });

  // CREATE LAB
  it('Should create a new lab ', (done) => {
    chai.request(localhost)
    .post(`${api}labs/newlab/`)
    .send({ informations: lab1Informations, labels: labelsTest })
    .end((err, res) => {
      expect(err).to.be.null;
      expect(res.body.error).to.be.eql(null);
      done();
    });
  });


  function testWrongNames() {
    // No correct name
    const errorNameTests = [
      '*?_:%lab'
      // 'with spaces',
    ];

    errorNameTests.forEach((e) => {
      it(`Wrong names: Testing ${e}`, (done) => {
        chai.request(localhost)
        .post(`${api}labs/${e}`)
        .send({ informations: lab1Informations, labels: labelsTest })
        .end((err) => {
          expect(err).not.to.be.eql(null);
          done();
        });
      });
    });
  }
  function testMissParams() {
    testsMiss.forEach((e) => {
      it(e.testing, (done) => {
        chai.request(localhost)
        .post(`${api}labs/${e}`)
        .send({ informations: e.object, labels: [] })
        .end((err) => {
          expect(err).not.to.be.eql(null);
          done();
        });
      });
    });
  }
  testWrongNames();
  testMissParams();

  it('Should give error if no name is sent', (done) => {
    let e;
    chai.request(localhost)
    .post(`${api}labs/${e}`)
    .send({ informations: lab1Informations, labels: labelsTest })
    .end((err) => {
      expect(err).not.to.be.eql(null);
      done();
    });
  });


  // GET INFO EXISTENT LAB
  it('Should give existent lab informations ', (done) => {
    chai.request(localhost)
    .get('/dsp_v1/labs/test_repo/existentLab')
    .end((err, res) => {
      expect(res.body.data).to.be.eql(existentInfo);
      done();
    });
  });

  // UPDATE INFO
  it('Should update lab1 ', (done) => {
    const lab1Update = { description: 'update repo1 lab1', goal: 'obiettivo repo1 lab1', solution: 'soluzione repo1 lab1' };
    const lab1 = { labels: labelsTest, informations: lab1Update };


    chai.request(localhost)
    .put(`${api}labs/existentLab`)
    .send({ labels: lab1.labels, name: 'newlab', informations: lab1Update })
    .end((err, res) => {
      expect(res.body.error).to.be.eql(null);
      expect(res.body.data).not.to.be.undefined;
      expect(res.body.data.informations.description).to.be.eql(lab1.informations.description);
      expect(res.body.data.informations.goal).to.be.eql(lab1.informations.goal);
      expect(res.body.data.informations.solution).to.be.eql(lab1.informations.solution);
      expect(res.body.data.labels).to.be.eql(lab1.labels);
      done();
    });
  });

  it("Shouldn't update with empty name", (done) => {
    const lab1Update = { description: 'update repo1 lab1', goal: 'obiettivo repo1 lab1', solution: 'soluzione repo1 lab1' };
    const lab1 = { labels: labelsTest, informations: lab1Update };
    chai.request(localhost)
    .put(`${api}labs/newlab`)
    .send({ labels: lab1.labels, informations: lab1Update })
    .end((err, res) => {
      expect(res.body.error).not.to.be.eql(null);
      done();
    });
  });
  // DELETE LAB
  it('Should deletelab', (done) => {
    chai.request(localhost)
    .delete(`${api}labs/toDelete`)
    .end((err) => {
      expect(err).to.be.null;
      done();
    });
  });

  // DELETE LAB
  it('Should give error lab is running', (done) => {
    chai.request(localhost)
    .delete(`${api}labs/runningDelete`)
    .end((err) => {
      expect(err).to.be.null;
      done();
    });
  });
  /* IMPORT DSP 1 inside test_repo
     FILES TO COPY IN USER .data:
        ['forumcommunity.net', 'matlab_crash_dump.70031-1'];
      LABELS TestImport:

        {"labels":[{"name":"another","description":"another","color":"red"},
          {"name":"labelBlue","description":"LabelBlue","color":"#056C9F"}]}

      LABELS USER REPO:
        {"labels":[{"name":"Label Green","description":"Green","color":"#7cba8d"},
          {"name":"Label Red","description":"Red","color":"red"},
          {"name":"labelBlue","description":"AlreadyExistsBlue","color":"blue"}
        ]
        }
     */
  it('Should import TestImport from DSP_Projects in user repo', (done) => {
    const labNameToImport = 'TestImport';
    const filesToCopy = ['forumcommunity.net', 'matlab_crash_dump.70031-1'];
    const pathToCopy = path.join(helper.projectTestDir(), 'DSP_Projects', 'TestImport');
    const pathToFind = path.join(helper.userRepo(), labNameToImport);
    const dataPath = path.join(helper.userRepo(), '.data');
    const DSPDataPath = path.join(helper.projectTestDir(), 'DSP_Projects', '.data');
    const labelNoExistentCopied = { name: 'another', description: 'another', color: 'red' };
    const labelAlreadyExistent =
      { name: 'labelBlue', description: 'AlreadyExistsBlue', color: 'blue' };

    chai.request(localhost)
    .post(`${api}all/`)
    .send({
      labName: labNameToImport,
      repoName: 'DSP_Projects',
    })
  .end((err) => {
    expect(err).to.be.null;
    // Should have saved the lab inside the locale repo
    expect(pathToFind).to.be.a.directory()
      .and.equal(pathToCopy);
    // Should have import all files
    expect(path.join(dataPath, filesToCopy[0])).to.be.a.directory()
      .and.equal(path.join(DSPDataPath, filesToCopy[0]));
    expect(path.join(dataPath, filesToCopy[1])).to.be.a.file()
      .and.equal(path.join(DSPDataPath, filesToCopy[1]));
    const labels = jsonfile.readFileSync(path.join(helper.userRepo(), 'labels.json'));
    const copied = _.findWhere(labels.labels, { name: 'another' });
    const labelNoToCopy = _.findWhere(labels.labels, { name: 'labelBlue' });
    // Copied inside user repo a new label
    expect(copied).to.be.eql(labelNoExistentCopied);
    // An existent should not be copied
    expect(labelNoToCopy).to.be.eql(labelAlreadyExistent);

   // Open jsonfile of user
    done();
  });
  });

  it('Should launch an error if already exists a lab', (done) => {
    chai.request(localhost)
    .post(`${api}all/`)
    .send({
      labName: 'dsp 1',
      repoName: 'DSP_Projects',
    })
  .end((err) => {
    expect(err).not.to.be.null;
    done();
  });
  });
  after(() => {
  });
});

