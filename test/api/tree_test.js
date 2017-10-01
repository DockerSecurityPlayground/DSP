const expect = require('chai').expect;
const chai = require('chai');
const chaiHTTP = require('chai-http');
const chaiFS = require('chai-fs');
const fs = require('fs');
const path = require('path');
const homedir = require('homedir');
const jsonfile = require('jsonfile');
const helper = require('../helper');
const appRoot = require('app-root-path');

const localConfig = require(`${appRoot}/config/local.config.json`);


const localhost = 'http://localhost:8080';
const api = '/api/tree/';


const testFiles = ['testfile'];


describe('API TREE ROUTES TEST', () => {
  // Get original configuration
  before(() => {
    chai.use(chaiHTTP);
    chai.use(chaiFS);
    // Reponame
    const mainDir = jsonfile.readFileSync(path.join(appRoot.toString(), 'config', 'test_user.json')).mainDir;
    const name = jsonfile.readFileSync(path.join(appRoot.toString(), 'config', 'test_user.json')).name;
    this.repoName = name;
    this.repoPath = path.join(homedir(), mainDir, this.repoName);
    this.dataPath = path.join(this.repoPath, '.data');
    this.testFilesPath = path.join(appRoot.toString(), 'test', 'api', 'files');

    testFiles.forEach((f) => {
      if (fs.existsSync(path.join(this.dataPath, f))) fs.unlinkSync(path.join(this.dataPath, f));
    });


    if (!localConfig.config.test) {
      console.error('Set test mode first');
      this.skip();
    }
  });


  // Correct setting
  it('Should save a file inside local repo directory', (done) => {
    const self = this;
    const filePath = path.join(this.testFilesPath, testFiles[0]);
    const str = fs.readFileSync(filePath, 'utf-8');
    chai.request(localhost)
      .post(`${api}repo`)
      .send({ file: filePath })
      .end((err) => {
        console.log(err);
        expect(err).to.be.null;
        expect(path.join(self.dataPath, testFiles[0])).to.be.a.file().with.contents(str);
        done();
      });
  });

  after(() => {
  });
});
