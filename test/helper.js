const appRoot = require('app-root-path');
const execSync = require('child_process').execSync;
const path = require('path');
const jsonfile = require('jsonfile');
const fs = require('fs');
const proxyquire = require('proxyquire')
const homedir = require('homedir');
const sinon = require ('sinon');
const stub = sinon.stub;

const appUtils  = require('../app/util/AppUtils.js');
const dspProjects = 'DSP_Projects';
const localhost = 'http://localhost:8080';
const api = '/dsp_v1';
let pathStub;
let pathHome;

const mkdir = (dir) => {
  // making directory without exception if exists
  try {
    fs.mkdirSync(dir);
  } catch (e) {
    if (e.code !== 'EEXIST') {
      throw e;
    }
  }
};

const rmdir = (dir) => {
  if (fs.existsSync(dir)) {
    const list = fs.readdirSync(dir);
    for (let i = 0; i < list.length; i += 1) {
      const filename = path.join(dir, list[i]);
      const stat = fs.statSync(filename);

      if (filename === '.' || filename === '..') {
      // pass these files
      } else if (stat.isDirectory()) {
      // rmdir recursively
        rmdir(filename);
      } else {
      // rm fiilename
        fs.unlinkSync(filename);
      }
    }
    fs.rmdirSync(dir);
  } else {
    console.warn(`warn: ${dir} not exists`);
  }
};


const copy = (src, dest) => {
  const oldFile = fs.createReadStream(src);
  const newFile = fs.createWriteStream(dest);
  oldFile.pipe(newFile);
};
const copyDir = (src, dest) => {
  mkdir(dest);
  const files = fs.readdirSync(src);
  for (let i = 0; i < files.length; i += 1) {
    const current = fs.lstatSync(path.join(src, files[i]));
    if (current.isDirectory()) {
      copyDir(path.join(src, files[i]), path.join(dest, files[i]));
    } else if (current.isSymbolicLink()) {
      const symlink = fs.readlinkSync(path.join(src, files[i]));
      fs.symlinkSync(symlink, path.join(dest, files[i]));
    } else {
      copy(path.join(src, files[i]), path.join(dest, files[i]));
    }
  }
};

module.exports = {
  localhost,
  api,
  exec(cmd) {
    execSync(cmd, {stdio: 'inherit'});
  },
  testConfig() {
    return jsonfile.readFileSync(path.join(appRoot.toString(), 'config', 'test_user.json'));
  },
  userRepoName() {
    return 'test';
  },
  projectTestDir() {
    return path.join(appRoot.toString(), 'test', 'testDSPDir');
  },
  userRepo() {
    return path.join(this.projectTestDir(), this.userRepoName());
  },
  dspProjects,
  // enableTestMode() {
  //   const localConfigPath = path.join(appRoot.path, 'config', 'local.config.json');
  //   const configurationFile = jsonfile.readFileSync(localConfigPath);
  //   console.log('setting test mode');
  //   configurationFile.config.test = true;
  //   jsonfile.writeFileSync(localConfigPath, configurationFile, { spaces: 32 });
  // },
  // disableTestMode() {
  //   const localConfigPath = path.join(appRoot.path, 'config', 'local.config.json');
  //   const configurationFile = jsonfile.readFileSync(localConfigPath);
  //   configurationFile.config.test = false;
  //   jsonfile.writeFileSync(localConfigPath, configurationFile);
  // },
  getStates() {
    const thePath = path.join(this.projectTestDir(), 'lab_states.json');
    return jsonfile.readFileSync(thePath);
  },
  removeTestConfig() {
    const oldPath = path.join(appRoot.toString(), 'config', 'test_user.json');
    if (fs.existsSync(oldPath)) fs.unlink(oldPath);
  },
  bkupUserConfig() {
    const oldPath = path.join(appRoot.toString(), 'config', 'config_user.json');
    const newPath = path.join(appRoot.toString(), 'config', 'bkup.json');
    const data = fs.readFileSync(oldPath, 'utf-8');
    fs.writeFileSync(newPath, data);
  },
  restoreTestConfig() {
    const oldPath = path.join(appRoot.toString(), 'config', 'test_bkup.json');
    const newPath = path.join(appRoot.toString(), 'config', 'test_user.json');
    if (fs.existsSync(oldPath)) { fs.renameSync(oldPath, newPath); }
  },
  restoreUserConfig() {
    const oldPath = path.join(appRoot.toString(), 'config', 'bkup.json');
    const newPath = path.join(appRoot.toString(), 'config', 'config_user.json');
    if (fs.existsSync(oldPath)) { fs.renameSync(oldPath, newPath); }
  },
  readUserConfig() {
    return jsonfile.readFileSync(path.join(appRoot.toString(), 'config', 'config_user.json'));
  },
  readTestConfig() {
    return jsonfile.readFileSync(path.join(appRoot.toString(), 'test', 'test_user.json'));
  },
  existsTestConfig() {
    const ucp = path.join(appRoot.toString(), 'config', 'test_user.json');
    return fs.existsSync(ucp);
  },
  existsUserConfig() {
    const ucp = path.join(appRoot.toString(), 'config', 'config_user.json');
    return fs.existsSync(ucp);
  },
  removePath(testPath) {
    if (fs.existsSync(testPath)) rmdir(testPath);
  },
  initStubs() {
    // Create file config
    const jsonPath = path.join(appRoot.toString(), 'test', 'test_user.json');
    // Stub path_userconfig
    pathStub = stub(appUtils, 'path_userconfig')
    pathStub.callsFake(() => jsonPath)
    pathHome = stub(appUtils, 'getHome')
    pathHome.callsFake(() => path.join(appRoot.toString(), 'test'))
  },
  start() {
    const testConfig = {
      name: 'test',
      mainDir: 'testDSPDir',
      githubURL: 'https://github.com/giper45/DSP_Repo.git',
      tmpDir: path.join(appRoot.toString(), 'test', 'tmpDir')
    };
    // Create file config
    const jsonPath = path.join(appRoot.toString(), 'test', 'test_user.json');
    jsonfile.writeFileSync(jsonPath, testConfig);
    const proxy = proxyquire('module', {
      'hd' : homedir
    });
    if (!pathStub) {
      this.initStubs()
    }
    const projectTestOrig = path.join(appRoot.toString(), 'test', 'testDSPDir_orig');
    const projectTestDir = path.join(appRoot.toString(), 'test', 'testDSPDir');
    copyDir(projectTestOrig, projectTestDir)
    const execFile = path.join(projectTestDir, "test", ".dockerfiles", "complex", "files", "emptydir", "internaldir", "my.cnf");
    fs.chmodSync(execFile,'755');
    // const testConfigPath = path.join(appRoot.path, 'config', 'test_user.json');
    // jsonfile.writeFileSync(testConfigPath, testConfig);
    // simpleGit(testConfig.mainDir).silent(false).clone(testConfig.githubURL, testConfig.name, ['-q'], cb);
  },

  end() {
    const projectTestDir = path.join(appRoot.toString(), 'test', 'testDSPDir');
    if (fs.existsSync(projectTestDir)) {
      rmdir(projectTestDir);
      fs.unlinkSync(path.join(appRoot.toString(), 'test', 'test_user.json'));
    }
  },
  resetUserLabels() {
    jsonfile.writeFileSync(path.join(this.userRepo(), 'labels.json'), { labels: [] });
  },


};
