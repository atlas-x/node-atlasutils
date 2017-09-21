/// <reference types="winston" />
import { TransportOptions, LoggerInstance } from 'winston';
import 'winston-daily-rotate-file';
import './winston-atlasslack';
import { AtlasSlackTransportOptions } from './winston-atlasslack';
export interface LoggerConfig {
    env?: string;
    transports?: Array<TransportOptions | AtlasSlackTransportOptions>;
    verbose?: boolean;
    cwd?: string;
}
export declare class CustomWinston {
    config: LoggerConfig;
    logger: LoggerInstance;
    filename: string;
    constructor(config?: LoggerConfig);
}
export declare let Logger: {
    new (filename?: string): {
        _log(level: string, ...args: any[]): void;
        filename: string;
        silly(...args: any[]): void;
        debug(...args: any[]): void;
        info(...args: any[]): void;
        warn(...args: any[]): void;
        error(...args: any[]): void;
        log(...args: any[]): void;
    };
    winston: CustomWinston;
    _log(level: string, ...args: any[]): void;
    silly(...args: any[]): void;
    debug(...args: any[]): void;
    info(...args: any[]): void;
    warn(...args: any[]): void;
    error(...args: any[]): void;
    log(...args: any[]): void;
    transform(...args: any[]): any[];
    prefix(filename: string): {
        _log(level: string, ...args: any[]): void;
        filename: string;
        silly(...args: any[]): void;
        debug(...args: any[]): void;
        info(...args: any[]): void;
        warn(...args: any[]): void;
        error(...args: any[]): void;
        log(...args: any[]): void;
    };
};
export default Logger;
export declare function configure(config?: LoggerConfig): void;
