const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = function createCommand(preferences) {
	return {
		data: new SlashCommandBuilder()
			.setName('ping-preference')
			.setDescription('Manage your ping notification preferences')
			.addStringOption(
				(option) => option
					.setName('command')
					.setDescription('The required preference being set')
					.setRequired(true)
					.addChoices(
						{ name:'enable', value:'enable' },
						{ name:'disable', value:'disable' },
						{ name:'status', value:'status' },
					),
			),
		/**
		 *
		 * @param {import('discord.js').ChatInputCommandInteraction} interaction
		 */
		async execute(interaction) {
			try {
				const response = await preferences(
					interaction.options.getString('command', true),
					interaction.guildId,
					interaction.user.id,
				);

				await interaction.reply({
					content: response,
					flags: MessageFlags.Ephemeral,
				});
			}
			catch (error) {
				console.error('Preference Command Failed: ', error);

				if (!interaction.replied && !interaction.deferred) {
					await interaction.reply({
						content: 'Unable to update your preferences',
						flags: MessageFlags.Ephemeral,
					});
				}
			}
		},
	};
};
