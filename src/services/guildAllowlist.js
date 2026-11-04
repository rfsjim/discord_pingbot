/**
 * Enforce guild membership allowlist.
 *
 * @param {import('discord.js').Guild} guild
 * @param {readonly string[]} allowedGuilds
 * @param {ReturnType<typeof import('./incidentReporting')>} incidentReporting
 * @param {string} incidentSource
 * @returns {Promise<boolean>} True if the guild is authorised.
 */
async function enforceGuildAllowlist(
	guild,
	allowedGuilds,
	incidentReporting,
	incidentSource,
) {
	if (allowedGuilds.includes(guild.id)) {
		return true;
	}

	console.error(`UNAUTHORISED GUILD: ${guild.id}`);
	incidentReporting.logNewSecurityIncident(
		guild.id,
		'unauthorisedGuild',
		incidentSource,
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

	return false;
}

module.exports = enforceGuildAllowlist;
