'use strict';

import * as _ from 'lodash';


export class StatusError extends Error {
  public name:string = "StatusError";
  public status: number;
  public data: any;

  constructor(message?: string, data?: any) {
    super(message);
    this.data = data;
  }
}

export class UserError extends StatusError {
  public status:number = 400;
}
export let User = UserError;

export class UnauthorizedError extends StatusError {
  public status:number = 401;
}
export let Unauthorized = UnauthorizedError;

export class ForbiddenError extends StatusError {
  public status: number = 403;
}
export let Forbidden = ForbiddenError;

export class NotFoundError extends StatusError {
  public status:number = 404;
}
export let NotFound = NotFoundError;

export class ServerError extends StatusError {
  public status:number = 500;
}
export let Server = ServerError;

export class DoneError extends Error {}
export let Done = DoneError;


const STATUS_CODE_ERRORS = {
  400: UserError,
  401: UnauthorizedError,
  403: ForbiddenError,
  404: NotFoundError,
  500: ServerError
};

export interface ErrorsMap { [e: string]: new() => Error; }
const ERRORS: ErrorsMap = {
  UserError, User: UserError,
  UnauthorizedError, Unauthorized: UnauthorizedError,
  ForbiddenError, Forbidden: ForbiddenError,
  NotFoundError, NotFound: NotFoundError,
  ServerError, Server: ServerError,
  DoneError, Done: DoneError
};


let CONFIG: ErrorsConfig = {};
const DEFAULT: ErrorsConfig = {
  normalize: function(error: any, Errors: ErrorsMap) {
    return null;
  }
};

export interface ErrorsConfig {
  normalize?: (error: any, Errors: ErrorsMap) => null|StatusError;
};


export function normalizeError(error: any) {
  if (error instanceof UserError ||
    error instanceof UnauthorizedError || 
    error instanceof ForbiddenError ||
    error instanceof NotFoundError ||
    error instanceof ServerError ||
    error instanceof DoneError)
  {
    return error;
  }

  let data;
  if (error && error.data) {
    data = error.data;
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
      return new STATUS_CODE_ERRORS[error.statusCode](message, data);
    }
    return new ServerError(message, data);

  }

  if (error.name === 'UnauthorizedError') {
    return new UnauthorizedError(error, data);
  }

  let customNormalizedError = CONFIG.normalize(error, ERRORS);
  if (customNormalizedError) {
    return customNormalizedError;
  }

  return new ServerError(error, data);
};

CONFIG = _.merge({}, DEFAULT);

export function configure(config: ErrorsConfig = {}) {
  CONFIG = _.merge({}, DEFAULT, config);
  if (!_.isFunction(CONFIG.normalize)) {
    throw new Error('config.normalize MUST be a function');
  }
}