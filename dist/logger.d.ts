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
    constructor(config: LoggerConfig);
}
export default class Logger {
    filename: string;
    static winston: CustomWinston;
    static _log(level: string, ...args: any[]): void;
    _log(level: string, ...args: any[]): void;
    constructor(filename?: string);
    static silly(...args: any[]): void;
    silly(...args: any[]): void;
    static debug(...args: any[]): void;
    debug(...args: any[]): void;
    static info(...args: any[]): void;
    info(...args: any[]): void;
    static warn(...args: any[]): void;
    warn(...args: any[]): void;
    static error(...args: any[]): void;
    error(...args: any[]): void;
    static log(...args: any[]): void;
    log(...args: any[]): void;
    static transform(...args: any[]): any[];
}
export declare function configure(config?: LoggerConfig): void;
