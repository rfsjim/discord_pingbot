const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
	findCommandFiles,
	loadCommandData,
	main,
} = require('../scripts/deployCommands');

/**
 * Creates a mock command module
 * @param {string} filePath
 * @param {string} name
 */
function createCommandModule(filePath, name) {
	fs.writeFileSync(
		filePath,
		`module.exports = function createCommand(context) {
			return {
				data: {
					toJSON() {
						return { name: '${name}', contextValue: context.value };
					},
				},
				execute() {},
			};
		};\n`,
	);
}

test(
	'deployCommands finds and constructs factory commands recursively',
	() => {
		const commandsPath = fs.mkdtempSync(
			path.join(os.tmpdir(), 'ping-bot-commands-'),
		);
		const nestedPath = path.join(commandsPath, 'general', 'nested');
		fs.mkdirSync(nestedPath, { recursive: true });

		try {
			createCommandModule(
				path.join(commandsPath, 'root.js'),
				'root',
			);
			createCommandModule(
				path.join(nestedPath, 'nested.js'),
				'nested',
			);
			fs.writeFileSync(path.join(nestedPath, 'ignored.txt'), 'ignored');

			const files = findCommandFiles(commandsPath);
			const commands = loadCommandData(commandsPath, { value: 'injected' });

			assert.equal(files.length, 2);
			assert.deepEqual(
				commands,
				[
					{ name: 'nested', contextValue: 'injected' },
					{ name: 'root', contextValue: 'injected' },
				],
			);
		}
		finally {
			fs.rmSync(commandsPath, { recursive: true, force: true });
		}
	},
);

test(
	'deployCommands rejects duplicate command names',
	() => {
		const commandsPath = fs.mkdtempSync(
			path.join(os.tmpdir(), 'ping-bot-commands-'),
		);

		try {
			createCommandModule(path.join(commandsPath, 'one.js'), 'duplicate');
			createCommandModule(path.join(commandsPath, 'two.js'), 'duplicate');

			assert.throws(
				() => loadCommandData(commandsPath),
				/Duplicate command name: duplicate/,
			);
		}
		finally {
			fs.rmSync(commandsPath, { recursive: true, force: true });
		}
	},
);

test(
	'deployCommands rejects a module that does not export a command factory',
	() => {
		const commandsPath = fs.mkdtempSync(
			path.join(os.tmpdir(), 'ping-bot-commands-'),
		);
		const invalidPath = path.join(commandsPath, 'invalid.js');
		fs.writeFileSync(invalidPath, 'module.exports = {};\n');

		try {
			assert.throws(
				() => loadCommandData(commandsPath),
				{
					name: 'TypeError',
					message: `The command at ${invalidPath} does not export a command factory`,
				},
			);
		}
		finally {
			fs.rmSync(commandsPath, { recursive: true, force: true });
		}
	},
);

test(
	'deployCommands rejects a malformed command returned by a factory',
	() => {
		const commandsPath = fs.mkdtempSync(
			path.join(os.tmpdir(), 'ping-bot-commands-'),
		);
		const invalidPath = path.join(commandsPath, 'invalid.js');
		fs.writeFileSync(
			invalidPath,
			'module.exports = function createCommand() { return {}; };\n',
		);

		try {
			assert.throws(
				() => loadCommandData(commandsPath),
				{
					name: 'TypeError',
					message: `The command at ${invalidPath} is missing the required "data" or "execute" property`,
				},
			);
		}
		finally {
			fs.rmSync(commandsPath, { recursive: true, force: true });
		}
	},
);

test(
	'deployCommands propagates errors thrown while constructing a command',
	() => {
		const commandsPath = fs.mkdtempSync(
			path.join(os.tmpdir(), 'ping-bot-commands-'),
		);
		fs.writeFileSync(
			path.join(commandsPath, 'throws.js'),
			'module.exports = function createCommand() { throw new Error("construction failed"); };\n',
		);

		try {
			assert.throws(
				() => loadCommandData(commandsPath),
				/construction failed/,
			);
		}
		finally {
			fs.rmSync(commandsPath, { recursive: true, force: true });
		}
	},
);

test(
	'deployCommands loads an empty command directory but refuses to deploy it',
	async () => {
		const commandsPath = fs.mkdtempSync(
			path.join(os.tmpdir(), 'ping-bot-commands-'),
		);

		try {
			assert.deepEqual(loadCommandData(commandsPath), []);

			await assert.rejects(
				main(
					['node', 'deployCommands.js', 'global'],
					{},
					commandsPath,
				),
				/No valid commands were found; refusing to replace the deployed command set/,
			);
		}
		finally {
			fs.rmSync(commandsPath, { recursive: true, force: true });
		}
	},
);
