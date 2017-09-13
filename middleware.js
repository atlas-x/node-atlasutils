let errors = require('./errors');
let _ = require('lodash');


let CONFIG = {
  log: ['serverError'],
  logger: console
};


function logifenabled(args, method, warn) {
  if (!CONFIG.log.includes(method)) {
    return;
  }
  args = Array.prototype.slice.call(args);
  let type = 'error';
  if (warn) {
    type = 'warn';
  }
  CONFIG.logger[type].apply(CONFIG.logger, args);
}

function middleware(req, res, next) {
  
  res.handleError = res.handleErrors = function(error) {
    error = errors.normalizeError(error);
    if (error instanceof errors.UserError) {
      return res.userError(error);
    } else if (error instanceof errors.UnauthorizedError) {
      return res.unauthorized(error);
    } else if (error instanceof errors.ForbiddenError) {
      return res.forbidden(error);
    } else if (error instanceof errors.NotFoundError) {
      return res.notFound(error);
    } else {
      return res.serverError(error);
    }
  };

  res.expectsJSON = function() {
    return expectsJSON(req);
  };

  res.userError = function(data) {
    logifenabled(arguments, 'userError', true);
    let error = extractDetails.apply(null, arguments);
    if (!error.message) { error.message = 'Bad Request'; }
    if (!error.status) { error.status = 400; }
    return sendError(req, res, 400, error);
  };
  res.badRequest = res.userError;
  
  res.unauthorized = function(data) {
    logifenabled(arguments, 'unauthorized', true);
    let error = extractDetails.apply(null, arguments);
    if (!error.message) { error.message = 'Unauthorized'; }
    if (!error.status) { error.status = 401; }
    return sendError(req, res, 401, error);
  };

  res.forbidden = function(data) {
    logifenabled(arguments, 'forbidden', true);
    let error = extractDetails.apply(null, arguments);
    if (!error.message) { error.message = 'Forbidden'; }
    if (!error.status) { error.status = 403; }
    return sendError(req, res, 403, error);
  };

  res.notFound = function(data) {
    logifenabled(arguments, 'notFound', true);
    let error = extractDetails.apply(null, arguments);
    if (!error.message) { error.message = 'Not Found'; }
    if (!error.status) { error.status = 404; }
    return sendError(req, res, 404, error);
  };

  res.serverError = function(data) {
    if (data && data instanceof errors.DoneError) {
      return;
    }
    logifenabled(arguments, 'serverError', false);
    let error = extractDetails.apply(null, arguments);
    if (!error.message) { error.message = 'Server Error'; }
    if (!error.status) { error.status = 500; }
    return sendError(req, res, 500, error);
  };

  next();
}


function extractDetails(...args) {
  let error = {};
  if (args.length > 2) {
    error.status = args[0];
    error.message = args[1];
    error.data = args[2];
  } else if (args.length > 1) {
    error.status = args[0];
    error.message = args[1];
  } else {
    let arg = args[0];
    if (typeof arg === 'string') {
      error.message = arg;
    } else if (typeof arg === 'number') {
      error.status = arg;
    } else if (arg instanceof Object) {
      error.status = arg.status;
      error.message = arg.message;
      error.data = arg.data;
    }
  }
  return error;
}

  
function sendError(req, res, status, error) {
  if (expectsJSON(req)) {
    return res.status(status).json(error);
  } else {
    return res.status(status).render('error', error);
  }
}

function expectsJSON(req) {
  if (req.xhr || (req.headers.accept && req.headers.accept.match(/application\/json/))) {
    return true;
  } else {
    return false;
  }
}


middleware.configure = function(config) {
  CONFIG = _.merge(CONFIG, config);
  if (CONFIG.log === true) {
    CONFIG.log = ['userError', 'unauthorized', 'forbidden', 'notFound', 'serverError'];
  }
};


module.exports = middleware;