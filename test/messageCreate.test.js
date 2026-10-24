const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Collection, Events } = require('discord.js');

const createMessageCreate = require('../src/events/messageCreate');

/**
 * @typedef {import('discord.js').Message} Message
 * @typedef {{ id: string }} TestUser
 * @typedef {{ id: string }} TestRole
 * @typedef {{
 *   content: string,
 *   allowedMentions: { parse: never[], repliedUser: boolean }
 * }} SentMessage
 * @typedef {{
 *   everyone?: boolean,
 *   repliedUser?: TestUser | null,
 *   roles?: Collection<string, TestRole>,
 *   users?: Collection<string, TestUser>
 * }} MentionOverrides
 * @typedef {{
 *   author?: { bot: boolean },
 *   guild?: { id: string } | null,
 *   mentions?: MentionOverrides,
 *   users?: Collection<string, TestUser>,
 *   webhookId?: string | null
 * }} MessageOverrides
 */

/**
 * Creates the partial message double used by these event tests.
 *
 * @param {MessageOverrides} overrides
 * @returns {{ message: Message, sent: SentMessage[] }}
 */
function createMessage(overrides = {}) {
	const users = overrides.users ?? new Collection();
	/** @type {SentMessage[]} */
	const sent = [];

	const messageDouble = {
		author: { bot: false },
		channel: {
			/** @param {SentMessage} content */
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
	const message =
		/** @type {Message} */
		(
			/** @type {unknown} */
			(messageDouble)
		);

	return { message, sent };
}

/**
 * Creates a monitoring service test double.
 *
 * @param {boolean} enabled
 * @returns {ReturnType<typeof import('../src/services/monitoring')>}
 */
function createMonitoringMock(enabled = false) {
	return {
		isEnabled: () => enabled,
		getMessage: () => null,
		getVisibility: () => 'generic',
		getCooldown: () => null,
	};
}

test(
	'messageCreate exposes the Discord message-create event',
	() => {
		const event = createMessageCreate({ monitoring: createMonitoringMock(false) });

		assert.equal(event.name, Events.MessageCreate);
	},
);

test(
	'messageCreate ignores messages outside its monitoring scope',
	async (testContext) => {
		const mentionedUser = { id: 'protected' };
		const users = new Collection([[mentionedUser.id, mentionedUser]]);
		/** @type {[string, MessageOverrides][]} */
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
				/** @type {[string, string][]} */
				const monitoringCalls = [];
				const monitoring = createMonitoringMock(true);
				monitoring.isEnabled = (guildId, userId) => {
					monitoringCalls.push([guildId, userId]);
					return true;
				};
				const event = createMessageCreate({ monitoring });
				const { message, sent } = createMessage(overrides);

				event.execute(message);

				assert.deepEqual(sent, []);
				assert.deepEqual(monitoringCalls, []);
			});
		}
	},
);

test(
	'messageCreate sends a custom message for exactly one protected mention',
	() => {
		const protectedUser = { id: 'protected' };
		const users = new Collection([[protectedUser.id, protectedUser]]);
		/** @type {[string, string][]} */
		const messageCalls = [];
		/** @type {[string, string][]} */
		const visibilityCalls = [];
		const monitoring = createMonitoringMock(true);
		monitoring.getMessage = (guildId, userId) => {
			messageCalls.push([guildId, userId]);
			return 'Please use threads instead of pinging me.';
		};
		monitoring.getVisibility = (guildId, userId) => {
			visibilityCalls.push([guildId, userId]);
			return 'custom';
		};
		const event = createMessageCreate({ monitoring });
		const { message, sent } = createMessage({ users });

		event.execute(message);

		assert.deepEqual(messageCalls, [['guild', 'protected']]);
		assert.deepEqual(visibilityCalls, [['guild', 'protected']]);
		assert.deepEqual(sent, [{
			content: 'Please use threads instead of pinging me.',
			allowedMentions: {
				parse: [],
				repliedUser: false,
			},
		}]);
	},
);

test(
	'messageCreate sends a generic reminder when one protected user has generic visibility',
	(testContext) => {
		const protectedUser = { id: 'protected' };
		const users = new Collection([[protectedUser.id, protectedUser]]);
		/** @type {[string, string][]} */
		const messageCalls = [];
		/** @type {[string, string][]} */
		const visibilityCalls = [];
		const monitoring = createMonitoringMock(true);
		monitoring.getMessage = (guildId, userId) => {
			messageCalls.push([guildId, userId]);
			return 'This custom message must not be sent.';
		};
		monitoring.getVisibility = (guildId, userId) => {
			visibilityCalls.push([guildId, userId]);
			return 'generic';
		};
		testContext.mock.method(Math, 'random', () => 0);
		const event = createMessageCreate({ monitoring });
		const { message, sent } = createMessage({ users });

		event.execute(message);

		assert.deepEqual(messageCalls, [['guild', 'protected']]);
		assert.deepEqual(visibilityCalls, [['guild', 'protected']]);
		assert.equal(
			sent[0].content,
			'Gentle reminder: some members prefer not to be pinged unless necessary. Thanks for helping keep notifications manageable.',
		);
		assert.equal(sent.length, 1);
	},
);

