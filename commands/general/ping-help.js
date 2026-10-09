const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping-help')
        .setDescription('Provides usage help for bot. Explain what the bot does, its limitations, and available commands.'),
        async execute(interaction) {
            await interaction.reply('Ping Bot helper. I monitors for mentions of every server member and responds with a custom message.')
        },
};