'use strict';


describe('Slack', () => {
  beforeEach(() => {
    delete require.cache[require.resolve('../slack')];
  });

  describe('Stability', () => {

    it(`shouldn't crash on require`, () => {
      require('../slack');
      require('../slack').configure();
    });

    it(`shouldn't crash on require from index`, () => {
      require('../').Slack;
      require('../').configureSlack();
    });

    it(`should require configure before use`, () => {
      expect(require('../slack').send()).rejects.toBeDefined();
    });
  });

  describe('Logic', () => {
    let slack, channel;
    beforeEach(() => {
      if (!process.env.SLACK_TOKEN || !process.env.SLACK_CHANNEL) {
        throw new Error('must export env variables SLACK_TOKEN and SLACK_CHANNEL');
      }
      channel = process.env.SLACK_CHANNEL;

      slack = require('../slack');
      return slack.configure({token: process.env.SLACK_TOKEN});
    });

    afterEach(() => {
      slack.disconnect();
    });

    it('should send to a channel', () => {
      jest.setTimeout(10000);
      return slack.send(channel, 'test')
    });
  });
});