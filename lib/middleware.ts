
import * as errors from './errors';
import * as _ from 'lodash';
import * as morgan from 'morgan';
import * as split from 'split';


export interface MiddlewareConfig {
  log?: string[],
  logger?: any,
  logUrl?: boolean,
  getUser?: (req: any) => string|void;
  errorView?: string;
  blacklist?: string[];
  env?: string;
  truncate?: number;
}


const DEFAULT: MiddlewareConfig = {
  log: ['serverError'],
  logger: console,
  logUrl: true,
  getUser: function(req) {},
  errorView: null,
  blacklist: ['password'],
  env: process.env.NODE_ENV || process.env.env || 'development',
  truncate: 1000,
};
let CONFIG: MiddlewareConfig = DEFAULT;


function logifenabled(args, method, warn, req) {
  if (!CONFIG.log.includes(method)) {
    return;
  }
  args = Array.prototype.slice.call(args);
  let type = 'error';
  if (warn) {
    type = 'warn';
  }

  if (CONFIG.logUrl) {
    args.unshift(`- ${req.url} -`);
  }

  let user = CONFIG.getUser(req);
  if (user) {
    user = `[${user}]`;
    args.unshift(user);
  }

  CONFIG.logger[type].apply(CONFIG.logger, args);
}

export let middleware = function middleware(req, res, next) {
  
  req.expectsJSON = function() {
    return expectsJSON(req);
  };

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

  res.userError = function(data) {
    logifenabled(arguments, 'userError', true, req);
    let error = extractDetails.apply(null, arguments);
    if (!error.message) { error.message = 'Bad Request'; }
    if (!error.status) { error.status = 400; }
    return sendError(req, res, 400, error, next);
  };
  res.badRequest = res.userError;
  
  res.unauthorized = function(data) {
    logifenabled(arguments, 'unauthorized', true, req);
    let error = extractDetails.apply(null, arguments);
    if (!error.message) { error.message = 'Unauthorized'; }
    if (!error.status) { error.status = 401; }
    return sendError(req, res, 401, error, next);
  };

  res.forbidden = function(data) {
    logifenabled(arguments, 'forbidden', true, req);
    let error = extractDetails.apply(null, arguments);
    if (!error.message) { error.message = 'Forbidden'; }
    if (!error.status) { error.status = 403; }
    return sendError(req, res, 403, error, next);
  };

  res.notFound = function(data) {
    logifenabled(arguments, 'notFound', true, req);
    let error = extractDetails.apply(null, arguments);
    if (!error.message) { error.message = 'Not Found'; }
    if (!error.status) { error.status = 404; }
    return sendError(req, res, 404, error, next);
  };

  res.serverError = function(data) {
    if (data && data instanceof errors.DoneError) {
      return;
    }
    logifenabled(arguments, 'serverError', false, req);
    let error = extractDetails.apply(null, arguments);
    if (!error.message) { error.message = 'Server Error'; }
    if (!error.status) { error.status = 500; }
    return sendError(req, res, 500, error, next);
  };

  res.created = function(data) {
    res.status(201).json(data);
  };

  res.deleted = function(data) {
    res.status(204).json(data);
  };

  next();
}
export default middleware;


function extractDetails(...args) {
  let error:any = {};
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

  
function sendError(req, res, status, error, next) {
  if (expectsJSON(req)) {
    return res.status(status).json(error);
  } else {
    if (CONFIG.errorView) {
      return res.status(status).render(CONFIG.errorView, error);
    } else {
      res.status(status);
      let err = new Error(error.message);
      err['status'] = error.status;
      err['errno'] = error.status;
      next(err);
    }
  }
}

function expectsJSON(req) {
  if (req.xhr || (req.headers.accept && req.headers.accept.match(/application\/json/))) {
    return true;
  } else {
    return false;
  }
}

export function configure(config: MiddlewareConfig = {}) {
  CONFIG = _.merge<MiddlewareConfig>({}, DEFAULT, config);
  
  if (!_.isFunction(CONFIG.getUser)) {
    throw new Error('config.getUser MUST be a function');
  }
}

export function logRequests(app) {
  let morganformat = getMorgan();
  if (morganformat) {
    app.use(morgan(morganformat, {
      skip: (req, res) => res.statusCode >= 500,
      stream: split().on('data', data => CONFIG.logger.info(data))
    }));
    app.use(morgan(morganformat, {
      skip: (req, res) => res.statusCode < 500,
      stream: split().on('data', data => CONFIG.logger.error(data))
    }));
  }
  return morganformat;
}

function getMorgan() {
  setupMorgan();
  if (CONFIG.env === 'development') {
    return ':method :user :method :url :status :response-time ms :body';
  } else if (CONFIG.env === 'test') {
    return null;
  } else {
    return ':remote-addr - :user :method :url :status :response-time ms :body';
  }
}

function setupMorgan() {
  morgan.token('body', (req, res) => {
    if (req.method !== 'GET') {
      return `body: ${truncate(req.body)}`;
    } else {
      return '';
    }
  });

  morgan.token('user', (req, res) => {
    let user = CONFIG.getUser(req);
    if (user) {
      return `(${user})`;
    }
    return '';
  })
}

function truncate(body) {
  body = _.cloneDeep(body);
  
  let bod = JSON.stringify(body, (key, val) => {
    for (let ii = 0; ii < CONFIG.blacklist.length; ii++) {
      let bl = CONFIG.blacklist[ii];
      // remove wildcard tokens
      if (bl.indexOf('*') >= 0 && key.indexOf(bl.substr(0, bl.length - 1)) >= 0) {
        return '*****';
      } else if (bl === key) {
        return '*****';
      }
    }
    return val;
  });
  if (bod.length > CONFIG.truncate) {
    return bod.substr(0, CONFIG.truncate) + " ... (truncated)";
  }
  return bod;
}