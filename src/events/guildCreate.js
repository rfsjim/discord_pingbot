const { Events } = require('discord.js');

/**
 *
 * @param {import('../types/bot-context').BotContext} context
 * @returns {object}
 */
module.exports = function createEvent({ allowedGuilds }) {
	return {
		name: Events.GuildCreate,
		once: false,
		/**
		 * Run Script when the bot joins a guild
		 * @param {import('discord.js').Client<true>} client
		 * @param {import('discord.js').Guild} guild
		 */
		async execute(client, guild) {
			if (!allowedGuilds.includes(guild.id)) {
				console.error(
					`UNAUTHORISED GUILD: ${guild.id}`,
				);

				try {
					await guild.leave();
					console.log(
						`Left unauthorised guild: ${guild.name} ${guild.id}`,
					);
				}
				catch (error) {
					console.error(
						`FAILED to leave unauthorised guild: ${guild.id}`,
						error,
					);
				}

				return;
			}
			console.log(
				`Guild joined: ${guild.name} ${guild.id} Logged in as ${client.user.tag}`,
			);
		},
	};
};
