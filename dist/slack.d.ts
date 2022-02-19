import { WebAPICallResult } from '@slack/web-api';
import { SlackMember, SlackUserGroup } from './slack-extensions';
export interface SlackConfig {
    enabled?: boolean;
    token?: string;
}
export declare class CustomSlack {
    enabled: boolean;
    users: SlackMember[];
    groups: SlackUserGroup[];
    conversations: {};
    config: SlackConfig | null;
    private _ready;
    private _slack;
    info: any;
    name: string;
    list(resource: string, args: any, key: string): Promise<any>;
    configure(config: any): void;
    ready(): Promise<string | void>;
    tagUser(name: string): string;
    send(channel: string, text: string): Promise<string | void | WebAPICallResult>;
    logError(channel: string, error: string, title?: string): Promise<string | void | WebAPICallResult>;
}
export declare class Slack {
    slack: CustomSlack;
    constructor(config?: SlackConfig);
    send(channel: string, text: string): Promise<string | void | WebAPICallResult>;
    logError(channel: string, error: string, title?: string): Promise<string | void | WebAPICallResult>;
    tagUser(name: string): string;
    configure(config: SlackConfig): void;
    instance(): Slack;
}
export declare let slack: Slack;
export default slack;
export declare function configure(config?: SlackConfig): void;
