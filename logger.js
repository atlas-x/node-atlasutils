'use strict';

let winston = require('winston');
require('winston-daily-rotate-file');
let moment = require('moment');
let path = require('path');
let _ = require('lodash');
let colors = require('winston/lib/winston/config');
let util = require('util');

let CWD;
let WINSTON;

const CUSTOM_COLORS = {
  silly: 'magenta',
  debug: 'gray',
  info: 'green',
  warn: 'yellow',
  error: ['white', 'bgRed']
};
winston.addColors(CUSTOM_COLORS);

const DEFAULTS = {
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


class Winston {
  constructor (config) {
    config = _.merge({
      env: process.env.NODE_ENV || process.env.env || 'development',
      transports: [],
      verbose: process.env.VERBOSE || false,
      cwd: process.cwd()
    }, config);

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
      let props = _.merge(DEFAULTS[transport.type], transport.properties);
      
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


function getTimestamp() {
  return (new Date()).toISOString();
}

class Logger {
  constructor (filename) {
    this.filename = filename || "unknown";

    if (this.filename.startsWith(CWD)) {
      // +1 to get rid of directory slash
      this.filename = this.filename.substr(CWD.length + 1);
    }

    this.winston = WINSTON;

    Object.keys(this.winston.logger.levels).forEach(level => {
      this[level] = function () {
        let args = this.transform.apply(this, arguments);
        // log to slack if enabled
        // if (level === 'error' && config.slack && config.slack.enabled && config.slack.onerror) {
        //   let errormsg = `[${getTimestamp()}] ${config.env.toUpperCase()} ${level.toUpperCase()}`;
        //   for (let ii = 0; ii < args.length - 1; ii++) {
        //     let arg = args[ii];
        //     if (_.isString(arg) && arg.match(/^stack\:/)) {
        //       arg = arg.split('\n').slice(0, 3).join('\n');
        //     }
        //     errormsg += " " + (_.isString(arg) ? arg : JSON.stringify(arg));
        //   }
        //   // require('./slack').slack.send(config.slack.onerror, errormsg);
        // }

        return this.winston.logger[level].apply(this.winston.logger, this.transform.apply(this, arguments));
      };
    });
  }

  log () {
    return this.winston.logger['debug'].apply(this.winston.logger, this.transform.apply(this, arguments));
  }

  transform () {
    let prefix = `(${this.filename}) -`;
    let args = Array.prototype.slice.call(arguments);
    args.unshift(prefix);

    let append = [];

    args = args.map(arg => {
      if (arg instanceof Error) {
        append.push('stack:\n' + arg.stack);
        
        let temparg = {
          message: arg.message,
          errno: arg.errno,
          code: arg.code
        };
        if (arg.error) {
          temparg.error = JSON.stringify(arg.error);
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


function getLogger (filename) {
  if (!WINSTON) {
    configure();
  }
  let logger = new Logger(filename);
  return logger;
}
getLogger.configure = configure;
function configure(config) {
  WINSTON = new Winston(config);
};

module.exports = getLogger;
