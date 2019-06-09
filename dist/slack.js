'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const web_api_1 = require("@slack/web-api");
const _ = require("lodash");
const DEFAULT = {
    enabled: true,
    token: ''
};
class CustomSlack {
    constructor() {
        this.enabled = false;
        this.users = [];
        this.conversations = {};
        this.config = null;
        this._ready = null;
        this._slack = null;
        this.info = null;
        this.name = null;
    }
    list(resource, args, key) {
        return __awaiter(this, void 0, void 0, function* () {
            let results = [];
            let done = yield this._slack.paginate(resource, args, (page) => !(page[key] && page[key].length), (accumulator, page) => {
                if (!accumulator) {
                    accumulator = [];
                }
                accumulator = accumulator.concat(page[key]);
                return accumulator;
            });
            return done;
        });
    }
    configure(config) {
        this.config = _.merge({}, DEFAULT, config);
        this.enabled = this.config.enabled;
        if (!this.enabled) {
            this._ready = Promise.reject('Slack is not enabled');
            return;
        }
        if (!this.config.token) {
            this._ready = Promise.reject('token is required');
            return;
        }
        this._slack = new web_api_1.WebClient(this.config.token, {
            logLevel: web_api_1.LogLevel.ERROR,
            rejectRateLimitedCalls: true
        });
        this._ready = new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                let self = yield this._slack.auth.test();
                this.name = self.user;
                let [info, users, conversations] = yield Promise.all([
                    this._slack.team.info().then(res => res.team),
                    this.list('users.list', {}, 'members'),
                    this.list('conversations.list', { types: 'public_channel,private_channel' }, 'channels')
                ]);
                this.info = info;
                this.users = users;
                for (let convo of conversations) {
                    if (convo.is_member) {
                        this.conversations[convo.name_normalized] = convo;
                    }
                }
                resolve();
            }
            catch (e) {
                reject(e);
            }
        }));
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
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ready();
            if (!this.conversations[channel]) {
                return Promise.reject(`Could not find #${channel} (maybe ${this.name} is not invited?)`);
            }
            let res = yield this._slack.chat.postMessage({
                text,
                channel: this.conversations[channel].id
            });
            return res;
        });
    }
    logError(channel, error, title = 'error') {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ready();
            if (!this.conversations[channel]) {
                return Promise.reject(`Could not find #${channel} (maybe ${this.name} is not invited?)`);
            }
            let filename = `${(new Date()).toISOString()} ${title}.log`;
            let res = yield this._slack.files.upload({
                channels: this.conversations[channel].id,
                filename,
                content: error,
                filetype: 'javascript'
            });
            return res;
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
    logError(channel, error, title) {
        return this.slack.logError(channel, error, title);
    }
    tagUser(name) {
        return this.slack.tagUser(name);
    }
    configure(config) {
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
