import * as winston from 'winston';
import '../lib/winston-atlasslack';
import {AtlasSlack} from '../lib/winston-atlasslack';

describe('winston-atlasslack', () => {
  it('should succeed on constructor', () => {
    let transport = new (AtlasSlack)({
      token: '555',
      channel: 'general'
    });
    let logger = new winston.Logger({transports: [transport]});
  });

  it('should succeed adding dynamically', () => {
    let winny = new winston.Logger({transports:[]});
    winny.add(winston.transports['AtlasSlack'], {token: '555', channel: 'general'});
  });

  it('should call atlasslack log', () => {
    let trans = new AtlasSlack({
      token: '555',
      channel: 'general'
    });
    trans.log = jest.fn();
    let winny = new winston.Logger({transports:[trans]});
    winny.log('debug', 'hi');
    expect(trans.log).toHaveBeenCalledTimes(0);
    winny.log('error', 'hi');
    expect(trans.log).toHaveBeenCalled();
    expect(trans.log.mock.calls[0][0]).toBe('error');
    expect(trans.log.mock.calls[0][1]).toBe('hi');
  });

  function getWinston() {
    let trans = new AtlasSlack({
      token: '555',
      channel: 'general',
      env: 'testing'
    });
    trans.slack.send = jest.fn(() => Promise.resolve());
    let winny = new winston.Logger({transports: [trans]});
    return {trans, winny};
  }

  describe('Slack calls', () => {
    beforeEach(() => {
      jest.resetModules();
      jest.resetAllMocks();
    });

    it('should call callback on success', (done) => {
      let {trans, winny} = getWinston();
      winny.log('warn', 'hi', {}, function(err, level, msg, meta) {
        expect(trans.slack.send).toHaveBeenCalledTimes(1);
        expect(trans.slack.send.mock.calls[0][0]).toBe('general');
        let date = (new Date()).toISOString().substr(0, 10);
        expect(trans.slack.send.mock.calls[0][1].substr(0, 16)).toBe(`TESTING hi`);
        expect(err).toBeNull();

        done();
      });
    });

    it('should call callback on failure', (done) => {
      let {trans, winny} = getWinston();
      trans.slack.send = jest.fn(() => Promise.reject('error!'));
      let called = 0;
      // don't know why, but winston needs this to be a normal function, not arrowed
      winny.log('warn', 'hi', {}, function(err, level, msg, meta) {
        called += 1;
        // this function gets called on error and then again when all transports are complete
        if (called === 1) {
          expect(trans.slack.send).toHaveBeenCalledTimes(1);
          expect(err).toBe('error!');
        }
        done();
      });
    });

    it('should truncate stack traces', done => {
      let {trans, winny} = getWinston();
      let msg = `hi test
          stack:
          this
          is
          a
          stack
          test`;
      winny.log('warn', msg, {}, function(err, level, msg, meta) {
        expect(err).toBeNull();
        expect(trans.slack.send.mock.calls[0][1]).toBe(`TESTING hi test
          stack:
          this
          is
          a`);
        done();
      });
    });
  });
});