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
    send(channel: string, text: string): Promise<string | void>;
}
export declare class SlackManager {
    static slack: CustomSlack;
    slack: CustomSlack;
    constructor();
    static configure(config: SlackConfig): void;
    send(channel: string, text: string): Promise<string | void>;
    tagUser(name: string): string;
    static disconnect(): void;
    disconnect(): void;
    configure(config: SlackConfig): void;
}
declare let Slack: SlackManager;
export default Slack;
export declare function configure(config?: SlackConfig): void;
