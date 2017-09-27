"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errors = require("./errors");
const _ = require("lodash");
let CONFIG = {};
const DEFAULT = {
    log: ['serverError'],
    logger: console,
    logUrl: true,
    getUser: function (req) { },
    errorView: null
};
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
exports.middleware = function middleware(req, res, next) {
    req.expectsJSON = function () {
        return expectsJSON(req);
    };
    res.handleError = res.handleErrors = function (error) {
        error = errors.normalizeError(error);
        if (error instanceof errors.UserError) {
            return res.userError(error);
        }
        else if (error instanceof errors.UnauthorizedError) {
            return res.unauthorized(error);
        }
        else if (error instanceof errors.ForbiddenError) {
            return res.forbidden(error);
        }
        else if (error instanceof errors.NotFoundError) {
            return res.notFound(error);
        }
        else {
            return res.serverError(error);
        }
    };
    res.userError = function (data) {
        logifenabled(arguments, 'userError', true, req);
        let error = extractDetails.apply(null, arguments);
        if (!error.message) {
            error.message = 'Bad Request';
        }
        if (!error.status) {
            error.status = 400;
        }
        return sendError(req, res, 400, error, next);
    };
    res.badRequest = res.userError;
    res.unauthorized = function (data) {
        logifenabled(arguments, 'unauthorized', true, req);
        let error = extractDetails.apply(null, arguments);
        if (!error.message) {
            error.message = 'Unauthorized';
        }
        if (!error.status) {
            error.status = 401;
        }
        return sendError(req, res, 401, error, next);
    };
    res.forbidden = function (data) {
        logifenabled(arguments, 'forbidden', true, req);
        let error = extractDetails.apply(null, arguments);
        if (!error.message) {
            error.message = 'Forbidden';
        }
        if (!error.status) {
            error.status = 403;
        }
        return sendError(req, res, 403, error, next);
    };
    res.notFound = function (data) {
        logifenabled(arguments, 'notFound', true, req);
        let error = extractDetails.apply(null, arguments);
        if (!error.message) {
            error.message = 'Not Found';
        }
        if (!error.status) {
            error.status = 404;
        }
        return sendError(req, res, 404, error, next);
    };
    res.serverError = function (data) {
        if (data && data instanceof errors.DoneError) {
            return;
        }
        logifenabled(arguments, 'serverError', false, req);
        let error = extractDetails.apply(null, arguments);
        if (!error.message) {
            error.message = 'Server Error';
        }
        if (!error.status) {
            error.status = 500;
        }
        return sendError(req, res, 500, error, next);
    };
    res.created = function (data) {
        res.status(201).json(data);
    };
    res.deleted = function (data) {
        res.status(204).json(data);
    };
    next();
};
exports.default = exports.middleware;
function extractDetails(...args) {
    let error = {};
    if (args.length > 2) {
        error.status = args[0];
        error.message = args[1];
        error.data = args[2];
    }
    else if (args.length > 1) {
        error.status = args[0];
        error.message = args[1];
    }
    else {
        let arg = args[0];
        if (typeof arg === 'string') {
            error.message = arg;
        }
        else if (typeof arg === 'number') {
            error.status = arg;
        }
        else if (arg instanceof Object) {
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
    }
    else {
        if (CONFIG.errorView) {
            return res.status(status).render(CONFIG.errorView, error);
        }
        else {
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
    }
    else {
        return false;
    }
}
function configure(config = {}) {
    CONFIG = _.merge({}, DEFAULT, config);
    if (!_.isFunction(CONFIG.getUser)) {
        throw new Error('config.getUser MUST be a function');
    }
}
exports.configure = configure;
