'use strict';

let SlackClient = require('@slack/client');
let RTM_EVENTS = SlackClient.CLIENT_EVENTS.RTM;
let _ = require('lodash');
let util = require('util')


const DEFAULT = {
  enabled: true,
  token: ''
};

class Slack {
  constructor() {
    this.enabled = false;
    this.users = [];
    this.channels = {};
  }

  configure(config) {
    this.config = _.merge({}, DEFAULT, config);
    this.enabled = this.config.enabled;
    if (!this.enabled) {
      this._ready = Promise.reject('Slack is not enabled');
      return;
    }
    this._slack = new SlackClient.RtmClient(this.config.token, {
      logLevel: 'none'
    });
    this._slack.start();
    this._ready = new Promise((resolve, reject) => {
      this._slack.on(RTM_EVENTS.AUTHENTICATED, info => {
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
      this._slack.on(RTM_EVENTS.RTM_CONNECTION_OPENED, err => {
        if (err) { return reject(err); }
        resolve();
      });
    });
  }

  ready() {
    if (this.config) {
      return this._ready;
    } else {
      return Promise.reject(`You must call '.configure' before using Slack`)
    }
  }

  disconnect() {
    this._slack.disconnect();
  }

  tagUser (name) {
    name = name.trim();
    let tag = name;
    for (let ii = 0; ii < this.users.length; ii++) {
      let user = this.users[ii];
      if (user.name === name) {
        return `<@${user.name}>`;
      }
      if (user.profile) {
        let reg = new RegExp(`^${name}$`, 'i');
        if (reg.test(user.profile.last_name)) {
          return `<@${user.name}>`;
        }
      }
    }
    return tag;
  }

  send (channel, text) {
    return this.ready().then(() => {
      if (!this.channels[channel]) {
        return Promise.reject(`Could not find #${channel} (maybe ${this.name} is not invited?)`);
      }
      return this._slack.send({
        text: text,
        channel: this.channels[channel].id,
        type: 'message',
        parse: true
      })
      .catch(err => {
        console.error(JSON.stringify(err));
      });
    });
  }
}

// layer of abstraction because configuring after requiring causes some 
// messy issues when testing / configuring more than once
class SlackManager {
  configure(...args) {
    this.disconnect();
    this.slack = new Slack();
    this.slack.configure(...args);
  }
  send(...args) {
    return this.slack.send(...args);
  }
  tagUser(...args) {
    return this.slack.tagUser(...args);
  }
  disconnect() {
    if (this.slack) {
      this.slack.disconnect();
      this.slack = null;
    }
  }
}

module.exports = new SlackManager();