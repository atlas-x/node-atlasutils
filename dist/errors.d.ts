export declare class StatusError extends Error {
    name: string;
    status: number;
    data: any;
    constructor(message?: string, data?: any);
}
export declare class UserError extends StatusError {
    status: number;
}
export declare let User: typeof UserError;
export declare class UnauthorizedError extends StatusError {
    status: number;
}
export declare let Unauthorized: typeof UnauthorizedError;
export declare class ForbiddenError extends StatusError {
    status: number;
}
export declare let Forbidden: typeof ForbiddenError;
export declare class NotFoundError extends StatusError {
    status: number;
}
export declare let NotFound: typeof NotFoundError;
export declare class ServerError extends StatusError {
    status: number;
}
export declare let Server: typeof ServerError;
export declare class DoneError extends Error {
}
export declare let Done: typeof DoneError;
export interface ErrorsMap {
    [e: string]: new () => Error;
}
export interface ErrorsConfig {
    normalize?: (error: any, Errors: ErrorsMap) => null | StatusError;
}
export declare function normalizeError(error: any): any;
export declare function configure(config?: ErrorsConfig): void;
