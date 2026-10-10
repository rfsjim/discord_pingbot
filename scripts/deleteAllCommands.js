const { REST, Routes } = require('discord.js');
const { clientId, guildId, token } = require('../config.json');

const rest = new REST().setToken(token);

async function main() {
	const scope = process.argv[2];

	if (scope !== 'guild' && scope !== 'global') {
		console.error('Usage: node deleteAllCommands.js <guild|global>');
		process.exitCode = 1;
		return;
	}

	const route = scope === 'guild'
		? Routes.applicationGuildCommands(
			clientId,
			guildId,
		)
		: Routes.applicationCommands(
			clientId,
		);

	try {
		await rest.put(route, { body: [] });
		console.log(`Successfully deleted all ${scope} commands`);
	}
	catch (error) {
		console.error(`Failed to delete all ${scope} commands: `, error);
		process.exitCode = 1;
	}
}

main().catch(
	error => {
		console.error(error);
		process.exitCode = 1;
	},
);
