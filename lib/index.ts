'use strict';

import {configure as configLogger, LoggerConfig} from './logger';
import Logger from './logger';
import {configure as configMW, MiddlewareConfig} from './middleware';
import middleware from './middleware';
import {configure as configErrors, ErrorsConfig} from './errors';
import * as Errors from './errors';
import {configure as configSlack, SlackConfig} from './slack';
import slack from './slack';

export function configureLogger(config: LoggerConfig = {}) {
  configLogger(config);
};

export function configureMiddleware(config: MiddlewareConfig = {}) {
  configMW(config);
};

export function configureErrors(config: ErrorsConfig = {}) {
  configErrors(config);
};

export function configureSlack(config: SlackConfig = {}) {
  configSlack(config);
};

export {Logger, middleware, Errors, slack};
