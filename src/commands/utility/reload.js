const { MessageFlags, SlashCommandBuilder } = require('discord.js');

/**
 * Checks whether a user may use application developer commands.
 *
 * @param {{ id: string } | { ownerId: string, members: { has(userId: string): boolean } } | null} owner The application owner or owning team.
 * @param {string} userId The ID of the user whose access is being checked.
 * @param {string[]} developerIds IDs of additional users allowed developer access.
 * @returns {boolean} Whether the user is an application owner, team member, or configured developer.
 */
function isApplicationDeveloper(owner, userId, developerIds) {
	if (developerIds.includes(userId)) return true;
	if (!owner) return false;

	if ('members' in owner) {
		return owner.ownerId === userId || owner.members.has(userId);
	}

	return owner.id === userId;
}

/**
 * Verifies that a reloaded module produced a usable command with the expected name.
 *
 * @param {*} command The value returned by the command factory.
 * @param {string} commandName The registered name of the command being reloaded.
 * @returns {void}
 * @throws {TypeError} If the factory did not return a usable command.
 * @throws {Error} If the reloaded command has a different name.
 */
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

/**
 * Creates the reload slash command.
 *
 * @param {{ developerIds?: string[], [key: string]: * }} context Shared dependencies passed to reloaded command factories.
 * @returns {{ data: import('discord.js').SlashCommandOptionsOnlyBuilder, execute(interaction: import('discord.js').ChatInputCommandInteraction): Promise<import('discord.js').InteractionResponse> }} The reload command.
 */
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
		 * Reloads the requested command module if the caller has developer access.
		 *
		 * @param {import('discord.js').ChatInputCommandInteraction} interaction
		 * @returns {Promise<import('discord.js').InteractionResponse>} The sent ephemeral response.
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
