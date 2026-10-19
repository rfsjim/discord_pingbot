const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const createReloadCommand = require('../src/commands/utility/reload');
const {
	isApplicationDeveloper,
	validateCommand,
} = createReloadCommand;

function createInteraction({ commandPath, owner, userId }) {
	const replies = [];
	const existingCommand = { version: 'existing' };
	const commands = new Map([['target', existingCommand]]);

	return {
		existingCommand,
		interaction: {
			client: {
				application: {
					owner,
					async fetch() {
						throw new Error('Application fetch was not expected');
					},
				},
				commandPaths: new Map([['target', commandPath]]),
				commands,
			},
			options: {
				getString() {
					return 'target';
				},
			},
			async reply(response) {
				replies.push(response);
			},
			user: { id: userId },
		},
		replies,
	};
}

test(
	'identifies application owners, team members, and configured developers',
	() => {
		assert.equal(isApplicationDeveloper({ id: 'owner' }, 'owner', []), true);
		assert.equal(
			isApplicationDeveloper(
				{ ownerId: 'owner', members: new Map([['member', {}]]) },
				'member',
				[],
			),
			true,
		);
		assert.equal(
			isApplicationDeveloper({ id: 'owner' }, 'developer', ['developer']),
			true,
		);
		assert.equal(isApplicationDeveloper({ id: 'owner' }, 'other', []), false);
	},
);

test(
	'reloads a command factory with the original context',
	async () => {
		const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'ping-bot-reload-'));
		const commandPath = path.join(directory, 'target.js');
		fs.writeFileSync(
			commandPath,
			`module.exports = function createCommand(context) {
				return {
					data: { name: 'target', toJSON() { return { name: 'target' }; } },
					execute() {},
					contextValue: context.value,
				};
			};\n`,
		);

		try {
			const context = { developerIds: ['developer'], value: 'preserved' };
			const reload = createReloadCommand(context);
			const { interaction, replies } = createInteraction({
				commandPath,
				owner: { id: 'owner' },
				userId: 'developer',
			});

			await reload.execute(interaction);

			assert.equal(
				interaction.client.commands.get('target').contextValue,
				'preserved',
			);
			assert.match(replies[0].content, /was reloaded/);
		}
		finally {
			fs.rmSync(directory, { recursive: true, force: true });
		}
	},
);

test(
	'denies an unauthorized user before loading a command file',
	async () => {
		const reload = createReloadCommand({ developerIds: [] });
		const { existingCommand, interaction, replies } = createInteraction({
			commandPath: 'missing-command-file.js',
			owner: { id: 'owner' },
			userId: 'other',
		});

		await reload.execute(interaction);

		assert.equal(interaction.client.commands.get('target'), existingCommand);
		assert.match(replies[0].content, /restricted/);
	},
);

test(
	'rejects an invalid replacement command',
	() => {
		assert.throws(
			() => validateCommand({}, 'target'),
			/The factory for target returned an invalid command/,
		);
	},
);

test(
	'reports an application owner lookup failure as a reload error',
	async () => {
		const reload = createReloadCommand({ developerIds: [] });
		const { existingCommand, interaction, replies } = createInteraction({
			commandPath: 'unused-command-file.js',
			owner: null,
			userId: 'owner',
		});
		const originalConsoleError = console.error;
		console.error = () => undefined;

		try {
			await reload.execute(interaction);
		}
		finally {
			console.error = originalConsoleError;
		}

		assert.equal(interaction.client.commands.get('target'), existingCommand);
		assert.match(replies[0].content, /preparing the command reload/);
	},
);

test(
	'reports a missing source path as a reload error',
	async () => {
		const reload = createReloadCommand({ developerIds: [] });
		const { existingCommand, interaction, replies } = createInteraction({
			commandPath: undefined,
			owner: { id: 'owner' },
			userId: 'owner',
		});
		const originalConsoleError = console.error;
		console.error = () => undefined;

		try {
			await reload.execute(interaction);
		}
		finally {
			console.error = originalConsoleError;
		}

		assert.equal(interaction.client.commands.get('target'), existingCommand);
		assert.match(replies[0].content, /existing command remains active/);
	},
);
