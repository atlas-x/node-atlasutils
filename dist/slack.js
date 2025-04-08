"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const web_api_1 = require("@slack/web-api");
const _ = require("lodash");
const DEFAULT = {
    enabled: true,
    token: "",
};
class CustomSlack {
    constructor() {
        this.enabled = false;
        this.users = [];
        this.groups = [];
        this.conversations = {};
        this.config = null;
        this._ready = null;
        this._slack = null;
        this.info = null;
        this.name = null;
    }
    list(resource, args, key) {
        var e_1, _a;
        return __awaiter(this, void 0, void 0, function* () {
            let results = [];
            args = _.merge({}, args, { limit: 10000 });
            try {
                for (var _b = __asyncValues(this._slack.paginate(resource, args)), _c; _c = yield _b.next(), !_c.done;) {
                    let page = _c.value;
                    if (!(page[key] && Array.isArray(page[key]) && page[key].length)) {
                        break;
                    }
                    results = results.concat(page[key]);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
            return results;
        });
    }
    configure(config) {
        this.config = _.merge({}, DEFAULT, config);
        this.enabled = this.config.enabled;
        if (!this.enabled) {
            return;
        }
        if (!this.config.token) {
            this._ready = Promise.reject("token is required");
            return;
        }
        try {
            this._slack = new web_api_1.WebClient(this.config.token, {
                logLevel: web_api_1.LogLevel.ERROR,
                rejectRateLimitedCalls: true,
            });
        }
        catch (e) {
            console.error(e);
            this._ready = Promise.reject(e.message);
            return;
        }
    }
    ready() {
        if (this._ready)
            return this._ready;
        if (this.config && this.enabled) {
            this._ready = new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                try {
                    let self = yield this._slack.auth.test();
                    this.name = self.user;
                    this.info = yield this._slack.team.info().then((res) => res.team);
                    this.users = yield this.list("users.list", {}, "members");
                    const conversations = yield this.list("conversations.list", {
                        types: "public_channel,private_channel",
                        exclude_archived: true,
                    }, "channels");
                    for (let convo of conversations) {
                        this.conversations[convo.name_normalized] = convo;
                    }
                    resolve(true);
                }
                catch (e) {
                    console.error(e);
                    reject(e);
                }
            }));
            return this._ready;
        }
        else {
            if (!this.enabled) {
                return Promise.reject("Slack is not enabled");
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
                if (user.profile.email === name) {
                    return `<@${user.id}>`;
                }
                let reg = new RegExp(`^${name}$`, "i");
                if (reg.test(user.profile.last_name) ||
                    reg.test(user.profile.first_name)) {
                    return `<@${user.id}>`;
                }
            }
        }
        for (let ii = 0; ii < this.groups.length; ii++) {
            let group = this.groups[ii];
            let reg = new RegExp(`^${name}$`, "i");
            if (reg.test(group.handle) || reg.test(group.name)) {
                return `<!subteam^${group.id}>`;
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
                channel: this.conversations[channel].id,
            });
            return res;
        });
    }
    logError(channel, error, title = "error") {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ready();
            if (!this.conversations[channel]) {
                return Promise.reject(`Could not find #${channel} (maybe ${this.name} is not invited?)`);
            }
            let filename = `${new Date().toISOString()} ${title}.log`;
            let res = yield this._slack.files.upload({
                channels: this.conversations[channel].id,
                filename,
                content: error,
                filetype: "javascript",
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
