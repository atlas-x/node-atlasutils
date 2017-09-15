"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const winston = require("winston");
const slack_1 = require("./slack");
const _ = require("lodash");
;
const DEFAULTS = {
    token: '',
    name: 'AtlasSlack',
    level: 'warn',
    channel: 'general',
    env: process.env.NODE_ENV || process.env.env || 'development',
    timestamp: () => (new Date()).toISOString(),
    formatter: (options) => {
        return `[${options.timestamp()}] ${options.level.toUpperCase()} ${options.message}`;
    }
};
class AtlasSlack extends winston.Transport {
    constructor(options) {
        super(options);
        options = _.merge({}, DEFAULTS, options);
        this.name = options.name;
        this.level = options.level;
        this.token = options.token;
        this.channel = options.channel;
        this['timestamp'] = options.timestamp;
        this['formatter'] = options.formatter;
        this.slack = slack_1.default.instance();
        this.slack.configure({ token: this.token });
    }
    log(level, msg, meta, callback) {
        if (!this.slack.slack.enabled) {
            callback(`AtlasSlack transport registered but Slack is disabled`, false);
            return;
        }
        let slackmsg = `${level.toUpperCase()} ${msg}`;
        this.slack.send(this.channel, slackmsg)
            .then(() => {
            callback(null, true);
        })
            .catch(err => {
            callback(err, false);
        });
    }
}
winston.transports['AtlasSlack'] = AtlasSlack;
