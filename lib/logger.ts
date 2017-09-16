'use strict';

import {TransportOptions, NpmConfigSetLevels, LoggerInstance} from 'winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import './winston-atlasslack';
import * as moment from 'moment';
import * as path from 'path';
import * as _ from 'lodash';
import * as colors from 'winston/lib/winston/config';
import * as util from 'util';
import {SlackManager} from './slack';
import Slack from './slack';
import {AtlasSlackTransportOptions} from './winston-atlasslack';

let CWD: string;
let WINSTON: CustomWinston;

export interface LoggerConfig {
  env?: string;
  transports?: Array<TransportOptions|AtlasSlackTransportOptions>;
  verbose?: boolean;
  cwd?: string;
};


const DEFAULT_WINSTON: LoggerConfig = {
  env: process.env.NODE_ENV || process.env.env || 'development',
  transports: [],
  verbose: !!process.env.VERBOSE || false,
  cwd: process.cwd(),
};

const CUSTOM_COLORS = {
  silly: 'magenta',
  debug: 'gray',
  info: 'green',
  warn: 'yellow',
  error: <any>['white', 'bgRed']
};

winston.addColors(CUSTOM_COLORS); // tslint:disable-line 

const TRANSPORT_DEFAULTS = {
  'Console': {
    stderrLevels: ['error', 'warn']
  },
  'DailyRotateFile': {
    prettyPrint: true,
    prepend: true,
    json: false,
    maxDays: 30
  }
};


export class CustomWinston {
  public config: LoggerConfig;
  public logger: LoggerInstance;
  public filename: string;

  constructor (config: LoggerConfig) {
    config = _.merge<LoggerConfig>({}, DEFAULT_WINSTON, config);
    this.config = config;

    CWD = config.cwd;

    this.logger = new (winston.Logger)({
      transports: [],
      exitOnError: false
    });

    let transports;
    if (!config.transports.length) {
      transports = [ {
        type: "Console",
        properties: {
          level: "debug",
          colorize: 'all',
          stderrLevels: ['error', 'warn'],
        }
      } ];
    } else {
      transports = _.cloneDeep(config.transports);
    }
    transports = transports.map(t => {
      return _.merge({ properties: {}}, t);
    });

    if (config.env === 'test' && !process.env.VERBOSE && transports[0].type === 'Console') {
      transports[0].properties.level = 'error';
    }

    transports.forEach(transport => {
      let props = _.merge({}, TRANSPORT_DEFAULTS[transport.type], transport.properties);
      
      let file = this.filename;
      props.timestamp = getTimestamp;
      props.formatter = function formatter (options) {
        let formatted = `[${options.timestamp()}] ${options.level.toUpperCase()} ${options.message}`;
        if (transport.properties.colorize) {
          return colors.colorize(options.level, formatted);
        } else {
          return formatted;
        }
      };
      this.logger.add(winston.transports[transport.type], props);
    });
  }


}


function getTimestamp(): string {
  return (new Date()).toISOString();
}

export default class Logger {
  static winston: CustomWinston = WINSTON;

  static _log(level:string, ...args) {
    args = Logger.transform.apply(args);
    Logger.winston.logger[level].apply(Logger.winston.logger, args);
  }

  _log(level:string, ...args) {
    args.unshift(`(${this.filename}) -`);
    Logger._log(level, ...args);
  }

  constructor (public filename: string = '') {
    if (this.filename.startsWith(CWD)) {
      // +1 to get rid of directory slash
      this.filename = this.filename.substr(CWD.length + 1);
    }
  }

  static silly(...args) {
    return Logger._log('silly', ...args);
  }
  silly(...args) {
    return this._log('silly', ...args);
  }
  static debug(...args) {
    return Logger._log('debug', ...args);
  }
  debug(...args) {
    return this._log('debug', ...args);
  }
  static info(...args) {
    return Logger._log('info', ...args);
  }
  info(...args) {
    return this._log('info', ...args);
  }
  static warn(...args) {
    return Logger._log('warn', ...args);
  }
  warn(...args) {
    return this._log('warn', ...args);
  }
  static error(...args) {
    return Logger._log('error', ...args);
  }
  error(...args) {
    return this._log('error', ...args);
  }
  static log(...args) {
    return Logger._log('debug', ...args);
  }
  log(...args) {
    return this._log('debug', ...args);
  }

  static transform (...args:any[]) {
    let append = [];

    args = args.map(arg => {
      if (arg instanceof Error) {
        append.push('stack:\n' + arg.stack);
        
        let temparg = {
          message: arg.message,
          errno: arg['errno'],
          code: arg['code']
        };
        if (arg['error']) {
          temparg['error'] = JSON.stringify(arg['error']);
        }
        arg = temparg;
      }
      if (_.isPlainObject(arg)) {
        return util.inspect(arg, {depth: 10});
      } else {
        return arg;
      }
    });

    // in case an object is being passed, winston thinks it's a config
    // so it doesn't print anything out. We add an empty {} here so that 
    // it treats that as the meta config
    return args.concat(append).concat({});
  }

}

export function configure(config: LoggerConfig = {}) {
  WINSTON = new CustomWinston(config);
  Logger.winston = WINSTON;
}