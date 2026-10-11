const { Events } = require('discord.js');

const gentleResponse =
	'Gentle reminder: one or more members mentioned here prefer not to be pinged unless necessary. Thanks for helping keep notifications manageable.';

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
		if (
			message.mentions.everyone ||
			message.mentions.repliedUser ||
			message.mentions.roles.size > 0
		) return;

		message.channel.send(gentleResponse)
			.catch(console.error);
	},
};
