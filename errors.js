'use strict';

let _ = require('lodash');


class UserError extends Error {
  constructor(...args) {
    super(...args);
    this.status = 400;
  }
}
exports.UserError = exports.User = UserError;

class UnauthorizedError extends Error {
  constructor(...args) {
    super(...args);
    this.status = 401;
  }
}
exports.UnauthorizedError = exports.Unauthorized = UnauthorizedError;

class ForbiddenError extends Error {
  constructor(...args) {
    super(...args);
    this.status = 403;
  }
}
exports.ForbiddenError = exports.Forbidden = ForbiddenError;

class NotFoundError extends Error {
  constructor(...args) {
    super(...args);
    this.status = 404;
  }
}
exports.NotFoundError = exports.NotFound = NotFoundError;

class ServerError extends Error {
  constructor(...args) {
    super(...args);
    this.status = 500;
  }
}
exports.ServerError = exports.Server = ServerError;

class DoneError extends Error {}
exports.DoneError = exports.Done = DoneError;

const STATUS_CODE_ERRORS = {
  400: UserError,
  401: UnauthorizedError,
  403: ForbiddenError,
  404: NotFoundError,
  500: ServerError
};


exports.normalizeError = function(error) {
  if (error instanceof UserError ||
    error instanceof UnauthorizedError || 
    error instanceof ForbiddenError ||
    error instanceof NotFoundError ||
    error instanceof ServerError ||
    error instanceof DoneError)
  {
    return error;
  }

  if (error && error.statusCode >= 400) {
    let message;
    if (error.error) {
      message = error.error;
    } else if (error.toJSON) {
      message = error.toJSON();
    } else if (error.message) {
      message = error.message;
    }
    // typical Xola error
    if (message && message.global) {
      message = message.global;
    }
    if (_.isArray(message)) {
      message = message.join('\n');
    }
    if (_.isPlainObject(message)) {
      message = JSON.stringify(message);
    }
    if (STATUS_CODE_ERRORS[error.statusCode]) {
      return new STATUS_CODE_ERRORS[error.statusCode](message);
    }
    return new ServerError(message);

  }

  if (error.name === 'UnauthorizedError') {
    return new UnauthorizedError(error);
  }

  return new ServerError(error);
};

