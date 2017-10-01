const expect = require('chai').expect;
const chai = require('chai');
const chaiHTTP = require('chai-http');
const appRoot = require('app-root-path');
// const path = require('path');

const localConfig = require(`${appRoot}/config/local.config.json`);
const localhost = 'http://localhost:8080';
const labelDir = 'labelTestDir';
const helper = require('../helper');

const api = `${helper.api}/labels`;
const labelRepoJSON = '[{"name":"Label Green","description":"Green","color":"#7cba8d"},{"name":"Label Red","description":"Red","color":"red"}] ';
const repoLabel = JSON.parse(labelRepoJSON);
// const repoTest = path.join(helper.projectTestDir, 'label_test_repo');
const repoTestName = 'label_test_repo';

const newLabelJSON = '{"name":"New label","description":"a new label","color":"blue"}';
const newLabel = JSON.parse(newLabelJSON);


describe('label api test', () => {
  before(function d() {
    chai.use(chaiHTTP);
    // READ USERNAME
    if (!localConfig.config.test) {
      console.error('Pls set test to true before');
      this.skip();
    }
    helper.createDSP();
  });


  // GET LABELS REPO
  it('Should give labels repo correct', (done) => {
    const url = `${api}/${repoTestName}`;
    chai.request(helper.localhost)
    .get(url)
    .end((err, res) => {
      expect(err).to.be.null;
      expect(res.body.data.labels).to.be.defined;
      const labels = res.body.data.labels;
      expect(labels).to.be.eql(repoLabel);
      done();
    });
  });


  // GET LABELS LAB
  it('Should give labels lab correct', (done) => {
    const url = `${api}/${repoTestName}/${labelDir}`;
    chai.request(localhost)
    .get(url)
    .end((err) => {
      expect(err).to.be.null;
      done();
    });
  });

  it('Should add a label and  update label', (done) => {
    const url = `${api}/${repoTestName}`;
    // Create
    chai.request(localhost)
    .post(url)
    .send(newLabel)
    .end((err) => {
      expect(err).to.be.null;
      chai.request(localhost)
      // Get labels of repo
      .get(url)
      .end((innerErr, res) => {
        expect(innerErr).to.be.null;
        expect(res.body.data.labels).to.contain(newLabel);
        done();
      });
    });
  });

  it('When a label is deleted should delete the label from all the labs', (done) => {

  });


  it('Should delete a label with space name', (done) => {
    const url = `${api}/${repoTestName}`;
    const nameLabel = 'New label';

    chai.request(localhost)
      .delete(`${url}/${nameLabel}`)
      .end((err) => {
        expect(err).to.be.null;
        chai.request(localhost)
        // Get labels of repo
        .get(url)
        .end((innerErr, res) => {
          expect(innerErr).to.be.null;
          expect(res.body.data.labels).not.to.contain(newLabel);
          done();
        });
      });
  });

  after(() => {
  });
});
