'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@slack/client");
const _ = require("lodash");
const DEFAULT = {
    enabled: true,
    token: ''
};
class CustomSlack {
    constructor() {
        this.enabled = false;
        this.users = [];
        this.channels = {};
        this.config = null;
        this._ready = null;
        this._slack = null;
        this.info = null;
        this.name = null;
    }
    configure(config) {
        this.config = _.merge({}, DEFAULT, config);
        this.enabled = this.config.enabled;
        if (!this.enabled) {
            return;
        }
        this._slack = new client_1.RTMClient(this.config.token, {
            logLevel: client_1.LogLevel.ERROR,
            useRtmConnect: false
        });
        this._slack.start({});
        this._ready = new Promise((resolve, reject) => {
            this._slack.on('authenticated', info => {
                this.info = info;
                this.name = info.self.name;
                this.users = info.users.filter(u => !u.deleted);
                this.channels = {};
                for (let channel of info.channels) {
                    if (channel.is_member) {
                        this.channels[channel.name_normalized] = channel;
                    }
                }
                for (let group of info.groups) {
                    this.channels[group.name_normalized] = group;
                }
            });
            this._slack.on('ready', err => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    }
    ready() {
        if (this.config && this.enabled) {
            return this._ready;
        }
        else {
            if (!this.enabled) {
                return Promise.reject('Slack is not enabled');
            }
            return Promise.reject(`You must call '.configure' before using Slack`);
        }
    }
    disconnect() {
        this._slack.disconnect();
    }
    tagUser(name) {
        name = name.trim();
        let tag = name;
        for (let ii = 0; ii < this.users.length; ii++) {
            let user = this.users[ii];
            if (user.name === name) {
                return `<@${user.id}>`;
            }
            if (user.profile) {
                let reg = new RegExp(`^${name}$`, 'i');
                if (reg.test(user.profile.last_name)) {
                    return `<@${user.id}>`;
                }
            }
        }
        return tag;
    }
    send(channel, text) {
        return this.ready().then(() => {
            if (!this.channels[channel]) {
                return Promise.reject(`Could not find #${channel} (maybe ${this.name} is not invited?)`);
            }
            return this._slack.sendMessage(text, this.channels[channel].id)
                .catch(err => {
                console.error(JSON.stringify(err));
            });
        });
    }
}
exports.CustomSlack = CustomSlack;
// layer of abstraction because configuring after requiring causes some 
// messy issues when testing / configuring more than once
class Slack {
    constructor(config) {
        this.slack = null;
        if (config) {
            this.configure(config);
        }
    }
    send(channel, text) {
        return this.slack.send(channel, text);
    }
    tagUser(name) {
        return this.slack.tagUser(name);
    }
    disconnect() {
        if (this.slack) {
            this.slack.disconnect();
            this.slack = null;
        }
    }
    configure(config) {
        this.disconnect();
        this.slack = new CustomSlack();
        this.slack.configure(config);
    }
    instance() {
        return new Slack();
    }
}
exports.Slack = Slack;
exports.slack = new Slack();
exports.default = exports.slack;
function configure(config = {}) {
    return exports.slack.configure(config);
}
exports.configure = configure;
