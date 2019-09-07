const expect = require('chai').expect;
const chai = require('chai')
const helper = require('../helper');
const executable = require('executable');
const testModule = require('../../app/data/dockerfiles.js');
const appRoot = require('app-root-path');
const path = require('path')
const appChecker = require(`${appRoot}/app/util/AppChecker`);
const dockerfilesDir = path.join(helper.projectTestDir(), 'test', '.dockerfiles');
const fs = require('fs');
const filesPath = path.join(appRoot.toString(), 'test', 'api', 'files');
const f1 = fs.readFileSync(path.join(filesPath, 'basedir', 'internaldir', 'my.cnf'));
const f2 = fs.readFileSync(path.join(filesPath, 'basedir', 'internaldir', 'my.cnf3'));
const testDockerfileTemplate = "FROM alpine:latest";
const complexObj = { name: 'existent',
      content:
      [ { id: './Dockerfile',
         parent: '.',
         text: 'Dockerfile',
         type: 'textfile',
         content: testDockerfileTemplate,
         isExecutable : false,
         icon: 'jstree-file' },
        { id: './files',
        parent: '.',
        text: 'files',
        content: '#',
        type: 'dir',
        state: [Object] },
        { id: './files/emptydir',
          parent: './files',
          text: 'emptydir',
          content: '#',
          type: 'dir',
          state: [Object] },
        { id: './files/emptydir/internaldir',
         parent: './files/emptydir',
         text: 'internaldir',
         content: '#',
         type: 'dir',
         state: [Object] },
        { id: './files/emptydir/internaldir/my.cnf',
         parent: './files/emptydir/internaldir',
         content: f1,
         isExecutable : true,
         type: 'textfile'
        },
        { id: './files/emptydir/internaldir/my.cnf3',
         parent: './files/emptydir/internaldir',
         content: f2,
         isExecutable : false,
         type: 'textfile'
        }
      ]};
