const { Events } = require('discord.js');
const enforceGuildAllowlist = require('../services/guildAllowlist');

/**
 *
 * @param {import('../types/bot-context').BotContext} context
 */
module.exports = function createEvent({
	allowedGuilds,
	incidentReporting,
}) {
	return {
		name: Events.GuildCreate,
		once: false,
		/**
		 * Run Script when the bot joins a guild
		 * @param {import('discord.js').Client<true>} client
		 * @param {import('discord.js').Guild} guild
		 */
		async execute(client, guild) {
			if (!await enforceGuildAllowlist(
				guild,
				allowedGuilds,
				incidentReporting,
				'GuildCreate',
			)) {
				return;
			}

			console.log(
				`Guild joined: ${guild.name} ${guild.id} Logged in as ${client.user.tag}`,
			);
		},
	};
};
