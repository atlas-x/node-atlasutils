// used for `require('atlasutils/logger')` - source in ./src
let logger = require('./dist/logger');
let _ = require('lodash');

function exportFunction(filename) {
  return new logger.Logger(filename);
}

let Logger = logger.Logger;
exportFunction.Logger = Logger;

for (let method of Object.getOwnPropertyNames(Logger)) {
  if (_.isFunction(Logger[method])) {
    exportFunction[method] = Logger[method].bind(Logger);
  } else {
    exportFunction[method] = Logger[method];
  }
}

module.exports = exportFunction;
