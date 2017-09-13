'use strict';

describe('Logger', () => {

  it(`shouldn't crash on require from index`, () => {
    let logger = require('../').Logger(__filename);
    require('../').configureLogger();
  });

  it(`shouldn't crash on direct require`, () => {
    let logger = require('../logger')(__filename);
    require('../logger').configure();
  });

  it(`should log to console`, () => {
    let logger = require('../logger')(__filename);
    let debug = jest.fn();
    logger.winston.logger.debug = debug;
    let error = jest.fn();
    logger.winston.logger.error = error;

    logger.log('log');
    expect(debug.mock.calls.length).toBe(1);
    logger.error('error');
    expect(error.mock.calls.length).toBe(1);
  });

  it(`should default to console`, () => {
    let logger = require('../logger')(__filename);
    expect(logger.winston.logger.transports.console).toBeDefined();
  });

  it(`should allow DailyRotateFile`, () => {
    require('../').configureLogger({
      transports: [{
        type: 'DailyRotateFile',
        properties: {
          filename: './logs/test.log'
        }
      }]
    });
    let logger = require('../logger')(__filename);
    expect(logger.winston.logger.transports.dailyRotateFile).toBeDefined();
  });
});