"use strict";

import {
  WebClient,
  LogLevel,
  WebAPICallResult,
  CallUser,
} from "@slack/web-api";
import * as _ from "lodash";
import {
  SlackMember,
  SlackMemberProfile,
  SlackUserGroup,
} from "./slack-extensions";

export interface SlackConfig {
  enabled?: boolean;
  token?: string;
}

const DEFAULT: SlackConfig = {
  enabled: true,
  token: "",
};

export class CustomSlack {
  enabled: boolean = false;
  users: SlackMember[] = [];
  groups: SlackUserGroup[] = [];
  conversations = {};
  config: SlackConfig | null = null;
  private _ready = null;
  private _slack: WebClient = null;
  info: any = null;
  name: string = null;

  async list(resource: string, args: any, key: string) {
    let results = [];

    args = _.merge({}, args, { limit: 10000 });

    for await (let page of this._slack.paginate(resource, args)) {
      if (
        !(page[key] && Array.isArray(page[key]) && (<any[]>page[key]).length)
      ) {
        break;
      }
      results = results.concat(page[key]);
    }
    return results;
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
      this._slack = new WebClient(this.config.token, {
        logLevel: LogLevel.ERROR,
        rejectRateLimitedCalls: true,
      });
    } catch (e) {
      console.error(e);
      this._ready = Promise.reject(e.message);
      return;
    }
  }

  ready(): Promise<string | void> {
    if (this._ready) return this._ready;
    if (this.config && this.enabled) {
      this._ready = new Promise(async (resolve, reject) => {
        try {
          let self = await this._slack.auth.test();

          this.name = <string>self.user;
          this.info = await this._slack.team.info().then((res) => res.team);
          this.users = await this.list("users.list", {}, "members");
          const conversations = await this.list(
            "conversations.list",
            {
              types: "public_channel,private_channel",
              exclude_archived: true,
            },
            "channels"
          );

          for (let convo of <any[]>conversations) {
            this.conversations[convo.name_normalized] = convo;
          }
          resolve(true);
        } catch (e) {
          console.error(e);
          reject(e);
        }
      });
      return this._ready;
    } else {
      if (!this.enabled) {
        return Promise.reject("Slack is not enabled");
      }
      return Promise.reject(`You must call '.configure' before using Slack`);
    }
  }

  tagUser(name: string): string {
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
        if (
          reg.test(user.profile.last_name) ||
          reg.test(user.profile.first_name)
        ) {
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

  async send(
    channel: string,
    text: string
  ): Promise<string | void | WebAPICallResult> {
    await this.ready();
    if (!this.conversations[channel]) {
      return Promise.reject(
        `Could not find #${channel} (maybe ${this.name} is not invited?)`
      );
    }

    let res = await this._slack.chat.postMessage({
      text,
      channel: this.conversations[channel].id,
    });

    return res;
  }

  async logError(
    channel: string,
    error: string,
    title: string = "error"
  ): Promise<string | void | WebAPICallResult> {
    await this.ready();
    if (!this.conversations[channel]) {
      return Promise.reject(
        `Could not find #${channel} (maybe ${this.name} is not invited?)`
      );
    }

    let filename = `${new Date().toISOString()} ${title}.log`;

    let res = await this._slack.files.upload({
      channels: this.conversations[channel].id,
      filename,
      content: error,
      filetype: "javascript",
    });

    return res;
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

  send(
    channel: string,
    text: string
  ): Promise<string | void | WebAPICallResult> {
    return this.slack.send(channel, text);
  }

  logError(
    channel: string,
    error: string,
    title?: string
  ): Promise<string | void | WebAPICallResult> {
    return this.slack.logError(channel, error, title);
  }

  tagUser(name: string): string {
    return this.slack.tagUser(name);
  }
  configure(config: SlackConfig) {
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
