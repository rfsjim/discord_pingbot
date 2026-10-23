const { Events } = require('discord.js');

const gentleResponse = [
	'Gentle reminder: some members prefer not to be pinged unless necessary. Thanks for helping keep notifications manageable.',
	'Please be mindful when mentioning members, as some prefer fewer notifications. Thanks for understanding!',
];

/**
 * Creates the Discord message-create event handler.
 *
 * @param {{
 *   monitoring: ReturnType<typeof import('../services/monitoring')>
 * }} context
 */
module.exports = function createMessageCreate({ monitoring }) {
	return {
		name: Events.MessageCreate,
		/**
		 * Responds to guild messages received
		 * @param {import('discord.js').Message} message
		 */
		execute(message) {
			if (message.author.bot || message.webhookId || !message.guild) return;
			if (message.mentions.everyone || message.mentions.roles.size > 0) return;
			if (!message.inGuild()) return;
			if (!message.channel.isSendable()) return;

			const protectedUsers = message.mentions.users.filter(
				(user) => monitoring.isEnabled(message.guildId, user.id),
			);

			if (protectedUsers.size === 0) return;

			let response;

			if (protectedUsers.size === 1) {
				const protectedUser = protectedUsers.first();

				if (protectedUser) {
					const userId = protectedUser.id;
					const customMessage = monitoring.getMessage(message.guildId, userId);

					if (customMessage !== null) {
						const visibility = monitoring.getVisibility(message.guildId, userId);

						if (visibility === 'custom') {
							response = customMessage;
						}
					}
				}
			}

			response ??= gentleResponse[
				Math.floor(Math.random() * gentleResponse.length)
			];

			message.channel.send({
				content: response,
				allowedMentions : {
					parse: [],
					repliedUser: false,
				},
			})
				.catch(console.error);
		},
	};
};
