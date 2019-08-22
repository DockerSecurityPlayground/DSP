const chai = require('chai');

const expect = chai.expect;
const dockerImages = require('../../app/data/docker-images');
const dockerActions = require('../../app/data/docker_actions.js');
const path = require('path');
const appRoot = require('app-root-path');
const chaiThings = require('chai-things');
const jsonfile = require('jsonfile');

describe('DOCKER TEST', () => {
  before((done) => {
    chai.should();
    chai.use(chaiThings);
    done();
  });


  // Should get images
  it('Each image must have required parameters : name , icon, Id', (done) => {
    dockerImages.getListImages((err, data) => {
      expect(err).to.be.null;
      data.should.all.have.property('Id');
      data.should.all.have.property('icon');
      data.should.all.have.property('name');
      done();
    });
  });
  it.skip('Checking actions async with update images', (done) => {
    const data = jsonfile.readFileSync(path.join(appRoot.path, 'test', 'data', 'files', 'test_actions.json'));
    dockerActions.getActions(data.clistDrawed, (err, actions) => {

      // console.log(actions);
      done();
    });
  });

  it.skip('Checking actions sync', (done) => {
    const data = jsonfile.readFileSync(path.join(appRoot.path, 'test', 'data', 'files', 'test_actions.json'));
    done();
  });
});
