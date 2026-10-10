const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping-help')
		.setDescription('Provides usage help for bot. Explain what the bot does, its limitations, and available commands.'),
	/**
	 *
	 * @param {import('discord.js').ChatInputCommandInteraction} interaction
	 */
	async execute(interaction) {
		await interaction.reply('Ping Bot helper. I monitor for mentions of every server member and responds with a custom message.');
	},
};
