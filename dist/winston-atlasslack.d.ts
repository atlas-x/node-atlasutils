export interface AtlasSlackTransportOptions {
    token: string;
    channel: string;
    level?: string;
    name?: string;
    env?: string;
    timestamp?: () => string | number;
    formatter?: (options?: AtlasSlackTransportOptions) => any;
}
