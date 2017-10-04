const Walker = require('walker');
const pathExists = require('path-exists');
const path = require('path');
const configData = require('../data/config.js');
const simpleGit = require('simple-git');
const strings = require('help-nodejs').strings;
const homedir = require('homedir');
const _ = require('underscore');

function haveToFilter(baseDir, dir) {
  const re = new RegExp(`${baseDir}/?([^/]+/?){0,1}$`);
  return re.test(dir);
}


const failAuthError = new Error('Auth failed');
failAuthError.code = -2;


module.exports = {
  clone(giturl, params, callback) {
    // const url = this.getGitUrl(giturl, params);
    const url = giturl;
    configData.getConfig((err, c) => {
      if (err) {
        callback(err);
      }
      else {
        const thePath = path.join(homedir(), c.mainDir);
        simpleGit(thePath).silent(false).clone(url, params.reponame, ['-q'], callback);
      }
    });
  },

  getRepoDirs(nameRepo, callback) {
    const repoRet = [];
    // Check error
    try {
      // Try to create if doesn't exists
      if (!pathExists.sync(nameRepo)) { callback(new Error('No exists main dir')); }
      // Explore tree
      Walker(nameRepo)
        .filterDir((dir) => haveToFilter(nameRepo, dir))
        .on('dir', (dir) => {
          const gitFile = path.join(dir, '.git');
          if (pathExists.sync(gitFile)) { repoRet.push(path.basename(dir)); }
        })
        .on('end', () => {
          // Sort by name
          const repos = _.sortBy(repoRet, (e) => e);
          callback(null, repos);
        });
    // Cannot create, launch erro
    } catch (err) {
      callback(err);
    }
  },

  getGitUrl(url, params) {
    const username = (params && params.username) ? params.username : 'git';
    const password = (params && params.password) ? params.password : 'git';

    const inside = strings.substring(url, '//', '@');
    if (inside !== '') {
      url = strings.remove(url, inside);
      // Remove inside params
      // Add after //
      url = strings.add(url, `${username}:${password}`, '//');
    } else {
      url = strings.add(url, `${username}:${password}@`, '//'); // It doesn't contain a username
    }
    return url;
  },
  pullApplication(callback) {
    simpleGit(process.env.DSP_PATH).pull(callback);
  },
  pullRepo(reponame, callback) {
    pathExists(reponame).then((ex) => {
      if (ex) {
        simpleGit(reponame).pull(callback);
      } else {
        callback(new Error('No repo dir'));
      }
    });
  },
  pushRepo(reponame, params, callback) {
    pathExists(reponame).then(ex => {
      if (ex) {
        const theRepo = simpleGit(reponame);
        theRepo
          .add(path.join(reponame, '*'))
          .addConfig('user.name', params.username)
          .addConfig('user.email', params.email)
          .commit(params.commit)
          .push(callback);
      } else {
        callback(new Error('Doesn\t exists'));
      }
    }); // End pathExists
  }
};

