const { Events } = require('discord.js');
const enforceGuildAllowlist = require('../services/guildAllowlist');

/**
 *
 * @param {import('../types/bot-context').BotContext} context
 * @returns {object}
 */
module.exports = function createEvent({ allowedGuilds }) {
	return {
		name: Events.ClientReady,
		once: true,
		/**
		 *
		 * @param {import('discord.js').Client<true>} client
		 */
		async execute(client) {
			for (const guild of client.guilds.cache.values()) {
				await enforceGuildAllowlist(guild, allowedGuilds);
			}

			console.log(`🤖 Bot is now ready! Logged in as ${client.user.tag}`);
		},
	};
};
