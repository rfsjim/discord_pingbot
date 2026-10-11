const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

async function main() {
	const scope = process.argv[2];

	if (scope !== 'guild' && scope !== 'global') {
		console.error('Usage deployCommands.js <guild|global>');
		process.exitCode = 1;
		return;
	}

	const commands = [];
	const foldersPath = path.join(__dirname, '../src/commands');
	const commandFolders = fs.readdirSync(foldersPath);

	for (const folder of commandFolders) {
		const commandsPath = path.join(foldersPath, folder);
		const commandFiles = fs
			.readdirSync(commandsPath)
			.filter((file) => file.endsWith('.js'),
			);
		for (const file of commandFiles) {
			const filePath = path.join(commandsPath, file);
			const command = require(filePath);
			if ('data' in command && 'execute' in command) {
				commands.push(command.data.toJSON());
			}
			else {
				console.log(`[WARNING]: The command at ${filePath} is missing the required "data" or "execute" property`);
			}
		}
	}

	const rest = new REST().setToken(process.env.DISCORD_TOKEN);
	const route = scope === 'guild'
		? Routes.applicationGuildCommands(
			process.env.DISCORD_CLIENT_ID,
			process.env.DISCORD_GUILD_ID,
		)
		: Routes.applicationCommands(
			process.env.DISCORD_CLIENT_ID,
		);

	(
		async () => {
			try {
				console.log(`Started refreshing ${commands.length} application (/) commands.`);

				const data = await rest.put(
					route,
					{ body: commands },
				);
				console.log(`Successfully reloaded ${data.length} application (/) commands.`);
			}
			catch (error) {
				console.error(error);
				process.exitCode = 1;
			}
		}
	)();
}

main().catch(
	error => {
		console.error(error);
		process.exitCode = 1;
	},
);
