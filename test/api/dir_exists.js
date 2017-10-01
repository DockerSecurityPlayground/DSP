const expect = require('chai').expect;
const path = require('path');
const appRoot = require('app-root-path');

const localConfig = require(`${appRoot}/config/local.config.json`);
const chai = require('chai');
const chaiHTTP = require('chai-http');
const helper = require('../helper');

chai.use(chaiHTTP);
const url = helper.localhost;
const api = `${helper.api}/dir_exists`;

describe('DIR EXISTS API', () => {
  // Get original configuration
  before(function d() {
    if (!localConfig.config.test) {
      console.error('Pls set test to true before');
      this.skip();
    }
    helper.createDSP();
  });

  it('Check a file that exists', (done) => {
    const obj = { filename: path.join(appRoot.path, 'test', 'api') };
    chai.request(url)
      .post(api)
      .send(obj)
      .end((err, res) => {
        expect(err).to.be.null;
        const exists = res.body.data;
        expect(exists).to.be.ok;
        done();
      });
  });

  it("Check a file that doesn't exists", (done) => {
    const obj = { filename: '/Users/ciccio/DockerSecPlayground/managment_projects/test/api' };
    chai.request(url)
      .post(api)
      .send(obj)
      .end((err, res) => {
        expect(err).to.be.null;
        const exists = res.body.data;
        expect(exists).not.to.be.ok;
        done();
      });
  });

  after((done) => {
    done();
  });
});
