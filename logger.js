// used for `require('atlasutils/middleware')` - source in ./src
let logger = require('./dist/lib/logger');

let Logger = logger.default;

function defaultExport(filename) {
  return new Logger(filename);
}
defaultExport.log = Logger.log;
defaultExport.silly = Logger.silly;
defaultExport.debug = Logger.debug;
defaultExport.info = Logger.info;
defaultExport.warn = Logger.warn;
defaultExport.error = Logger.error;

defaultExport.configure = logger.configure;

module.exports = defaultExport;