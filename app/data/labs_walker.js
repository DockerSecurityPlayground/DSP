const Walker = require('walker');
const AppUtils = require('../util/AppUtils');
const path = require('path');
const stampit = require('stampit');
const EventEmitter = require('events').EventEmitter;
const async = require('async');
const LabStates = require('../util/LabStates.js');
const jsonfile = require('jsonfile');
const packageJSON =require('../../package.json')
const _ = require('underscore');
// const log = appUtils.getLogger();

const log = AppUtils.getLogger();
const MyEmitter = stampit()
  .init(function init() {
    const myEmitter = new EventEmitter();
    this.onEnded = function onEnded(cb) {
      myEmitter.on('ended', cb);
    };
    this.walkEnded = function walkEnded() {
      myEmitter.emit('ended');
    };
  });


const BaseWalker = stampit(MyEmitter).init(function init(obj) {
  this.dir = path.join(AppUtils.getHome(), obj.dir);
  this.basename = obj.dir;
  //  Those we'll be override
  this.haveToFilter = function haveToFilter() {
    return true;
  };

  this.dirFound = function dirFound() {
    return null;
  };
  this.fileFound = function fileFound() {
  };
  //  True if is the label

  this.isLabel = function isLabel(file) {
    return (file === path.join(this.dir, 'labels.json'));
  };

  this.isVersion = function isVersion(file) {
    return (file === path.join(this.dir, 'version.json'));
  }
  this.isNetwork = function isInformation(file) {
    return (file === path.join(this.dir, 'network.json'));
  };
  this.isInformation = function isInformation(file) {
    return (file === path.join(this.dir, 'information.json'));
  };
  //  Filter only one subdirectory
  this.haveToFilter = function haveToFilter(dir) {
    const baseDir = this.dir;
    const re = new RegExp(`${baseDir}/?([^/]+/?){0,1}$`);
    return re.test(dir);
  };

  this.walk = function walk() {
    const self = this;
    const baseDir = self.dir;
    Walker(baseDir)
    .filterDir((dir) => {
      const haveToFilter = self.haveToFilter(dir);
      return haveToFilter;
    })
    .on('dir', (dir) => {
      //  skip base dir
      if (dir !== baseDir) {
        self.dirFound(dir);
      }
    })
    .on('file', (file) => {
      self.fileFound(file);
    })
    .on('end', () => {
      self.walkEnded();
    });
  };
});

const LabWalker = stampit(BaseWalker)
  .init(function init() {
    this.fileFound = function fileFound(file) {
      const self = this;
      //  Label of repo
      if (this.isLabel(file)) {
        self.labels = file;
      }
      if (this.isNetwork(file)) {
        self.network = file;
      }
      if (this.isInformation(file)) {
        self.informations = file;
      }
    };
  });

const RepoWalker = stampit(BaseWalker)
    .init(function init() {
      this.labs = [];
      this.fileFound = function fileFound(file) {
        if (this.isVersion(file)) {
            this.version = file;
        }
      //  Save labels informations
        if (this.isLabel(file)) {
          this.labels = file;
        }
      };

      //  Every dir into repo dir
      this.dirFound = function dirFound(dir) {
        const self = this;
        //  Explore labs
        AppUtils.isDSPDir(dir, (exists) => {
          if (exists) {
            const name = path.basename(dir);
            const p = path.join(self.basename, path.basename(dir));
            const lw = LabWalker({ dir: p, name });
            self.labs.push({ name, lab: lw });
          }
        });
      };
    });

const DSPWalker = stampit(BaseWalker)
.init(function init() {
  const self = this;
  this.repos = [];
  //  A repo
  this.dirFound = function dirFound(dir) {
    //  Explore labs
    AppUtils.isDSPDir(dir, (exists) => {
      if (exists) {
        const name = path.basename(dir);
        const p = path.join(self.basename, path.basename(dir));
        const rw = RepoWalker({ dir: p });
        self.repos.push({ name, repo: rw });
      }
    });
  };
});

const DSPWalk = stampit(MyEmitter)
.methods({
  walk(dir) {
    const dspw = DSPWalker({ dir });
    const retObj = {};
    const self = this;
    async.waterfall([
      //  Walk main dspwalker
      (cb) => {
        dspw.walk();
        dspw.onEnded(() => cb(null));
      },
      //  For each repo
      (cb) => {
        const repos = dspw.repos;
        //  Each repo
        async.each(repos, (ele, callback) => {
          ele.repo.walk();
          ele.repo.onEnded(() => callback(null));
        }, (err) => cb(err));
      },
      //  For each lab
      (cb) => {
        let labs = [];
        //  Take all labs
        _.each(dspw.repos, (ele) => {
          labs = labs.concat(ele.repo.labs);
        });
        //  walk each lab
        async.each(labs, (ele, callback) => {
          ele.lab.walk();
          ele.lab.onEnded(() => callback(null));
        },
          //  Finish labs loaded
          (err) => cb(err || null));
      },
      //  convert all repo files
      (cb) => {
        retObj.repos = [];
        const repos = dspw.repos;
        async.each(repos, (ele, callback) => {
          const r = { name: ele.name };
          r.labs = ele.repo.labs;
          const labelFile = ele.repo.labels;
          const versionFile = ele.repo.version;
          async.waterfall([
              // Read label file
              (cb) => {
                if (labelFile) {
                  jsonfile.readFile(labelFile, cb);
                }
                else {
                  cb(null)
                }
              },
              (json, cb) => {
                //  Parsing error
                if (json && json.labels) {
                  r.labels = json.labels;
                }
                cb(null)
              },
              // Read version file
              (cb) => {
                if (versionFile) {
                  jsonfile.readFile(versionFile, cb)
                }
                else cb(null, null)
              },
              (json, cb) => {
                if (json && json.version) r.version = json.version
                cb(null)
                }], (err) => {
                retObj.repos.push(r);
                callback(err);
              })
        },
          (err) => cb(err || null));
      },
      //  Convert all lab files
      (cb) => {
        //  log.info("convert all lab files")
        let repos = retObj.repos;
        //  Sort repos by name
        repos = _.sortBy(repos, 'name');
        retObj.repos = repos;
        retObj.version = packageJSON.version;
        //  For each repo
        async.each(repos, (r, repocallback) => {
          let labs = r.labs;
          // Sort labs by name
          labs = _.sortBy(labs, 'name');
          const arrLabs = [];
          async.each(labs, (ele, callback) => {
            const l = { name: ele.name };
            // inner parallel
            async.parallel({
              // Informations
              informations(c) {
                const fileInfo = ele.lab.informations;
                if (fileInfo) {
                  jsonfile.readFile(fileInfo, c);
                // File error
                } else {
                  c(null);
                }
              },
              state(c) {
                // log.info(`Taking state of ${r.name}/${l.name}`);
                const state = LabStates.getState(r.name, l.name, c);
              },
              labels(c) {
                const fileLabels = ele.lab.labels;
                if (fileLabels) {
                  jsonfile.readFile(fileLabels, c);
                } else {
                // File error
                  c(null, { labels: [] });
                }
              },
            },
            // Loaded files
            (err, results) => {
              l.labels = results.labels.labels;
              l.informations = results.informations;
              l.state = results.state;
              // log.warn(l.state);
              arrLabs.push(l);
              callback(null);
            });
          }, () => {
            r.labs = arrLabs;
            r.isCollapsed = true;
            repocallback(null);
          });
        },
          // End repos
          () => cb(null));
      },
    ], () => {
      self.object = retObj;
      self.walkEnded();
    });
  },
});

exports.create = () => {
  const ret = DSPWalk.create();
  return ret;
};

