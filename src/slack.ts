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

  ready(): Promise<string|void> {
    if (this.config) {
      return this._ready;
    } else {
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
export class SlackManager {
  public static slack: CustomSlack = null;
  public slack: CustomSlack;
  constructor() {
    this.slack = SlackManager.slack;
  }
  
  static configure(config: SlackConfig) {
    SlackManager.disconnect();
    SlackManager.slack = new CustomSlack();
    return SlackManager.slack.configure(config);
  }
  send(channel: string, text: string): Promise<string|void> {
    return SlackManager.slack.send(channel, text);
  }

  tagUser(name: string): string {
    return SlackManager.slack.tagUser(name);
  }
  static disconnect() {
    if (SlackManager.slack) {
      SlackManager.slack.disconnect();
      SlackManager.slack = null;
    }
  }
  disconnect() {
    return SlackManager.disconnect();
  }
  configure(config: SlackConfig) {
    return SlackManager.configure(config);
  }
}

let Slack = new SlackManager();
export default Slack;


export function configure(config: SlackConfig = {}) {
  return SlackManager.configure(config);
}