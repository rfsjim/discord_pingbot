/*
 * TODO: Use created database entries to test if monitoring is required.
 * Dependency injection through the event chain and storage methods.
 */
const { Events } = require('discord.js');

const gentleResponse = [
	'Gentle reminder: some members prefer not to be pinged unless necessary. Thanks for helping keep notifications manageable.',
	'Please be mindful when mentioning members, as some prefer fewer notifications. Thanks for understanding!',
];

module.exports = function createMessageCreate({ monitoring }) {
	return {
		name: Events.MessageCreate,
		/**
		 *
		 * @param {import('discord.js').Message} message
		 * @returns
		 */
		execute(message) {
			if (message.author.bot || message.webhookId || !message.guild) return;
			if (message.mentions.users.size === 0) return;
			if (message.mentions.everyone || message.mentions.roles.size > 0) return;

			const mentionedUsers = message.mentions.users.clone();
			const repliedUser = message.mentions.repliedUser;

			if (repliedUser) {
				mentionedUsers.set(repliedUser.id, repliedUser);
			}

			const protectedUsers = mentionedUsers.filter(
				(user) => monitoring(message.guildId, user.id),
			);

			if (protectedUsers.size === 0) return;

			const response = gentleResponse[
				Math.floor(Math.random() * gentleResponse.length)
			];

			message.channel.send(response)
				.catch(console.error);
		},
	};
};
