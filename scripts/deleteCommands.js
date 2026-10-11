const { REST, Routes } = require('discord.js');

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

async function main() {
	const [scope, ...commandIds] = process.argv.slice(2);

	if (!['guild', 'global'].includes(scope) || !commandIds.length) {
		console.error('Usage: node deleteCommands.js <guild|global> <commandId...>');
		process.exitCode = 1;
		return;
	}

	for (const commandId of commandIds) {
		const route = scope === 'guild'
			? Routes.applicationGuildCommand(
				process.env.DISCORD_CLIENT_ID,
				process.env.DISCORD_GUILD_ID,
				commandId,
			)
			: Routes.applicationCommand(
				process.env.DISCORD_CLIENT_ID,
				commandId,
			);

		try {
			await rest.delete(route);
			console.log(`Successfully deleted ${scope} command ${commandId}`);
		}
		catch (error) {
			console.error(`Failed to delete ${commandId}: `, error);
			process.exitCode = 1;
		}
	}
}

main().catch(
	error => {
		console.error(error);
		process.exitCode = 1;
	},
);
