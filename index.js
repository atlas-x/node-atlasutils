'use strict';

exports.configureLogger = function(config) {
  require('./logger').configure(config);
};

exports.configureMiddleware = function(config) {
  require('./middleware').configure(config);
};

exports.configureErrors = function(config) {
  require('./errors').configure(config);
};

Object.defineProperties(exports, {
  'Logger': {
    enumerable: true,
    get: function() {
      return require('./logger');
    }
  },

  'Errors': {
    enumerable: true,
    get: function() {
      return require('./errors');
    }
  },

  'Middleware': {
    enumerable: true,
    get: function() {
      return require('./middleware');
    }
  }
});
