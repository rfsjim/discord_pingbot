const { Events } = require('discord.js');

module.exports = {
	name: Events.MessageCreate,
	execute(message) {
		if (message.author.bot || message.webhookId || !message.guild) return;

		console.log(
			`Received message from ${message.author.username}`);

		for (const user of message.mentions.users.values()) {
			console.log(`Mentioned user ID: ${user.id} ${user.username}`);
		}
	},
};