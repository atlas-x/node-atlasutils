'use strict';

import * as SlackClient from '@slack/client';
let RTM_EVENTS = SlackClient.CLIENT_EVENTS.RTM;
import * as _ from 'lodash';
import * as util from 'util';

export interface SlackConfig {
  enabled?: boolean;
  token?: string;
}


const DEFAULT: SlackConfig = {
  enabled: true,
  token: ''
};

export class CustomSlack {
  enabled: boolean = false;
  users: any[] = [];
  channels: any = {};
  config: SlackConfig|null = null;
  private _ready = null;
  private _slack = null;
  info: any = null;
  name: string = null;

  configure(config) {
    this.config = _.merge({}, DEFAULT, config);
    this.enabled = this.config.enabled;
    if (!this.enabled) {
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

  ready(): Promise<string|void> {
    if (this.config && this.enabled) {
      return this._ready;
    } else {
      if (!this.enabled) {
        return Promise.reject('Slack is not enabled');
      }
      return Promise.reject(`You must call '.configure' before using Slack`)
    }
  }

  disconnect() {
    this._slack.disconnect();
  }

  tagUser (name: string): string {
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

  send (channel: string, text: string): Promise<string|void> {
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
export class Slack {
  public slack: CustomSlack;
  constructor(config?: SlackConfig) {
    this.slack = null;
    if (config) {
      this.configure(config);
    }
  }
  
  send(channel: string, text: string): Promise<string|void> {
    return this.slack.send(channel, text);
  }

  tagUser(name: string): string {
    return this.slack.tagUser(name);
  }
  disconnect() {
    if (this.slack) {
      this.slack.disconnect();
      this.slack = null;
    }
  }
  configure(config: SlackConfig) {
    this.disconnect();
    this.slack = new CustomSlack();
    this.slack.configure(config);
  }

  instance(): Slack {
    return new Slack();
  }
}

export let slack = new Slack();
export default slack;


export function configure(config: SlackConfig = {}) {
  return slack.configure(config);
}