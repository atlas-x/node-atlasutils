"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
'use strict';
const winston = require("winston");
require("winston-daily-rotate-file");
require("./winston-atlasslack");
const _ = require("lodash");
const colors = require("winston/lib/winston/config");
const util = require("util");
let CWD;
let WINSTON;
;
const DEFAULT_WINSTON = {
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
    error: ['white', 'bgRed']
};
winston.addColors(CUSTOM_COLORS); // tslint:disable-line 
const TRANSPORT_DEFAULTS = {
    'Console': {
        level: 'debug',
        stderrLevels: ['error', 'warn']
    },
    'DailyRotateFile': {
        level: 'info',
        prettyPrint: true,
        prepend: true,
        json: false,
        maxDays: 30
    }
};
class CustomWinston {
    constructor(config) {
        config = _.merge({}, DEFAULT_WINSTON, config);
        this.config = config;
        CWD = config.cwd;
        this.logger = new (winston.Logger)({
            transports: [],
            exitOnError: false
        });
        let transports;
        if (!config.transports.length) {
            transports = [{
                    type: "Console",
                    properties: {
                        level: "debug",
                        colorize: 'all',
                        stderrLevels: ['error', 'warn'],
                    }
                }];
        }
        else {
            transports = _.cloneDeep(config.transports);
        }
        transports = transports.map(t => {
            return _.merge({ properties: {} }, t);
        });
        if (config.env === 'test' && !process.env.VERBOSE && transports[0].type === 'Console') {
            transports[0].properties.level = 'error';
        }
        transports.forEach(transport => {
            let props = _.merge({}, TRANSPORT_DEFAULTS[transport.type], transport.properties);
            let file = this.filename;
            props.timestamp = getTimestamp;
            props.formatter = function formatter(options) {
                let formatted = `[${options.timestamp()}] ${options.level.toUpperCase()} ${options.message}`;
                if (transport.properties.colorize) {
                    return colors.colorize(options.level, formatted);
                }
                else {
                    return formatted;
                }
            };
            this.logger.add(winston.transports[transport.type], props);
        });
    }
}
exports.CustomWinston = CustomWinston;
WINSTON = new CustomWinston();
function getTimestamp() {
    return (new Date()).toISOString();
}
exports.Logger = (_a = class Logger {
        constructor(filename = '') {
            this.filename = filename;
            if (this.filename.startsWith(CWD)) {
                // +1 to get rid of directory slash
                this.filename = this.filename.substr(CWD.length + 1);
            }
        }
        static _log(level, ...args) {
            args = Logger.transform.apply(Logger, args);
            Logger.winston.logger[level].apply(Logger.winston.logger, args);
        }
        _log(level, ...args) {
            args.unshift(`(${this.filename}) -`);
            Logger._log(level, ...args);
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
        static transform(...args) {
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
                    if (arg['query']) {
                        temparg['query'] = arg['query'].replace(/\n/g, ' ').replace(/\r/g, '');
                    }
                    if (arg['data']) {
                        temparg['data'] = JSON.stringify(arg['data']);
                    }
                    arg = temparg;
                }
                if (_.isPlainObject(arg)) {
                    return util.inspect(arg, { depth: 10 });
                }
                else {
                    return arg;
                }
            });
            // in case an object is being passed, winston thinks it's a config
            // so it doesn't print anything out. We add an empty {} here so that 
            // it treats that as the meta config
            return args.concat(append).concat({});
        }
        static prefix(filename) {
            return new Logger(filename);
        }
    },
    _a.winston = WINSTON,
    _a);
exports.default = exports.Logger;
function configure(config = {}) {
    WINSTON = new CustomWinston(config);
    exports.Logger.winston = WINSTON;
}
exports.configure = configure;
