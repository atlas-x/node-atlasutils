import * as util from 'util';
import * as winston from 'winston';
import slack from './slack';
import {Slack} from './slack';
import * as _ from 'lodash';

export interface AtlasSlackTransportOptions {
  token?: string;
  channel:string;
  level?: string;
  name?: string;
  env?: string;
  timestamp?: () => string|number;
  formatter?: (options?: AtlasSlackTransportOptions) => any; 
};

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

export class AtlasSlack extends winston.Transport {
  token: string;
  channel: string;
  slack: Slack;
  env: string;
  name: string;
  level: string;
  
  constructor(options: AtlasSlackTransportOptions) {
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
      this.slack = new Slack({token: this.token});
    } else {
      this.slack = slack;
    }
  }

  log(level: string, msg: string, meta: any, callback?: Function) {
    callback = callback || function() {}
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
winston.transports['AtlasSlack'] = AtlasSlack;