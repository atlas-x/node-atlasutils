'use strict';

describe('Middleware', () => {
  let req, res, logger, mw;
  
  function use(register) {
    register(req, res, jest.fn());
  }

  beforeEach(() => {
    req = {xhr: true, headers: {}, url: '/test'};
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

  describe('Stability', () => {
    it(`shouldn't crash on require`, () => {
      require('../middleware');
      require('../middleware').configure();
    });

    it(`shouldn't crash on require from index`, () => {
      require('../').Middleware;
      require('../').configureMiddleware();
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
  });

  describe('Logic', () => {

    beforeEach(() => {
      mw = require('../middleware');
      use(mw);
    });
  
    it('should allow configuring a logger', () => {
      mw.configure({logger: logger});

      res.serverError('message');
      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.warn).toHaveBeenCalledTimes(0);
      res.forbidden('message');
      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.warn).toHaveBeenCalledTimes(0);
    });

    it(`shoudl allow configuring log levels`, () => {
      
      mw.configure({logger: logger, log: ['serverError', 'forbidden']});
      
      res.serverError('message');
      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.warn).toHaveBeenCalledTimes(0);
      res.forbidden('message');
      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.warn).toHaveBeenCalledTimes(1);
    })

    it(`should extract messages from input`, () => {
      res.notFound('heh');
      expect(res.json).toHaveBeenLastCalledWith({status: 404, message: 'heh'});
      res.notFound(111, 'heh');
      expect(res.json).toHaveBeenLastCalledWith({status: 111, message: 'heh'});
      res.notFound(111, 'heh', {help: true});
      expect(res.json).toHaveBeenLastCalledWith({status: 111, message: 'heh', data: {help: true}});
      res.notFound({status: 111, data: 'thing'});
      expect(res.json).toHaveBeenLastCalledWith({status: 111, message: 'Not Found', data: 'thing'});
    });

    it(`should display a user`, () => {
      
      mw.configure({
        logger,
        getUser: jest.fn(() => 'billy')
      });
      use(mw);

      res.serverError('jean');
      expect(logger.error).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith('[billy]', '- /test -', 'jean');
    });

    it(`should disable url logging`, () => {
      mw.configure({
        logger
      });

      res.serverError('test');
      expect(logger.error).toHaveBeenLastCalledWith('- /test -', 'test');

      mw.configure({
        logger,
        logUrl: false
      });

      res.serverError('test');
      expect(logger.error).toHaveBeenLastCalledWith('test');
    });
  });
})