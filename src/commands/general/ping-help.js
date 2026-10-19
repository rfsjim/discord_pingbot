const { SlashCommandBuilder } = require('discord.js');

module.exports = function createCommand() {
	return {
		data: new SlashCommandBuilder()
			.setName('ping-help')
			.setDescription('Provides usage help for bot. Explain what the bot does, its limitations, and available commands.'),
		/**
		 *
		 * @param {import('discord.js').ChatInputCommandInteraction} interaction
		 */
		async execute(interaction) {
			await interaction.reply('Ping Bot helper. I monitor for mentions of enabled members and respond with a message.');
		},
	};
};
