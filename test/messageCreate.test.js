const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Collection, Events } = require('discord.js');

const createMessageCreate = require('../src/events/messageCreate');

function createMessage(overrides = {}) {
	const users = overrides.users ?? new Collection();
	const sent = [];

	const message = {
		author: { bot: false },
		channel: {
			send(content) {
				sent.push(content);
				return Promise.resolve();
			},
			isSendable: () => true,
		},
		guild: { id: 'guild' },
		guildId: 'guild',
		inGuild: () => true,
		webhookId: null,
		...overrides,
		mentions: {
			everyone: false,
			repliedUser: null,
			roles: new Collection(),
			users,
			...overrides.mentions,
		},
	};

	return { message, sent };
}

test(
	'messageCreate exposes the Discord message-create event',
	() => {
		const event = createMessageCreate({ monitoring: () => false });

		assert.equal(event.name, Events.MessageCreate);
	},
);

test(
	'messageCreate ignores messages outside its monitoring scope',
	async (testContext) => {
		const mentionedUser = { id: 'protected' };
		const users = new Collection([[mentionedUser.id, mentionedUser]]);
		const cases = [
			['bot message', { author: { bot: true }, users }],
			['webhook message', { users, webhookId: 'webhook' }],
			['direct message', { guild: null, users }],
			['message without user mentions', {}],
			[
				'everyone mention',
				{
					users,
					mentions: {
						everyone: true,
						repliedUser: null,
						roles: new Collection(),
						users,
					},
				},
			],
			[
				'role mention',
				{
					users,
					mentions: {
						everyone: false,
						repliedUser: null,
						roles: new Collection([['role', { id: 'role' }]]),
						users,
					},
				},
			],
		];

		for (const [name, overrides] of cases) {
			await testContext.test(name, () => {
				const monitoringCalls = [];
				const event = createMessageCreate({
					monitoring(guildId, userId) {
						monitoringCalls.push([guildId, userId]);
						return true;
					},
				});
				const { message, sent } = createMessage(overrides);

				event.execute(message);

				assert.deepEqual(sent, []);
				assert.deepEqual(monitoringCalls, []);
			});
		}
	},
);

test(
	'messageCreate sends one generic reminder for multiple protected mentions',
	() => {
		const firstUser = { id: 'first' };
		const secondUser = { id: 'second' };
		const users = new Collection([
			[firstUser.id, firstUser],
			[secondUser.id, secondUser],
		]);
		const monitoringCalls = [];
		const event = createMessageCreate({
			monitoring(guildId, userId) {
				monitoringCalls.push([guildId, userId]);
				return true;
			},
		});
		const { message, sent } = createMessage({ users });

		event.execute(message);

		assert.equal(sent.length, 1);
		assert.match(sent[0].content, /members prefer|some prefer/);
		assert.equal(sent[0].content.includes('<@'), false);
		assert.deepEqual(
			monitoringCalls,
			[
				['guild', 'first'],
				['guild', 'second'],
			],
		);
		assert.deepStrictEqual(
			sent[0].allowedMentions, {
				parse: [],
				repliedUser: false,
			});
	},
);

test(
	'messageCreate does not respond when mentioned members have not opted in',
	() => {
		const user = { id: 'unprotected' };
		const event = createMessageCreate({ monitoring: () => false });
		const { message, sent } = createMessage({
			users: new Collection([[user.id, user]]),
		});

		event.execute(message);

		assert.deepEqual(sent, []);
	},
);

test(
	'messageCreate mentioned replied-to user is included in monitoring',
	() => {
		const repliedUser = { id: 'protected-reply-user' };
		const users = new Collection(
			[[repliedUser.id, repliedUser]],
		);
		const checkedUsers = [];
		const event = createMessageCreate({
			monitoring(guildId, userId) {
				checkedUsers.push(userId);
				return true;
			},
		});
		const { message, sent } = createMessage({
			mentions: {
				everyone: false,
				repliedUser,
				roles: new Collection(),
				users,
			},
		});

		event.execute(message);

		assert.deepEqual(checkedUsers, ['protected-reply-user']);
		assert.equal(sent.length, 1);
	},
);

test('messageCreate does not monitor a reply without explicit mentions', () => {
	const repliedUser = { id: 'protected' };
	const checkedUsers = [];

	const event = createMessageCreate({
		monitoring(guildId, userId) {
			checkedUsers.push([guildId, userId]);
			return true;
		},
	});

	const { message, sent } = createMessage({
		mentions: {
			everyone: false,
			repliedUser,
			roles: new Collection(),
			users: new Collection(),
		},
	});

	event.execute(message);

	assert.deepEqual(checkedUsers, []);
	assert.equal(sent.length, 0);
});

// TODO: prevent mentions in custom text
// test(
// 	'prevent mentions in custom text',
// 	() => {
// 		assert.deepEqual(
// 			sendOptions.allowedMentions,
// 			{
// 				parse: [],
// 				repliedUser: false,
// 			},
// 		);
// 	},
// );
