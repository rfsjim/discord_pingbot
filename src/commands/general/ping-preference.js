const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping-preference')
		.setDescription('Setup Ping Preferences')
		.addStringOption(
			(option) => option
				.setName('command')
				.setDescription('The required preference being set')
				.setRequired(true)
				.addChoices(
					{ name:'enable', value:'enable_reminders' },
					{ name:'disable', value:'disable_reminders' },
					{ name:'status', value:'show_status' },
				),
		),
	/**
	 *
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 */
	async execute(interaction) {
		await interaction
			.reply({
				content: `Received instruction ${interaction.options.getString('command')}`,
				flags: MessageFlags.Ephemeral,
			});
	},
};
