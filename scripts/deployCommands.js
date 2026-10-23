const fs = require('node:fs');
const path = require('node:path');

/**
 * Locate Command Files
 * @param {string} directory
 * @returns {string[]}
 */
function findCommandFiles(directory) {
	const commandFiles = [];
	const entries = fs.readdirSync(directory, { withFileTypes: true })
		.sort((left, right) => left.name.localeCompare(right.name));

	for (const entry of entries) {
		const entryPath = path.join(directory, entry.name);

		if (entry.isDirectory()) {
			commandFiles.push(...findCommandFiles(entryPath));
		}
		else if (entry.isFile() && entry.name.endsWith('.js')) {
			commandFiles.push(entryPath);
		}
	}

	return commandFiles;
}

/**
 *
 * @param {string} commandsPath
 * @param {*} context
 * @returns {string[]}
 */
function loadCommandData(commandsPath, context = {}) {
	const commands = [];
	const commandNames = new Set();

	for (const filePath of findCommandFiles(commandsPath)) {
		const createCommand = require(filePath);

		if (typeof createCommand !== 'function') {
			throw new TypeError(
				`The command at ${filePath} does not export a command factory`,
			);
		}

		const command = createCommand(context);

		if (
			!command?.data ||
			typeof command.data.toJSON !== 'function' ||
			typeof command.execute !== 'function'
		) {
			throw new TypeError(
				`The command at ${filePath} is missing the required "data" or "execute" property`,
			);
		}

		const commandData = command.data.toJSON();

		if (commandNames.has(commandData.name)) {
			throw new Error(`Duplicate command name: ${commandData.name}`);
		}

		commandNames.add(commandData.name);
		commands.push(commandData);
	}

	return commands;
}

/**
 * Returns Environment Value
 * @param {string} name
 * @param {NodeJS.ProcessEnv} environment
 * @returns {string} Environment Value
 */
function requireEnvironment(name, environment) {
	const value = environment[name]?.trim();

	if (!value) {
		throw new Error(`Missing required environment variable: ${name}`);
	}

	return value;
}

async function main(
	argv = process.argv,
	environment = process.env,
	commandsPath = path.join(__dirname, '../src/commands'),
) {
	const scope = argv[2];

	if (scope !== 'guild' && scope !== 'global') {
		throw new Error('Usage: deployCommands.js <guild|global>');
	}

	const commands = loadCommandData(commandsPath);

	if (commands.length === 0) {
		throw new Error(
			'No valid commands were found; refusing to replace the deployed command set',
		);
	}

	const token = requireEnvironment('DISCORD_TOKEN', environment);
	const clientId = requireEnvironment('DISCORD_CLIENT_ID', environment);
	const { REST, Routes } = require('discord.js');
	const rest = new REST().setToken(token);
	const route = scope === 'guild'
		? Routes.applicationGuildCommands(
			clientId,
			requireEnvironment('DISCORD_GUILD_ID', environment),
		)
		: Routes.applicationCommands(clientId);

	console.log(`Started refreshing ${commands.length} application (/) commands.`);

	const data = await rest.put(
		route,
		{ body: commands },
	);

	if (!Array.isArray(data)) {
		throw new TypeError('Expected an array of deployed commands');
	}

	console.log(`Successfully reloaded ${data.length} application (/) commands.`);
}

if (require.main === module) {
	main().catch(
		error => {
			console.error(error);
			process.exitCode = 1;
		},
	);
}

module.exports = {
	findCommandFiles,
	loadCommandData,
	main,
};
