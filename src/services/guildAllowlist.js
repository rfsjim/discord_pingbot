/**
 * Enforce guild membership allowlist.
 *
 * @param {import('discord.js').Guild} guild
 * @param {readonly string[]} allowedGuilds
 * @returns {Promise<boolean>} True if the guild is authorised.
 */
async function enforceGuildAllowlist(guild, allowedGuilds) {
	if (allowedGuilds.includes(guild.id)) {
		return true;
	}

	console.error(`UNAUTHORISED GUILD: ${guild.id}`);

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

	return false;
}

module.exports = enforceGuildAllowlist;
