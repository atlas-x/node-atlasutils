export interface MiddlewareConfig {
    log?: string[];
    logger?: any;
    logUrl?: boolean;
    getUser?: (req: any) => string | void;
}
export default function middleware(req: any, res: any, next: any): void;
export declare function configure(config?: MiddlewareConfig): void;
