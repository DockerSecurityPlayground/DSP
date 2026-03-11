/**
 * Compatibility wrapper for jsonfile.readFile with retry logic
 * Handles race conditions where file is being written while being read
 * Retries up to 3 times with exponential backoff on JSON parse errors
 * and writes through a temp file + rename to avoid partial JSON reads.
 */

const fs = require('fs');
const path = require('path');
const jsonfile = require('jsonfile');
const appUtils = require('./AppUtils');
const log = appUtils.getLogger();

const DEFAULT_MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 100;

/**
 * Read JSON file with automatic retry on parse errors
 * @param {string} file - Path to JSON file
 * @param {number} maxRetries - Max retry attempts (default: 3)
 * @param {function} callback - (err, data) callback
 */
function readFileWithRetry(file, maxRetries = DEFAULT_MAX_RETRIES, callback) {
  if (typeof maxRetries === 'function') {
    callback = maxRetries;
    maxRetries = DEFAULT_MAX_RETRIES;
  }

  let attempts = 0;

  function attempt() {
    attempts++;
    jsonfile.readFile(file, (err, data) => {
      if (err) {
        // Check if this is a JSON parse error
        const isJsonError = err.message && 
          (err.message.includes('Unexpected token') ||
           err.message.includes('Unexpected non-whitespace') ||
           err.message.includes('JSON'));

        if (isJsonError && attempts < maxRetries) {
          const delayMs = INITIAL_DELAY_MS * Math.pow(2, attempts - 1);
          log.warn(`[JSON RETRY] Parse error on attempt ${attempts}/${maxRetries}: ${err.message}`);
          log.warn(`[JSON RETRY] Retrying in ${delayMs}ms...`);
          setTimeout(attempt, delayMs);
          return;
        }

        if (isJsonError && attempts === maxRetries) {
          log.error(`[JSON RETRY] Failed after ${maxRetries} attempts: ${err.message}`);
        }

        return callback(err);
      }

      if (attempts > 1) {
        log.info(`[JSON RETRY] Successfully read file on attempt ${attempts}/${maxRetries}`);
      }
      callback(null, data);
    });
  }

  attempt();
}

function writeFileAtomic(file, data, options = {}, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  callback = typeof callback === 'function' ? callback : () => {};

  const dir = path.dirname(file);
  const tmpFile = path.join(
    dir,
    `.${path.basename(file)}.${process.pid}.${Date.now()}.tmp`
  );

  jsonfile.writeFile(tmpFile, data, options, (writeErr) => {
    if (writeErr) {
      callback(writeErr);
      return;
    }

    fs.rename(tmpFile, file, (renameErr) => {
      if (!renameErr) {
        callback(null);
        return;
      }

      fs.unlink(tmpFile, () => {
        callback(renameErr);
      });
    });
  });
}

module.exports = {
  readFileWithRetry,
  writeFileAtomic
};
