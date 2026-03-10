const rimrafLib = require('rimraf');

function removePath(targetPath, callback) {
  if (typeof callback !== 'function') {
    throw new TypeError('removePath requires a callback');
  }

  if (typeof rimrafLib === 'function') {
    rimrafLib(targetPath, callback);
    return;
  }

  if (rimrafLib && typeof rimrafLib.rimraf === 'function') {
    rimrafLib.rimraf(targetPath)
      .then(() => callback(null))
      .catch((err) => callback(err));
    return;
  }

  callback(new TypeError('rimraf API not supported'));
}

function removePathSync(targetPath) {
  if (rimrafLib && typeof rimrafLib.sync === 'function') {
    rimrafLib.sync(targetPath);
    return;
  }

  if (rimrafLib && typeof rimrafLib.rimrafSync === 'function') {
    rimrafLib.rimrafSync(targetPath);
    return;
  }

  if (typeof rimrafLib === 'function') {
    throw new TypeError('rimraf sync API not available');
  }

  throw new TypeError('rimraf API not supported');
}

module.exports = {
  removePath,
  removePathSync,
};
