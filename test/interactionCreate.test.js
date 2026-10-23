const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
	Collection,
	Events,
	MessageFlags,
	SlashCommandBuilder,
} = require('discord.js');

const createInteractionCreate = require('../src/events/interactionCreate');

/**
 * @typedef {import('discord.js').ChatInputCommandInteraction} ChatInputCommandInteraction
 * @typedef {import('discord.js').InteractionReplyOptions} InteractionReplyOptions
 * @typedef {InteractionReplyOptions & { content: string }} CapturedResponse
 * @typedef {{
 *   deferred?: boolean,
 *   isChatInputCommand?: () => boolean,
 *   replied?: boolean
 * }} InteractionOverrides
 */

/**
 * Creates the partial interaction double used by these event tests.
 *
 * @param {InteractionOverrides} overrides
 * @returns {{
 *   followUps: CapturedResponse[],
 *   interaction: ChatInputCommandInteraction,
 *   replies: CapturedResponse[]
 * }}
 */
function createInteraction(overrides = {}) {
	/** @type {CapturedResponse[]} */
	const replies = [];
	/** @type {CapturedResponse[]} */
	const followUps = [];
	const interactionDouble = {
		client: {
			commands: new Collection(),
			cooldowns: new Collection(),
		},
		commandName: 'example',
		deferred: false,
		isChatInputCommand: () => true,
		replied: false,
		/** @param {CapturedResponse} response */
		async followUp(response) {
			followUps.push(response);
		},
		/** @param {CapturedResponse} response */
		async reply(response) {
			replies.push(response);
		},
		user: { id: 'user' },
		...overrides,
	};
	const interaction =
		/** @type {ChatInputCommandInteraction} */
		(
			/** @type {unknown} */
			(interactionDouble)
		);

	return { followUps, interaction, replies };
}

/**
 * Creates a command suitable for registration on the mocked client.
 *
 * @param {(interaction: ChatInputCommandInteraction) => Promise<void>} execute
 * @param {number} cooldown
 */
function createCommand(execute, cooldown = 0) {
	return {
		cooldown,
		data: new SlashCommandBuilder()
			.setName('example')
			.setDescription('An example command'),
		execute,
	};
}

test(
	'interactionCreate exposes the Discord interaction-create event',
	() => {
		assert.equal(createInteractionCreate().name, Events.InteractionCreate);
	},
);

test(
	'interactionCreate ignores interactions that are not chat-input commands',
	async () => {
		const event = createInteractionCreate();
		const { interaction, replies } = createInteraction({
			isChatInputCommand: () => false,
		});

		await event.execute(interaction);

		assert.deepEqual(replies, []);
	},
);

test(
	'interactionCreate dispatches a command and creates its cooldown collection',
	async () => {
		/** @type {ChatInputCommandInteraction | undefined} */
		let receivedInteraction;
		const command = createCommand(async (interaction) => {
			receivedInteraction = interaction;
		});
		const event = createInteractionCreate();
		const { interaction } = createInteraction();
		interaction.client.commands.set(command.data.name, command);

		await event.execute(interaction);

		assert.equal(receivedInteraction, interaction);
		assert.equal(interaction.client.cooldowns.has(command.data.name), true);
	},
);

test(
	'interactionCreate rejects a command invocation during its cooldown',
	async () => {
		let executions = 0;
		const command = createCommand(
			async () => {
				executions += 1;
			},
			60,
		);
		const event = createInteractionCreate();
		const { interaction, replies } = createInteraction();
		interaction.client.commands.set(command.data.name, command);
		interaction.client.cooldowns.set(
			command.data.name,
			new Collection([[interaction.user.id, Date.now()]]),
		);

		await event.execute(interaction);

		assert.equal(executions, 0);
		assert.equal(replies.length, 1);
		assert.match(replies[0].content, /You can use it again/);
		assert.equal(replies[0].flags, MessageFlags.Ephemeral);
	},
);

test(
	'interactionCreate reports command errors with an initial reply',
	async (testContext) => {
		testContext.mock.method(console, 'error', () => undefined);
		const command = createCommand(async () => {
			throw new Error('command failed');
		});
		const event = createInteractionCreate();
		const { interaction, replies } = createInteraction();
		interaction.client.commands.set(command.data.name, command);

		await event.execute(interaction);

		assert.equal(replies.length, 1);
		assert.match(replies[0].content, /error while executing this command/);
		assert.equal(replies[0].flags, MessageFlags.Ephemeral);
	},
);

test(
	'interactionCreate follows up when a replied command later fails',
	async (testContext) => {
		testContext.mock.method(console, 'error', () => undefined);
		const command = createCommand(async (interaction) => {
			interaction.replied = true;
			throw new Error('command failed after reply');
		});
		const event = createInteractionCreate();
		const { followUps, interaction, replies } = createInteraction();
		interaction.client.commands.set(command.data.name, command);

		await event.execute(interaction);

		assert.deepEqual(replies, []);
		assert.equal(followUps.length, 1);
		assert.equal(followUps[0].flags, MessageFlags.Ephemeral);
	},
);

test(
	'interactionCreate follows up when a deferred command fails',
	async (testContext) => {
		testContext.mock.method(console, 'error', () => undefined);
		const command = createCommand(async () => {
			throw new Error('deferred command failed');
		});
		const event = createInteractionCreate();
		const { followUps, interaction, replies } = createInteraction({
			deferred: true,
		});
		interaction.client.commands.set(command.data.name, command);

		await event.execute(interaction);

		assert.equal(interaction.replied, false);
		assert.deepEqual(replies, []);
		assert.equal(followUps.length, 1);
		assert.match(followUps[0].content, /error while executing this command/);
		assert.equal(followUps[0].flags, MessageFlags.Ephemeral);
	},
);

test(
	'interactionCreate logs and ignores an unknown command',
	async (testContext) => {
		const error = testContext.mock.method(console, 'error', () => undefined);
		const event = createInteractionCreate();
		const { interaction, replies } = createInteraction();

		await event.execute(interaction);

		assert.equal(error.mock.callCount(), 1);
		assert.deepEqual(replies, []);
	},
);
