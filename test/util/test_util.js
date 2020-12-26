const chai = require('chai');
const rimraf = require('rimraf');
const fs = require('fs');
const chaiFS = require('chai-fs');
const appRoot = require('app-root-path');
const AppUtils = require('../../app/util/AppUtils.js');
const path = require('path');
const baseUtilDir = path.join(appRoot.toString(), 'test', 'util');


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
        'helloDir': {/** empty directory */},
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

  it('Should check if it is a yaml file', () => {
    const yaml = "test:\n  services"
    expect(AppUtils.isYaml(yaml)).be.ok;
  });
  it('Should check if it is an invalid yaml file', () => {
    const html = "<html><b>hello</b></html>"
    expect(AppUtils.isYaml(html)).be.false;

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
  it('Should get file', (done) => {
    const content = fs.readFileSync(path.join(basePath, 'helloworld.txt'));
    const src = path.join(basePath, 'helloworld.txt');
    AppUtils.getFile(src, (err, ret) => {
      expect(err).to.be.null;
      expect(ret).to.be.eql(content);
      done();
      // expect(ret).to.be.file().and.equal(src);
    });
  });

  it('Shouold give error is getFile is not exist', (done) => {
    AppUtils.getFile(path.join(basePath, 'helloDirNot'), (err) => {
      expect(err).not.to.be.null;
      done();
    })
  });

  it('Shouold give error is getFile is not a file', (done) => {
    AppUtils.getFile(path.join(basePath, 'helloDir'), (err) => {
      expect(err).not.to.be.null;
      done();
    })

  });
});
