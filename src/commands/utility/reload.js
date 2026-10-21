const { MessageFlags, SlashCommandBuilder } = require('discord.js');

function isApplicationDeveloper(owner, userId, developerIds) {
	if (developerIds.includes(userId)) return true;
	if (!owner) return false;

	if (owner.members) {
		return owner.ownerId === userId || owner.members.has(userId);
	}

	return owner.id === userId;
}

function validateCommand(command, commandName) {
	if (
		!command?.data ||
		typeof command.data.toJSON !== 'function' ||
		typeof command.execute !== 'function'
	) {
		throw new TypeError(
			`The factory for ${commandName} returned an invalid command`,
		);
	}

	if (command.data.name !== commandName) {
		throw new Error(
			`Reloaded command name changed from ${commandName} to ${command.data.name}`,
		);
	}
}

function createCommand(context = {}) {
	const developerIds = context.developerIds ?? [];

	return {
		data: new SlashCommandBuilder()
			.setName('reload')
			.setDescription('Reloads a command')
			.addStringOption(
				(option) => option
					.setName('command')
					.setDescription('The command to reload.')
					.setRequired(true),
			),
		/**
		 *
		 * @param {import('discord.js').ChatInputCommandInteraction} interaction
		 * @returns
		 */
		async execute(interaction) {
			let commandName;

			try {
				let owner = interaction.client.application.owner;

				if (!owner) {
					const application = await interaction.client.application.fetch();
					owner = application.owner;
				}

				if (!isApplicationDeveloper(owner, interaction.user.id, developerIds)) {
					return interaction.reply({
						content: 'This command is restricted to the application owners and developers.',
						flags: MessageFlags.Ephemeral,
					});
				}

				commandName = interaction
					.options
					.getString('command', true)
					.toLowerCase();
				const command = interaction
					.client
					.commands
					.get(commandName);

				if (!command) {
					return interaction.reply({
						content: `There is no command with name \`${commandName}\`!`,
						flags: MessageFlags.Ephemeral,
					});
				}

				const commandPath = interaction.client.commandPaths.get(commandName);

				if (!commandPath) {
					throw new Error(`No source file is registered for ${commandName}`);
				}

				const resolvedPath = require.resolve(commandPath);
				delete require.cache[resolvedPath];

				const createNewCommand = require(resolvedPath);

				if (typeof createNewCommand !== 'function') {
					throw new TypeError(
						`The command at ${commandPath} does not export a command factory`,
					);
				}

				const newCommand = createNewCommand(context);
				validateCommand(newCommand, commandName);
				interaction.client.commands.set(commandName, newCommand);
			}
			catch (error) {
				console.error(error);
				return interaction.reply({
					content: commandName
						? `There was an error while reloading command \`${commandName}\`. The existing command remains active.`
						: 'There was an error while preparing the command reload. No commands were changed.',
					flags: MessageFlags.Ephemeral,
				});
			}

			return interaction.reply({
				content: `Command \`${commandName}\` was reloaded!`,
				flags: MessageFlags.Ephemeral,
			});
		},
	};
};

module.exports = Object.assign(
	createCommand, {
		isApplicationDeveloper,
		validateCommand,
	});
