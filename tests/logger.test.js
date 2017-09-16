'use strict';

describe('JS import', () => {
  it('should import correctly', () => {
    let logger = require('../logger');
    expect(logger.configure).toBeDefined();
    expect(logger.log).toBeDefined();
    expect(logger.filename).toBeUndefined();

    let ilogger = logger('fname');
    expect(ilogger.configure).toBeUndefined();
    expect(ilogger.log).toBeDefined();
    expect(ilogger.filename).toBe('fname');
  });
});