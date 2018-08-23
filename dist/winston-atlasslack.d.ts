import * as winston from 'winston';
import { Slack } from './slack';
export interface AtlasSlackTransportOptions {
    token?: string;
    channel: string;
    level?: string;
    name?: string;
    env?: string;
    timestamp?: () => string | number;
    formatter?: (options?: AtlasSlackTransportOptions) => any;
}
export declare class AtlasSlack extends winston.Transport {
    token: string;
    channel: string;
    slack: Slack;
    env: string;
    name: string;
    level: string;
    constructor(options: AtlasSlackTransportOptions);
    log(level: string, msg: string, meta: any, callback?: Function): void;
}
