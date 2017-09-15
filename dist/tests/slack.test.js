'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const slack_1 = require("../src/slack");
const slack_2 = require("../src/slack");
const utils = require("../src");
describe('Slack', () => {
    describe('Stability', () => {
        it(`shouldn't crash on configures`, () => {
            slack_1.configure();
            utils.configureSlack();
        });
        it(`should require configure before use`, () => {
            expect(slack_2.default.send('1', '2')).rejects.toBeDefined();
        });
    });
    describe('Logic', () => {
        let channel;
        beforeEach(() => {
            if (!process.env.SLACK_TOKEN || !process.env.SLACK_CHANNEL) {
                throw new Error('must export env variables SLACK_TOKEN and SLACK_CHANNEL');
            }
            channel = process.env.SLACK_CHANNEL;
            return slack_2.default.configure({ token: process.env.SLACK_TOKEN });
        });
        afterEach(() => {
            slack_2.default.disconnect();
        });
        it('should send to a channel', () => {
            jest.setTimeout(5000);
            return slack_2.default.send(channel, 'test');
        });
    });
});
