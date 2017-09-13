'use strict';

exports.configureLogger = function(config) {
  require('./logger').configure(config);
};


Object.defineProperties(exports, {
  'Logger': {
    enumerable: true,
    get: function() {
      return require('./logger');
    }
  }
});
