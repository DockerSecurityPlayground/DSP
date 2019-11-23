const expect = require('chai').expect;
// const helper = require('../helper');
const testModule = require('../../app/data/docker-tools.js');
// const appRoot = require('app-root-path');

describe('Docker tools', () => {
before((done) => {
  done();
});
beforeEach((done) => {
  done();
});
it('Should Give hack tool', (done) => {
  //       "name": "uzyexe/nmap",
  // "tag": "latest",
  // "description": "nmap container image",
  // "default_command": "-sT localhost"
  const nmap = testModule.get("nmap");
  expect(nmap.label).to.be.equal("nmap")
  expect(nmap.tag).to.be.equal("latest")
  expect(nmap.default_command).to.be.equal("-sT localhost")
  expect(nmap.default_options).to.be.eql({})
  done()

});
it('Should run exception if hackttool does not exists', (done) => {
  expect(() => testModule.get("notexistenthel")).to.throw();
  done()

});
it('Should get default options', (done) => {
  const tcpdump = testModule.get("tcpdump");

  expect(tcpdump.default_options).to.be.eql({
    privileged: true
  })
  expect(true).to.be.ok;
  done();
});

afterEach((done) => {
  done();
});
after((done) => {
  done();
});
});
