let errors = require('./errors');


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
    let error = extractDetails.apply(null, arguments);
    if (!error.message) { error.message = 'Bad Request'; }
    if (!error.status) { error.status = 400; }
    return sendError(req, res, 400, error);
  };
  res.badRequest = res.userError;
  
  res.unauthorized = function(data) {
    let error = extractDetails.apply(null, arguments);
    if (!error.message) { error.message = 'Unauthorized'; }
    if (!error.status) { error.status = 401; }
    return sendError(req, res, 401, error);
  };

  res.forbidden = function(data) {
    let error = extractDetails.apply(null, arguments);
    if (!error.message) { error.message = 'Forbidden'; }
    if (!error.status) { error.status = 403; }
    return sendError(req, res, 403, error);
  };

  res.notFound = function(data) {
    let error = extractDetails.apply(null, arguments);
    if (!error.message) { error.message = 'Not Found'; }
    if (!error.status) { error.status = 404; }
    return sendError(req, res, 404, error);
  };

  res.serverError = function(data) {
    if (data && data instanceof DoneError) {
      return;
    }

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
}

  
function sendError(req, res, status, error) {
  if (expectsJSON(req)) {
    return res.status(status).render('error', error);
  } else {
    return res.status(status).json(error);
  }
}

function expectsJSON(req) {
  if (req.xhr || (req.headers.accept && req.headers.accept.match(/application\/json/))) {
    return true;
  } else {
    return false;
  }
}


module.exports = middleware;