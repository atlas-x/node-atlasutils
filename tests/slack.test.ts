'use strict';

import {configure} from '../lib/slack';
import slack from '../lib/slack';
import * as utils from '../lib';

describe('Slack', () => {
  describe('Stability', () => {

    it(`shouldn't crash on configures`, () => {
      configure();
      utils.configureSlack();
    });

    it(`should require configure before use`, () => {
      expect(slack.send('1', '2')).rejects.toBeDefined();
    });
  });

  describe('Logic', () => {
    let channel;
    beforeEach(() => {
      if (!process.env.SLACK_TOKEN || !process.env.SLACK_CHANNEL) {
        throw new Error('must export env variables SLACK_TOKEN and SLACK_CHANNEL');
      }
      channel = process.env.SLACK_CHANNEL;

      return slack.configure({token: process.env.SLACK_TOKEN});
    });

    afterEach(() => {
      slack.disconnect();
    });

    it('should send to a channel', () => {
      jest.setTimeout(5000);
      return slack.send(channel, 'test')
    });
  });
});