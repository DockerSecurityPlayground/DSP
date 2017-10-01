const expect = require('chai').expect;

const chai = require('chai');
const chaiHTTP = require('chai-http');
const helper = require('../helper');

const nameTestLab = 'networkTestDir';
const nameTestLab2 = 'anotherNetwork';
const nameTestLab3 = 'networkTestDir2';

const chaiFS = require('chai-fs');

chai.use(chaiHTTP);
const testObj = {
  canvasJSON: '{"objects":[{"type":"group","originX":"left","originY":"top","left":328,"top":123,"width":259.75,"height":101,"fill":"rgb(0,0,0)","stroke":null,"strokeWidth":0,"strokeDashArray":null,"strokeLineCap":"butt","strokeLineJoin":"miter","strokeMiterLimit":10,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"clipTo":null,"backgroundColor":"","fillRule":"nonzero","globalCompositeOperation":"source-over","transformMatrix":null,"skewX":0,"skewY":0,"objects":[{"type":"text","originX":"left","originY":"top","left":-29.88,"top":-50.5,"width":70.02,"height":16.95,"fill":"rgb(0,0,0)","stroke":null,"strokeWidth":1,"strokeDashArray":null,"strokeLineCap":"butt","strokeLineJoin":"miter","strokeMiterLimit":10,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"clipTo":null,"backgroundColor":"","fillRule":"nonzero","globalCompositeOperation":"source-over","transformMatrix":null,"skewX":0,"skewY":0,"text":"Container1","fontSize":15,"fontWeight":"bold italic","fontFamily":"Times New Roman","fontStyle":"","lineHeight":1.16,"textDecoration":"","textAlign":"left","textBackgroundColor":"","charSpacing":0},{"type":"image","originX":"left","originY":"top","left":-49.88,"top":-20.5,"width":100,"height":71,"fill":"rgb(0,0,0)","stroke":null,"strokeWidth":0,"strokeDashArray":null,"strokeLineCap":"butt","strokeLineJoin":"miter","strokeMiterLimit":10,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"clipTo":null,"backgroundColor":"","fillRule":"nonzero","globalCompositeOperation":"source-over","transformMatrix":null,"skewX":0,"skewY":0,"crossOrigin":"","alignX":"none","alignY":"none","meetOrSlice":"meet","src":"http://localhost:8080/assets/docker_image_icons/host.png","filters":[],"resizeFilters":[]},{"type":"text","originX":"left","originY":"top","left":-129.88,"top":-20.5,"width":78.19,"height":16.95,"fill":"black","stroke":null,"strokeWidth":1,"strokeDashArray":null,"strokeLineCap":"butt","strokeLineJoin":"miter","strokeMiterLimit":10,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"clipTo":null,"backgroundColor":"","fillRule":"nonzero","globalCompositeOperation":"source-over","transformMatrix":null,"skewX":0,"skewY":0,"text":"192.168.11.2","fontSize":15,"fontWeight":"normal","fontFamily":"Times New Roman","fontStyle":"","lineHeight":1.16,"textDecoration":"","textAlign":"left","textBackgroundColor":"","charSpacing":0},{"type":"text","originX":"left","originY":"top","left":50.13,"top":-20.5,"width":78.75,"height":16.95,"fill":"black","stroke":null,"strokeWidth":1,"strokeDashArray":null,"strokeLineCap":"butt","strokeLineJoin":"miter","strokeMiterLimit":10,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"clipTo":null,"backgroundColor":"","fillRule":"nonzero","globalCompositeOperation":"source-over","transformMatrix":null,"skewX":0,"skewY":0,"text":"192.168.12.2","fontSize":15,"fontWeight":"normal","fontFamily":"Times New Roman","fontStyle":"","lineHeight":1.16,"textDecoration":"","textAlign":"left","textBackgroundColor":"","charSpacing":0}]}]} ',

  networkList: [
    { name: 'Rete1', subnet: '192.168.1.1', color: 'black', $$hashKey: 'object:45' },
    { name: 'Rete2', subnet: '192.168.11.1', color: 'black', $$hashKey: 'object:50' }],
  clistDrawed: [{ name: 'Container2', selectedImage: 'image', networks: { Rete1: { ip: '192.168.1.3', isChecked: true, position: 'right' }, Rete2: { ip: '192.168.11.2', isChecked: true, position: 'right' } }, $$hashKey: 'object:2144' }],
  clistNotDrawed: [{ name: 'Container1', selectedImage: 'image', networks: { Rete1: { ip: '192.168.1.2', isChecked: true, position: 'right' }, Rete2: { ip: '192.168.11.2', isChecked: false, position: 'right' } }, $$hashKey: 'object:1099' }],

};

const api = `${helper.api}/docker_network/${nameTestLab}`;
const api2 = `${helper.api}/docker_network/${nameTestLab2}`;
const api3 = `${helper.api}/docker_network/${nameTestLab3}`;
describe('API Network Testing', () => {
  before(function d(done) {
    const self = this;
    helper.createDSP();
    if (!helper.isTestEnabled()) {
      console.error('Pls set test to true before');
      self.skip();
    }
    chai.use(chaiFS);
    done();
  });

  it('should save data', (done) => {
    chai.request(helper.localhost)
    .post(api)
    .send(testObj)
    .end((err) => {
      console.log(err);
      expect(err).to.be.null;
      done();
    });
  });

  it('should read correct data', (done) => {
    const apiGet = `${helper.api}/docker_network/${helper.userRepoName()}/${nameTestLab}`;
    chai.request(helper.localhost)
      .get(apiGet)
      .end((err, res) => {
        expect(err).to.be.null;
        const ret = res.body.data;
        expect(ret.canvasJSON).to.be.eql(testObj.canvasJSON);
        expect(ret.clistDrawed).to.be.eql(testObj.clistDrawed);
        expect(ret.clistNotDrawed).to.be.eql(testObj.clistNotDrawed);
        // expect(ret).to.be.eql(testObj)
        done();
      });
  });

  it('should save data with empty clistDrawed', (done) => {
    const newTestObj = testObj;
    newTestObj.clistDrawed = [];
    chai.request(helper.localhost)
    .post(api2)
    .send(newTestObj)
    .end((err) => {
      expect(err).to.be.null;
      done();
    });
  });
  it('should save data with empty clistNotDrawed', (done) => {
    const newTestObj = testObj;
    newTestObj.clistNotDrawed = [];
    chai.request(helper.localhost)
    .post(api2)
    .send(newTestObj)
    .end((err) => {
      expect(err).to.be.null;
      done();
    });
  });
  it('should save data with name lab with numbers', (done) => {
    const newTestObj = testObj;
    newTestObj.clistNotDrawed = [];
    chai.request(helper.localhost)
    .post(api3)
    .send(newTestObj)
    .end((err) => {
      expect(err).to.be.null;
      done();
    });
  });
  after(() => {
  });
});
