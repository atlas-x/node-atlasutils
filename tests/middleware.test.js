'use strict';

describe('Middleware', () => {
  let req, res, logger;
  
  function use(register) {
    register(req, res, jest.fn());
  }

  beforeEach(() => {
    req = {xhr: true, headers: {}};
    res = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      render: jest.fn().mockReturnThis(),
    };
    logger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn()
    };
  });

  it(`shouldn't crash on require`, () => {
    require('../middleware');
  });

  it(`shouldn't crash on require from index`, () => {
    require('../').Middleware;
  });

  it(`should allow registration with express`, () => {
    let mw = require('../middleware');
    use(mw);
    expect(res.userError).toBeDefined;
    res.userError('message');
    expect(res.status).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();
  });

  it('should allow configuring a logger', () => {
    let mw = require('../middleware');
    mw.configure({logger: logger});
    use(mw);

    res.serverError('message');
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledTimes(0);
    res.forbidden('message');
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledTimes(0);
  });

  it(`shoudl allow configuring log levels`, () => {
    let mw = require('../middleware');
    mw.configure({logger: logger, log: ['serverError', 'forbidden']});
    use(mw);

    res.serverError('message');
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledTimes(0);
    res.forbidden('message');
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledTimes(1);
  })

  it(`should extract messages from input`, () => {
    use(require('../middleware'));

    res.notFound('heh');
    expect(res.json).toHaveBeenLastCalledWith({status: 404, message: 'heh'});
    res.notFound(111, 'heh');
    expect(res.json).toHaveBeenLastCalledWith({status: 111, message: 'heh'});
    res.notFound(111, 'heh', {help: true});
    expect(res.json).toHaveBeenLastCalledWith({status: 111, message: 'heh', data: {help: true}});
    res.notFound({status: 111, data: 'thing'});
    expect(res.json).toHaveBeenLastCalledWith({status: 111, message: 'Not Found', data: 'thing'});
  });


})