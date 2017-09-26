"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const winston = require("winston");
const slack_1 = require("./slack");
const slack_2 = require("./slack");
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
        this.env = options.env;
        this['timestamp'] = options.timestamp;
        this['formatter'] = options.formatter;
        if (this.token) {
            this.slack = new slack_2.Slack({ token: this.token });
        }
        else {
            this.slack = slack_1.default;
        }
    }
    log(level, msg, meta, callback) {
        callback = callback || function () { };
        if (!this.slack.slack.enabled) {
            callback(`AtlasSlack transport registered but Slack is disabled`, false);
            return;
        }
        let stackidx = msg.lastIndexOf('stack:');
        if (stackidx >= 0) {
            let pre = msg.substr(0, stackidx);
            let post = msg.substr(stackidx);
            post = post.split('\n').slice(0, 4).join('\n');
            msg = pre + post;
        }
        let slackmsg = `${this.env.toUpperCase()} ${msg}`;
        this.slack.send(this.channel, slackmsg)
            .then(() => {
            callback(null, true);
        })
            .catch(err => {
            callback(err, false);
        });
    }
}
exports.AtlasSlack = AtlasSlack;
winston.transports['AtlasSlack'] = AtlasSlack;
