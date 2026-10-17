const fs = require('node:fs');
const path = require('node:path');

module.exports = function registerCommands(client, context) {
	const foldersPath = path.join(__dirname, '..', 'commands');
	const commandFolders = fs.readdirSync(foldersPath);

	for (const folder of commandFolders) {
		const commandsPath = path.join(foldersPath, folder);
		const commandFiles = fs
			.readdirSync(commandsPath)
			.filter(
				(file) => file.endsWith('.js'),
			);
		for (const file of commandFiles) {
			const filePath = path.join(commandsPath, file);
			const createCommand = require(filePath);
			const command = createCommand(context);

			client.commands.set(
				command.data.name,
				command,
			);
		}
	}
};
