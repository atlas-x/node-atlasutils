'use strict';

import {configure, LoggerConfig} from '../src/logger';
import Logger from '../src/logger';
import * as util from '../src';


describe('Logger', () => {

  beforeEach(() => {
    configure();
  });

  it(`shouldn't crash on configures`, () => {
    configure();
    util.configureLogger();
  });

  it(`should log on base require`, () => {
    Logger.log('hi');
  });

  it(`should log to console`, () => {
    
    let logger = new Logger(__filename);
    let debug = jest.fn();
    Logger.winston.logger.debug = debug;
    let error = jest.fn();
    Logger.winston.logger.error = error;

    logger.log('log');
    expect(debug.mock.calls.length).toBe(1);
    logger.error('error');
    expect(error.mock.calls.length).toBe(1);
  });

  it(`should default to console`, () => {
    expect(Logger.winston.logger.transports.console).toBeDefined();
  });

  it(`should allow DailyRotateFile`, () => {
    configure({
      transports: [{
        type: 'DailyRotateFile',
        properties: {
          filename: './logs/test.log'
        }
      }]
    });
    expect(Logger.winston.logger.transports.dailyRotateFile).toBeDefined();
  });

  it(`should log to slack on error`, () => {
    let slackmock = {
      slack: {
        enabled: true,
      },
      send: jest.fn()
    };
    configure({
      slack: {
        instance: slackmock,
        levels: ['debug'],
        channel: 'errorsss'
      }
    });

    let logger = new Logger(__filename);

    logger.silly('test silly');
    expect(slackmock.send).toHaveBeenCalledTimes(0);
    logger.debug('test debug');
    expect(slackmock.send).toHaveBeenCalledTimes(1);
  });
});