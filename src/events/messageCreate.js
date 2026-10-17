/*
 * TODO: Use created database entries to test if monitoring is required.
 * Dependency injection through the event chain and storage methods.
 */

const getPingMonitoring = require('../storage/getPingMonitoring');
const { Events } = require('discord.js');

const gentleResponse = [
	'Gentle reminder: some members prefer not to be pinged unless necessary. Thanks for helping keep notifications manageable.',
	'Please be mindful when mentioning members, as some prefer fewer notifications. Thanks for understanding!',
];

const response = gentleResponse[
	Math.floor(Math.random() * gentleResponse.length)
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
			// TODO: Fix me not currently accurate code placeholder here to keep linter happy
			const protectedUsers = message.mentions.users.filter(
				(user) => monitoring.isEnabled(message.guildId, user.id),
			);
			if (protectedUsers.size === 0) return;
			if (
				getPingMonitoring(
					monitoring.database,
					message.guildId,
					message.mentions.users,
				) !== ENABLED
			) return;
			if (message.author.bot || message.webhookId || !message.guild) return;
			if (message.mentions.users.size === 0) return;
			if (
				message.mentions.everyone ||
				message.mentions.repliedUser ||
				message.mentions.roles.size > 0
			) return;

			message.channel.send(response)
				.catch(console.error);
		},
	};
};
