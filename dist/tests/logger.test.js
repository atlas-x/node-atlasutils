'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("../lib/logger");
const logger_2 = require("../lib/logger");
const util = require("../lib");
describe('Logger', () => {
    beforeEach(() => {
        logger_1.configure();
    });
    it(`shouldn't crash on configures`, () => {
        logger_1.configure();
        util.configureLogger();
    });
    it(`should log on base require`, () => {
        logger_2.default.log('hi');
    });
    it(`should log to console`, () => {
        let logger = new logger_2.default(__filename);
        let debug = jest.fn();
        logger_2.default.winston.logger.debug = debug;
        let error = jest.fn();
        logger_2.default.winston.logger.error = error;
        logger.log('log');
        expect(debug.mock.calls.length).toBe(1);
        logger.error('error');
        expect(error.mock.calls.length).toBe(1);
    });
    it(`should default to console`, () => {
        expect(logger_2.default.winston.logger.transports.console).toBeDefined();
    });
    it(`should allow DailyRotateFile`, () => {
        logger_1.configure({
            transports: [{
                    type: 'DailyRotateFile',
                    properties: {
                        filename: './logs/test.log'
                    }
                }]
        });
        expect(logger_2.default.winston.logger.transports.dailyRotateFile).toBeDefined();
    });
    it(`should log to slack on error`, () => {
        let slackmock = {
            slack: {
                enabled: true,
            },
            send: jest.fn()
        };
        logger_1.configure({
            slack: {
                instance: slackmock,
                levels: ['debug'],
                channel: 'errorsss'
            }
        });
        let logger = new logger_2.default(__filename);
        logger.silly('test silly');
        expect(slackmock.send).toHaveBeenCalledTimes(0);
        logger.debug('test debug');
        expect(slackmock.send).toHaveBeenCalledTimes(1);
    });
});
