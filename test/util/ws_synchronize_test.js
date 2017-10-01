const chai = require('chai');
const expect = require('chai').expect;
const chaiFS = require('chai-fs');
const helper = require('../helper.js');
const WebSocket = require('ws');

const githubURL = 'https://github.com/giper45/testLabs.git';

describe('WEB SOCKETS GITHUB SYNC TEST', () => {
  // Get original configuration
  before(() => {
    chai.use(chaiFS);
    // Read testuser
    helper.createDSP();
  });

  // Correct setting
  it('Should  clone test github', (done) => {
    expect(helper.userRepo()).to.be.a.directory();
    const ws = new WebSocket('ws://localhost:8080');
    ws.on('open', () => {
      console.log('COnnected');
      ws.send(JSON.stringify({
        action: 'synchronize_github',
        body: {
          githubURL
        }
      }));

      ws.on('message', (message) => {
        const data = JSON.parse(message);
        if (data.status === 'success') {
          expect(helper.userRepo()).to.be.a.directory();
          expect(helper.testConfig().githubURL).to.be.eql(githubURL);
          done();
        } else if (data.status === 'error') {
          console.log(data);
          expect(false).to.be.ok;
          done();
        }
      });
    });
  });
});