describe('Dockerfile test', () => {
  before((done) => {
    chai.use(require('chai-fs'));
    appChecker.initErrors();
    appChecker.initConditions();

    done();
  });
  beforeEach((done) => {
    helper.start();
    done();
  });

  it('Should create dockerfile', (done) => {
    const testName = "dockertest";
    const testPath = path.join(dockerfilesDir, 'dockertest');
    const testDockerfileTemplate = "FROM alpine:latest";
    testModule.createDockerfile("dockertest", undefined, (err, res) => {
      expect(err).to.be.null;
      expect(testPath).to.be.a.directory().with.files(['Dockerfile'])
      expect(path.join(testPath, 'Dockerfile')).to.be.a.file().with.content(testDockerfileTemplate);
      done();
    });
  });
  it('Should create dockerfile from an existent', (done) => {
    const testName = "dockertest";
    const options = {
      typeImport : "Dockerfile",
      name: "existent"
    }
    const testPath = path.join(dockerfilesDir, 'dockertest');
    const testDockerileExistent = "FROM existent\n";
    testModule.createDockerfile("dockertest", options, (err, res) => {
      expect(err).to.be.null;
      expect(testPath).to.be.a.directory().with.files(['Dockerfile'])
      expect(path.join(testPath, 'Dockerfile')).to.be.a.file().with.content(testDockerileExistent);
      done();
    });
  });
  it('Should create dockerfile from an existent git dockerfile', (done) => {
    const testName = "dockertest";
    const options = {
      typeImport : "Git",
      gitUrl: "https://github.com/giper45/dsp_dockerfile_test.git"
    }
    const testPath = path.join(dockerfilesDir, 'dockertest');
    const testDockerfile = "FROM git\n";
    testModule.createDockerfile("dockertest", options, (err, res) => {
      expect(err).to.be.null;
      expect(testPath).to.be.a.directory().with.files(['Dockerfile'])
      expect(path.join(testPath, 'Dockerfile')).to.be.a.file().with.content(testDockerfile);
      // Should delete .git dir
      expect(path.join(testPath, '.git')).not.to.be.a.path()
      done();
    });
  }).timeout(5000);
  it('Should give error if git repository does not contain a dockerfile ', (done) => {
    const testName = "dockertest";
    const options = {
      typeImport : "Git",
      gitUrl: "https://github.com/giper45/DSP_Repo.git"
    }
    const testPath = path.join(dockerfilesDir, 'dockertest');
    const testDockerfile = "FROM git\n";
    testModule.createDockerfile("dockertest", options, (err, res) => {
      expect(err).not.to.be.null;
      expect(testPath).not.to.be.path()
      done();
    });
  }).timeout(5000);

  it('Should update dockerfile content', (done) => {
    done();

  });

  const wrongNames = ["with spaces", "tes*", ":_r"];
  wrongNames.forEach((w) => {
    it('Should give error if name is not right', (done) => {
      const testPath = path.join(dockerfilesDir, 'dockertest');
      const testDockerfileTemplate = "FROM alpine:latest";
      testModule.createDockerfile(w, undefined, (err, res) => {
        expect(err).not.to.be.null;
        done();
      });
    });
  });

    it('Should give error if already exists', (done) => {
      const testPath = path.join(dockerfilesDir, 'dockertest');
      const testDockerfileTemplate = "FROM alpine:latest";
      testModule.createDockerfile("existent", undefined, (err, res) => {
        expect(err).not.to.be.null;
        done();
      });
    });

    it('Should remove an existent dockerfile', (done) => {
      const testPath = path.join(dockerfilesDir, 'existent');
      testModule.removeDockerfile('existent', (err) => {
        expect(err).to.be.null;
        expect(testPath).not.to.be.a.path()
        done();
      });
    });
    it('Should get existent dockerfile names (only dirs containing a Dockerfile)', (done) => {
      const dockernames = ['complex', 'existent', 'existent2'];
      testModule.getDockerfiles((err, res) => {
        expect(err).to.be.null;
        expect(res).to.be.eql(dockernames);
        done()
      });
    });
    it('Should get all content structure', (done) => {
      const ret = [{
      "id": ".",
      "parent": "#",
      "text": "root",
      "content": "#",
      "type": "dir",
      'state' : {
        'opened' : true,
        'selected' : true
      }
    },
      { id: './Dockerfile',
        parent: '.',
        text: 'Dockerfile',
        type: 'textfile',
        content: "isDockerfile" + "\n",
        icon: 'jstree-file' ,
        isExecutable : false
      },
      { id: './files',
        parent: '.',
        text: 'files',
        content: '#',
        type: 'dir',
        state:  {
          'opened' : true,
          'selected' : false
        }
      },
      { id: './files/emptydir',
        parent: './files',
        text: 'emptydir',
        content: '#',
        type: 'dir',
        state:  {
          'opened' : true,
          'selected' : false
        }},
      { id: './files/emptydir/internaldir',
        parent: './files/emptydir',
        text: 'internaldir',
        content: '#',
        type: 'dir',
        state:  {
          'opened' : true,
          'selected' : false
        }
      },
      { id: './files/emptydir/internaldir/my.cnf',
        parent: './files/emptydir/internaldir',
        content: "isMyCnf" + "\n",
        type: 'textfile',
        text: "my.cnf",
        icon: "jstree-file",
        isExecutable: true
      },
      { id: './files/emptydir/internaldir/my.cnf3',
        parent: './files/emptydir/internaldir',
        content: "isMyCnf3" + "\n",
        type: 'textfile',
        text: "my.cnf3",
        icon: "jstree-file",
        isExecutable: false
      }
    ];
      testModule.getDockerfile('complex', (err, res) => {
        expect(err).to.be.null;
        expect(res).to.be.eql(ret);
        done()
      });
    });

    it.only('Should save all the content structure', (done) => {
      const testPath = path.join(dockerfilesDir, 'existent');
      const tempdir = path.join(dockerfilesDir, '.tmpdir');

      testModule.editDockerfile(complexObj.name, complexObj.content, (err, res) => {
        expect(err).to.be.null;
        expect(testPath).to.be.a.directory().with.files(['Dockerfile'])
        expect(tempdir).not.to.be.a.path()
        expect(path.join(testPath, 'Dockerfile')).to.be.a.file().with.content(testDockerfileTemplate);
        expect(path.join(testPath, 'files/emptydir/internaldir')).to.be.a.path().with.files(['my.cnf', 'my.cnf3']);
        expect(path.join(testPath, 'files/emptydir/internaldir/my.cnf')).to.be.a.file().with.content(f1.toString());
        expect(path.join(testPath, 'files/emptydir/internaldir/my.cnf3')).to.be.a.file().with.content(f2.toString());
        expect(executable.sync(path.join(testPath, 'files/emptydir/internaldir/my.cnf'))).to.be.ok;
        done();
    });
      // testModule.editDockerfiles((

    })

    afterEach((done) => {
      helper.end();
      done();
    });
  after((done) => {
    done();
  });
});
