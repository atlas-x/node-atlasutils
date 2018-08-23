export interface MiddlewareConfig {
    log?: string[];
    logger?: any;
    logUrl?: boolean;
    getUser?: (req: any) => string | void;
    errorView?: string;
    blacklist?: string[];
    env?: string;
}
export declare let middleware: (req: any, res: any, next: any) => void;
export default middleware;
export declare function configure(config?: MiddlewareConfig): void;
export declare function logRequests(app: any): string;
