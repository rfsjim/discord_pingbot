const { Events } = require('discord.js');

module.exports = {
	name: Events.ClientReady,
	once: true,
	/**
	 *
	 * @param {import('discord.js').Client<true>} client
	 */
	execute(client) {
		console.log(`🤖 Bot is now ready! Logged in as ${client.user.tag}`);
	},
};
