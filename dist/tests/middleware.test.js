'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const middleware_1 = require("../src/middleware");
const middleware_2 = require("../src/middleware");
const utils = require("../src");
describe('Middleware', () => {
    let req, res, logger;
    function use(register) {
        register(req, res, jest.fn());
    }
    beforeEach(() => {
        req = { xhr: true, headers: {}, url: '/test' };
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
        it(`shouldn't crash on configures`, () => {
            middleware_1.configure();
            utils.configureMiddleware();
        });
        it(`should allow registration with express`, () => {
            use(middleware_2.default);
            expect(res.userError).toBeDefined;
            res.userError('message');
            expect(res.status).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalled();
        });
    });
    describe('Logic', () => {
        beforeEach(() => {
            use(middleware_2.default);
        });
        it('should allow configuring a logger', () => {
            middleware_1.configure({ logger: logger });
            res.serverError('message');
            expect(logger.error).toHaveBeenCalledTimes(1);
            expect(logger.warn).toHaveBeenCalledTimes(0);
            res.forbidden('message');
            expect(logger.error).toHaveBeenCalledTimes(1);
            expect(logger.warn).toHaveBeenCalledTimes(0);
        });
        it(`shoudl allow configuring log levels`, () => {
            middleware_1.configure({ logger: logger, log: ['serverError', 'forbidden'] });
            res.serverError('message');
            expect(logger.error).toHaveBeenCalledTimes(1);
            expect(logger.warn).toHaveBeenCalledTimes(0);
            res.forbidden('message');
            expect(logger.error).toHaveBeenCalledTimes(1);
            expect(logger.warn).toHaveBeenCalledTimes(1);
        });
        it(`should extract messages from input`, () => {
            res.notFound('heh');
            expect(res.json).toHaveBeenLastCalledWith({ status: 404, message: 'heh' });
            res.notFound(111, 'heh');
            expect(res.json).toHaveBeenLastCalledWith({ status: 111, message: 'heh' });
            res.notFound(111, 'heh', { help: true });
            expect(res.json).toHaveBeenLastCalledWith({ status: 111, message: 'heh', data: { help: true } });
            res.notFound({ status: 111, data: 'thing' });
            expect(res.json).toHaveBeenLastCalledWith({ status: 111, message: 'Not Found', data: 'thing' });
        });
        it(`should display a user`, () => {
            middleware_1.configure({
                logger,
                getUser: jest.fn(() => 'billy')
            });
            use(middleware_2.default);
            res.serverError('jean');
            expect(logger.error).toHaveBeenCalled();
            expect(logger.error).toHaveBeenCalledWith('[billy]', '- /test -', 'jean');
        });
        it(`should disable url logging`, () => {
            middleware_1.configure({
                logger
            });
            res.serverError('test');
            expect(logger.error).toHaveBeenLastCalledWith('- /test -', 'test');
            middleware_1.configure({
                logger,
                logUrl: false
            });
            res.serverError('test');
            expect(logger.error).toHaveBeenLastCalledWith('test');
        });
    });
});
