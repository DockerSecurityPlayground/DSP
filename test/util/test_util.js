const chai = require('chai');
const rimraf = require('rimraf');
const fs = require('fs');
const chaiFS = require('chai-fs');
const appRoot = require('app-root-path');
const AppUtils = require('../../app/util/AppUtils.js');
const path = require('path');


// const basePath = path.join(appRoot.path, 'test', 'util');
const basePath = "/basePath";
const expect = chai.expect;



describe('Test Util ', () => {
  before((done) => {
    chai.use(chaiFS);
    const mock = require('mock-fs');

    mock({
      '/basePath': {
        'helloworld.txt': 'filecontent',
        'helloDir': {/** empty directory */}
      }
    });
    const dst = path.join(basePath, 'twoHello.txt');
    const dstDir = path.join(basePath, 'twoHelloDir');
    if (fs.existsSync(dst)) fs.unlinkSync(dst);
    if (fs.existsSync(dstDir)) {
      rimraf(dstDir, (err) => {
        expect(err).to.be.null;
        done();
      });
    }
    else  done();
  });
  it('Should copy file', (done) => {
    const src = path.join(basePath, 'helloworld.txt');
    const dst = path.join(basePath, 'twoHello.txt');
    AppUtils.copy(src, dst, (err) => {
      expect(err).to.be.null;
      expect(dst).to.be.a.file()
        .and.equal(src);
      done();
    });
  });
  it('Should copy dir', (done) => {
    const src = path.join(basePath, 'helloDir');
    const dst = path.join(basePath, 'twoHelloDir');
    AppUtils.copy(src, dst, (err) => {
      expect(err).to.be.null;
      expect(dst).to.be.a.directory()
        .and.equal(src);
      done();
    });
  });
});
