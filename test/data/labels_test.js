const expect = require('chai').expect;
const labelsPath = require('../../app/data/labels.js');
const appRoot = require('app-root-path');
const promises = require('help-nodejs').promises;
const os = require('os');
const path = require('path');
const jsonfile = require('jsonfile');
const helper = require('../helper');

describe('labelsTest', () => {
  // Get original configuration
  beforeEach((done) => {
    this.labelPath = path.join(appRoot.toString(), 'test', 'data', 'labels_data', 'labels.json');
    jsonfile.writeFileSync(this.labelPath, { labels: [] });
    helper.start();
    done();
  });  // End before

  const invalidTests = [
    //  an array inside name and no descr color
    { labTest: { name: [{ testing: 'NO GOOD' }] },
      testName: ' Testing array inside name and nod  descr and color'
    },
    {
      // No name
      labTest: { nin: 'ciccio',
        description: 'descr',
        color: 'color'
      },
      testName: 'No name param'
    },
    {
      labTest: ' an error json',
      testName: 'A string in input'
    }
  ];
  // Testing with change
  invalidTests.forEach((item) => {
    it(item.testName, (done) => {
      const self = this;
      const example = { name: 'anotherLabel',
        description: ' a label description',
        color: 'red' };
      const exampleTwo = { name: 'secondLabel',
        description: ' a label description',
        color: 'blue' };
      // Init label file
      jsonfile.writeFileSync(self.labelPath, { labels: [example, exampleTwo] });
      labelsPath.changeLabel(self.labelPath, 'anotherLabel', item.labTest, (err) => {
        const newLabel = jsonfile.readFileSync(self.labelPath);
        expect(err).to.not.be.null;
        // Read labels
        // Should have save old labels
        expect(newLabel).to.be.eql({ labels: [example, exampleTwo] });
        done();
      });
    });


  });
  // Testing with add
  invalidTests.forEach((item) => {
    it(item.testName, (done) => {
      const self = this;
      const example = { name: 'anotherLabel',
        description: ' a label description',
        color: 'red' };
      const exampleTwo = { name: 'secondLabel',
        description: ' a label description',
        color: 'blue' };
      // Init label file
      jsonfile.writeFileSync(self.labelPath, { labels: [example, exampleTwo] });
      labelsPath.createLabel(self.labelPath, item.labTest, (err) => {
        const newLabel = jsonfile.readFileSync(self.labelPath);
        expect(err).to.not.be.null;
        // Read labels
        // Should have save old labels
        expect(newLabel).to.be.eql({ labels: [example, exampleTwo] });
        done();
      });
    });
  });


  // Save
  it('should save a label', (done) => {
    const self = this;
    const example = { name: 'firstExample',
      description: ' a label description',
      color: 'red' };
    labelsPath.createLabel(self.labelPath, example, (err) => {
      expect(err).to.be.null;
      labelsPath.getLabel(self.labelPath, example.name, (otherErr, obj) => {
        expect(otherErr).to.be.null;
        expect(obj).to.be.eql(example);
        done();
      });
    });
  });


  // Save more
  it('Should save 2 labels', (done) => {
    const example = { name: 'example',
      description: ' a label description',
      color: 'red' };
    const example2 = { name: 'example2',
      description: ' another description',
      color: 'blue' };
    const labels = [example, example2];
    const lt = this.labelPath;
    helper.resetUserLabels();
    labelsPath.createLabels(lt, labels, (err) => {
      expect(err).to.be.null;
      labelsPath.getLabel(lt, example.name, (errTwo, obj) => {
        expect(obj).to.be.eql(example);
        labelsPath.getLabel(lt, example2.name, (errThree, obj2) => {
          expect(obj2).to.be.eql(example2);
          done();
        });
      });
    });
  });

  // Edit
  it('Should modify name of label', (done) => {
    const example = { name: 'nuovo nome',
      description: ' a label description',
      color: 'blue' };
    const BaseName = 'example';
    labelsPath.changeLabel(this.labelPath, BaseName, example, (err) => {
      expect(err).to.be.null;
      done();
    });
  });
  // Delete
  it('Should delete the label', (done) => {
    const makerSeq = promises.seqMaker();
    makerSeq
      .addAsync(labelsPath.deleteLabel, [this.labelPath, 'nuovo nome', false])
      .addAsync(labelsPath.getLabel, [this.labelPath, 'nuovo nome'])
      .start()
      .then(() => {
        done();
      });
  });

  it('Should launch an error if null path in creation', (done) => {
    const example = { name: 'nuovo nome',
      description: ' a label description',
      color: 'blue' };
    labelsPath.createLabel(null, example, (err) => {
      expect(err).not.be.null;
      done();
    });
  });
  it('Should launch an error if null path in delete', (done) => {
    labelsPath.deleteLabel(null, null, null, (err) => {
      expect(err).not.be.null;
      done();
    });
  });
  it('Should launch an error if null path in update', (done) => {
    const example = { name: 'nuovo nome',
      description: ' a label description',
      color: 'blue' };
    labelsPath.createLabel(null, example, (err) => {
      expect(err).not.be.null;
      done();
    });
  });
  it('Should launch an error if null path in creation', (done) => {
    const example = { name: 'nuovo nome',
      description: ' a label description',
      color: 'blue' };
    labelsPath.createLabel(null, example, (err) => {
      expect(err).not.be.null;
      done();
    });
  });

  it('Should launch an error if label path is not correct', (done) => {
    const example = { name: 'nuovo nome',
      description: ' a label description',
      color: 'blue' };
    labelsPath.createLabel('hre', example, (err) => {
      expect(err).not.be.null;
      done();
    });
  });
  it('should give false for a label that does not exist', (done) => {
    labelsPath.existsLabel(path.join(os.tmpdir(), "notexistentlabel.json"), (err, isExistent) => {
      expect(err).to.be.null;
      expect(isExistent).to.be.false;
      done();
    });
  });
  it('should give true for a label that does exist', (done) => {
    labelsPath.existsLabel(path.join(os.tmpdir(), "notexistentlabel.json"), (err, isExistent) => {
      const existentLabel = path.join(appRoot.toString(), "test", "data", "labels.json");
      labelsPath.existsLabel(existentLabel, (err, isExistent) => {
        expect(err).to.be.null;
        expect(isExistent).to.be.ok;
        done();
      });
    });
  });
  // Clean
  afterEach((done) => {
    helper.end();
    done();
  });
});