test(
	'messageCreate sends a generic reminder without checking visibility when one protected user has no custom message',
	(testContext) => {
		const protectedUser = { id: 'protected' };
		const users = new Collection([[protectedUser.id, protectedUser]]);
		/** @type {[string, string][]} */
		const messageCalls = [];
		const monitoring = createMonitoringMock(true);
		monitoring.getMessage = (guildId, userId) => {
			messageCalls.push([guildId, userId]);
			return null;
		};
		monitoring.getVisibility = () => {
			assert.fail('visibility must not be read without a custom message');
		};
		testContext.mock.method(Math, 'random', () => 0.999);
		const event = createMessageCreate({ monitoring });
		const { message, sent } = createMessage({ users });

		event.execute(message);

		assert.deepEqual(messageCalls, [['guild', 'protected']]);
		assert.equal(
			sent[0].content,
			'Please be mindful when mentioning members, as some prefer fewer notifications. Thanks for understanding!',
		);
		assert.equal(sent.length, 1);
	},
);

test(
	'messageCreate sends one generic reminder for multiple protected mentions',
	async (testContext) => {
		const firstUser = { id: 'first' };
		const secondUser = { id: 'second' };
		const users = new Collection([
			[firstUser.id, firstUser],
			[secondUser.id, secondUser],
		]);
		const cases = [
			{
				name: 'first random message',
				random: 0,
				expected: 'Gentle reminder: some members prefer not to be pinged unless necessary. Thanks for helping keep notifications manageable.',
			},
			{
				name: 'second random message',
				random: 0.999,
				expected: 'Please be mindful when mentioning members, as some prefer fewer notifications. Thanks for understanding!',
			},
		];

		for (const testCase of cases) {
			await testContext.test(testCase.name, (subtestContext) => {
				/** @type {[string, string][]} */
				const monitoringCalls = [];
				const monitoring = createMonitoringMock(true);
				monitoring.isEnabled = (guildId, userId) => {
					monitoringCalls.push([guildId, userId]);
					return true;
				};
				monitoring.getMessage = () => {
					assert.fail('custom messages must not be read for multiple users');
				};
				monitoring.getVisibility = () => {
					assert.fail('visibility must not be read for multiple users');
				};
				subtestContext.mock.method(Math, 'random', () => testCase.random);
				const event = createMessageCreate({ monitoring });
				const { message, sent } = createMessage({ users });

				event.execute(message);

				assert.equal(sent.length, 1);
				assert.equal(sent[0].content, testCase.expected);
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
			});
		}
	},
);

test(
	'messageCreate does not respond when mentioned members have not opted in',
	() => {
		const user = { id: 'unprotected' };
		const event = createMessageCreate({ monitoring: createMonitoringMock(false) });
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
		/** @type {string[]} */
		const checkedUsers = [];
		const monitoring = createMonitoringMock(true);
		monitoring.isEnabled = (guildId, userId) => {
			checkedUsers.push(userId);
			return true;
		};
		const event = createMessageCreate({ monitoring });
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
	/** @type {[string, string][]} */
	const checkedUsers = [];
	const monitoring = createMonitoringMock(true);
	monitoring.isEnabled = (guildId, userId) => {
		checkedUsers.push([guildId, userId]);
		return true;
	};
	const event = createMessageCreate({ monitoring });

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

test(
	'messageCreate prevents mentions in custom text',
	() => {
		const protectedUser = { id: 'protected' };
		const users = new Collection([[protectedUser.id, protectedUser]]);
		const customMessage = '@everyone Please ask <@123456789> or <@&987654321>.';
		const monitoring = createMonitoringMock(true);
		monitoring.getMessage = () => customMessage;
		monitoring.getVisibility = () => 'custom';
		const event = createMessageCreate({ monitoring });
		const { message, sent } = createMessage({ users });

		event.execute(message);

		assert.equal(sent.length, 1);
		assert.deepEqual(sent[0], {
			content: customMessage,
			allowedMentions: {
				parse: [],
				repliedUser: false,
			},
		});
	},
);
