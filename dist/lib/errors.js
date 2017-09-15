'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
class StatusError extends Error {
    constructor() {
        super(...arguments);
        this.name = "StatusError";
    }
}
exports.StatusError = StatusError;
class UserError extends StatusError {
    constructor() {
        super(...arguments);
        this.status = 400;
    }
}
exports.UserError = UserError;
exports.User = UserError;
class UnauthorizedError extends StatusError {
    constructor() {
        super(...arguments);
        this.status = 401;
    }
}
exports.UnauthorizedError = UnauthorizedError;
exports.Unauthorized = UnauthorizedError;
class ForbiddenError extends StatusError {
    constructor() {
        super(...arguments);
        this.status = 403;
    }
}
exports.ForbiddenError = ForbiddenError;
exports.Forbidden = ForbiddenError;
class NotFoundError extends StatusError {
    constructor() {
        super(...arguments);
        this.status = 404;
    }
}
exports.NotFoundError = NotFoundError;
exports.NotFound = NotFoundError;
class ServerError extends StatusError {
    constructor() {
        super(...arguments);
        this.status = 500;
    }
}
exports.ServerError = ServerError;
exports.Server = ServerError;
class DoneError extends Error {
}
exports.DoneError = DoneError;
exports.Done = DoneError;
const STATUS_CODE_ERRORS = {
    400: UserError,
    401: UnauthorizedError,
    403: ForbiddenError,
    404: NotFoundError,
    500: ServerError
};
const ERRORS = {
    UserError, User: UserError,
    UnauthorizedError, Unauthorized: UnauthorizedError,
    ForbiddenError, Forbidden: ForbiddenError,
    NotFoundError, NotFound: NotFoundError,
    ServerError, Server: ServerError,
    DoneError, Done: DoneError
};
let CONFIG = {};
const DEFAULT = {
    normalize: function (error, Errors) {
        return null;
    }
};
;
function normalizeError(error) {
    if (error instanceof UserError ||
        error instanceof UnauthorizedError ||
        error instanceof ForbiddenError ||
        error instanceof NotFoundError ||
        error instanceof ServerError ||
        error instanceof DoneError) {
        return error;
    }
    if (error && error.statusCode >= 400) {
        let message;
        if (error.error) {
            message = error.error;
        }
        else if (error.toJSON) {
            message = error.toJSON();
        }
        else if (error.message) {
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
    let customNormalizedError = CONFIG.normalize(error, ERRORS);
    if (customNormalizedError) {
        return customNormalizedError;
    }
    return new ServerError(error);
}
exports.normalizeError = normalizeError;
;
function configure(config = {}) {
    CONFIG = _.merge({}, DEFAULT, config);
    if (!_.isFunction(CONFIG.normalize)) {
        throw new Error('config.normalize MUST be a function');
    }
}
exports.configure = configure;
