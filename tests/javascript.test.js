'use strict';

let _ = require('lodash');

describe('JS require', () => {
  it('should require atlas correctly', () => {
    let atlas = require('../dist/'); 
    expect(atlas.Errors).toBeDefined();
    expect(atlas.Logger).toBeDefined();
    expect(atlas.middleware).toBeDefined();
    expect(atlas.slack).toBeDefined();

    expect(_.isFunction(atlas.configureErrors)).toBe(true);
    expect(_.isFunction(atlas.configureLogger)).toBe(true);
    expect(_.isFunction(atlas.configureMiddleware)).toBe(true);
    expect(_.isFunction(atlas.configureSlack)).toBe(true);
  });

  it('should require errors correctly', () => {
    let Errors = require('../errors');
    expect(Errors.DoneError).toBeDefined();
  });

  it('should require logger correctly', () => {
    let logger = require('../logger.js');
    expect(logger.Logger).toBeDefined();
    expect(_.isFunction(logger.debug)).toBe(true);

    let logger2 = new logger.Logger('logger2');
    expect(_.isFunction(logger2.debug)).toBe(true);

    let logger3 = logger('logger3');
    expect(_.isFunction(logger3.debug)).toBe(true);
  });

  it('should require middleware correctly', () => {
    let mw = require('../middleware.js');
    expect(_.isFunction(mw)).toBe(true);
  }); 

  it('should require slack correctly', () => {
    let slack = require('../slack.js');
    expect(_.isFunction(slack.slack.send)).toBe(true);
    expect(slack.Slack).toBeDefined();
  });

  
});