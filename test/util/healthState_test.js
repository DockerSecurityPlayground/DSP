const chai = require('chai');
const path = require('path');
const helper = require('../helper');
const _ = require('underscore');
const jsonfile = require('jsonfile');
const chaiFS = require('chai-fs');
const chaiJSON = require('chai-json');

const healthState = require('../../app/util/HealthLabState.js');

const expect = chai.expect;
const stateFile = path.join(helper.projectTestDir(), 'lab_states.json');
let testHealth;

describe.only('LAB STATE TEST', () => {
  before(function d(done) {
    console.log('Test states:');
    if (!helper.isTestEnabled()) {
      console.error('Test is not enabled');
      this.skip();
    }
    testHealth = jsonfile.readFileSync('test/util/test_health.json');
    chai.use(chaiFS);
    chai.use(chaiJSON);
    helper.createDSP();
    done();
  });

  it('health test', (done) => {

    expect(stateFile, 'lab_states.json').to.be.a.jsonFile();
    healthState.run((err) => {
      expect(err).to.be.null;
      _.each(testHealth, (ele) => {
        expect(stateFile).to.be.jsonFile().and.contain.jsonWithProps({ repoName: ele.repoName,
          labName: ele.labName });
      });
      done();
    });
  });
});
