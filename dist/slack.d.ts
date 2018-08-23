import { RTMCallResult } from '@slack/client';
export interface SlackConfig {
    enabled?: boolean;
    token?: string;
}
export declare class CustomSlack {
    enabled: boolean;
    users: any[];
    channels: any;
    config: SlackConfig | null;
    private _ready;
    private _slack;
    info: any;
    name: string;
    configure(config: any): void;
    ready(): Promise<string | void>;
    disconnect(): void;
    tagUser(name: string): string;
    send(channel: string, text: string): Promise<string | void | RTMCallResult>;
}
export declare class Slack {
    slack: CustomSlack;
    constructor(config?: SlackConfig);
    send(channel: string, text: string): Promise<string | void | RTMCallResult>;
    tagUser(name: string): string;
    disconnect(): void;
    configure(config: SlackConfig): void;
    instance(): Slack;
}
export declare let slack: Slack;
export default slack;
export declare function configure(config?: SlackConfig): void;
