const expect = require('chai').expect;
const testModule = require('../../app/util/pathConverter.js');
const appRoot = require('app-root-path');
const relative = [
"./test/testDSPDir/test/.dockerfiles/complex/Dockerfile",
"./test/testDSPDir/test/.dockerfiles/complex/files/emptydir/internaldir/my.cnf",
"./test/testDSPDir/test/.dockerfiles/complex/files/emptydir/internaldir/my.cnf3"
]
const rootPath="/Users/test/git/DockerSecurityPlayground/";
describe('path converter test', () => {
  before((done) => {
    done();
  });
  beforeEach((done) => {
    done();
  });
  it('Should create relative path from a file', (done) => {
    const paths = [
      "/Users/test/git/DockerSecurityPlayground/test/testDSPDir/test/.dockerfiles/complex/Dockerfile",
      "/Users/test/git/DockerSecurityPlayground/test/testDSPDir/test/.dockerfiles/complex/files/emptydir/internaldir/my.cnf",
      "/Users/test/git/DockerSecurityPlayground/test/testDSPDir/test/.dockerfiles/complex/files/emptydir/internaldir/my.cnf3"
    ]
    const relativePaths = paths.map((p) => testModule.convertToRelative(p, rootPath));
    expect(relativePaths).to.be.eql(relative);
    done();
  });
  it('Should get dirnames from a file', (done) => {
    const  testDirname = "./test/testDSPDir/test/.dockerfiles/complex/Dockerfile";
    const right = [
      "./", "./test/", "./test/testDSPDir/", "./test/testDSPDir/test/", "./test/testDSPDir/test/.dockerfiles/", "./test/testDSPDir/test/.dockerfiles/complex/"]
    const dirnames = testModule.dirnames(testDirname)
    expect(dirnames).to.be.eql(right);
    done()
  })

  it('Should return the tree dir', (done) => {
    const testPath = "./test/testDSPDir/"
    const testPath2 = "./test/testDSPDir"
    const testRootPath = "./";
    const rightPath =  {
      "id": "./test/testDSPDir",
      "parent": "./test",
      "text": "testDSPDir",
      "content": "#",
      "type": "dir",
      'state' : {
        'opened' : true,
        'selected' : false
      }
    }
    const rightRootPath =  {
      "id": ".",
      "parent": "#",
      "text": "root",
      "content": "#",
      "type": "dir",
      'state' : {
        'opened' : true,
        'selected' : true
      }
    }
    expect(testModule.makeTreeDir(testPath)).to.be.eql(rightPath);
    expect(testModule.makeTreeDir(testPath2)).to.be.eql(rightPath);
    expect(testModule.makeTreeDir(testRootPath)).to.be.eql(rightRootPath);
    done();

  });
  it('Should return the tree structure', (done) => {
    const testPaths = [{
      file: "/Users/maintest/git/DockerSecurityPlayground/test/testDSPDir/test/.dockerfiles/complex/Dockerfile", content: "isDockerfile"},
      { file: "/Users/maintest/git/DockerSecurityPlayground/test/testDSPDir/test/.dockerfiles/complex/files/emptydir/internaldir/my.cnf", content: "isMyCnf"},
      {file: "/Users/maintest/git/DockerSecurityPlayground/test/testDSPDir/test/.dockerfiles/complex/files/emptydir/internaldir/my.cnf3",
        content: "isMyCnf3"}]
    const right = [ {
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
        content: "isDockerfile",
        icon: 'jstree-file' },
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
        content: "isMyCnf",
        type: 'textfile',
        text: "my.cnf",
        icon: "jstree-file"
      },
      { id: './files/emptydir/internaldir/my.cnf3',
        parent: './files/emptydir/internaldir',
        content: "isMyCnf3",
        type: 'textfile',
        text: "my.cnf3",
        icon: "jstree-file"
      }
    ];
    const rootPath =  "/Users/maintest/git/DockerSecurityPlayground/test/testDSPDir/test/.dockerfiles/complex/";
    const tree = testModule.getTree(testPaths, rootPath);
    // console.log(tree);
    expect(tree).to.be.eql(right);

    done();
  })

  afterEach((done) => {
    done();
  });
  after((done) => {
    done();
  });
});
