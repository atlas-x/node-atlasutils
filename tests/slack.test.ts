'use strict';

import {configure} from '../lib/slack';
import slack from '../lib/slack';
import * as utils from '../lib';
import { WebAPICallResult } from '@slack/web-api';
import { SlackMemberProfile, SlackMember, SlackUserGroup } from '../lib/slack-extensions';

describe('Slack', () => {
  describe('Stability', () => {

    it(`shouldn't crash on configures`, () => {
      expect.assertions(1);
      configure();
      utils.configureSlack();
      expect(slack.slack.ready()).rejects.toBeDefined();
    });

    it(`should require configure before use`, () => {
      expect.assertions(1);
      expect(slack.send('1', '2')).rejects.toBeDefined();
    });
  });

  describe('Logic', () => {
    let channel;
    beforeAll(async () => {
      if (!process.env.SLACK_TOKEN || !process.env.SLACK_CHANNEL) {
        throw new Error('must export env variables SLACK_TOKEN and SLACK_CHANNEL');
      }
      channel = process.env.SLACK_CHANNEL;

      slack.configure({enabled: true, token: process.env.SLACK_TOKEN});
      await slack.slack.ready();
    });

    it('should tag a user', () => {
      slack.slack.users.push(...<SlackMember[]>[
        {name: 'abcde', id: 'U555'},
        {name: 'fghij', profile: {last_name: 'klmno'}, id: 'U666'}
      ]);
      expect(slack.tagUser('abcde')).toBe('<@U555>');
      expect(slack.tagUser('klmno')).toBe('<@U666>');
      expect(slack.tagUser('joke')).toBe('joke');
    });

    it('should tag a group', () => {
      slack.slack.groups.push(...<SlackUserGroup[]>[
        {name: 'fakename', id: '1234', handle: 'devs'},
        {name: 'what', id: '2345', handle: 'ever'}
      ]);
      expect(slack.tagUser('devs')).toBe(`<!subteam^1234>`);
      expect(slack.tagUser('what')).toBe(`<!subteam^2345>`);
    })


    it('should send a message', async () => {

      return slack.send(process.env.SLACK_CHANNEL, `This is a test ${slack.tagUser('atlasbot')}`)
        .then((message) => {
          expect(message).toBeDefined();
          expect(slack.slack.users.length).toBeGreaterThan(0);
          expect((<WebAPICallResult>message).error).toBeUndefined();
        });
    });

    it('should upload a snippet', async() => {
      return slack.logError(process.env.SLACK_CHANNEL, `PRODUCTION 192.168.0.1:8080 - testing@atlas-x.com - dev.atlas-x.com - "POST /api/tests HTTP/1.1" 500 - "https://dev.atlas-x.com/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36" body:{}`)
        .then((message) => {
          expect(message).toBeDefined();
          expect((<WebAPICallResult>message).error).toBeUndefined();
        });
    })
  });
});