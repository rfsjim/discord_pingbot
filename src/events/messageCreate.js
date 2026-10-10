const { Events } = require('discord.js');

module.exports = {
	name: Events.MessageCreate,
	/**
	 *
	 * @param {import('discord.js').Message} message
	 * @returns
	 */
	execute(message) {
		if (message.author.bot || message.webhookId || !message.guild) return;
		if (message.mentions.users.size === 0) return;

		console.log(`Received message from ${message.author.username}`);

		for (const user of message.mentions.users.values()) {
			console.log(`Mentioned user ID: ${user.id} ${user.username}`);
		}
	},
};
