'use strict';

import {configure, LoggerConfig} from '../lib/logger';
import Logger from '../lib/logger';
import * as util from '../lib';


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

  it(`should allow AtlasSlack`, () => {
    configure({
      transports: [{
        type: 'AtlasSlack',
        properties: {
          token: 'xx'
        }
      }]
    });
    expect(Logger.winston.logger.transports.AtlasSlack).toBeDefined();
  });
});