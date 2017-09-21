'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("./logger");
const logger_2 = require("./logger");
exports.Logger = logger_2.default;
const middleware_1 = require("./middleware");
const middleware_2 = require("./middleware");
exports.middleware = middleware_2.default;
const errors_1 = require("./errors");
const Errors = require("./errors");
exports.Errors = Errors;
const slack_1 = require("./slack");
const slack_2 = require("./slack");
exports.slack = slack_2.default;
function configureLogger(config = {}) {
    logger_1.configure(config);
}
exports.configureLogger = configureLogger;
;
function configureMiddleware(config = {}) {
    middleware_1.configure(config);
}
exports.configureMiddleware = configureMiddleware;
;
function configureErrors(config = {}) {
    errors_1.configure(config);
}
exports.configureErrors = configureErrors;
;
function configureSlack(config = {}) {
    slack_1.configure(config);
}
exports.configureSlack = configureSlack;
;
