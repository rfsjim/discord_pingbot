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

	let incidentReportNumber = null;

	console.error(`UNAUTHORISED GUILD: ${guild.id}`);
	try {
		incidentReportNumber = incidentReporting.logNewSecurityIncident(
			guild.id,
			'unauthorisedGuild',
			incidentSource,
		);
	}
	catch (error) {
		console.error(
			`FAILED to create new incident from ${incidentSource}`,
			error,
		);
	}

	let departureSucceeded = false;

	try {
		await guild.leave();
		departureSucceeded = true;

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

	if (incidentReportNumber !== null) {
		try {
			const updated = incidentReporting.updateExistingSecurityIncident(
				incidentReportNumber,
				departureSucceeded ? 'resolved' : 'failed',
				departureSucceeded
					? 'Left unauthorised guild'
					: 'FAILED to leave unauthorised guild',
			);

			if (!updated) {
				console.warn(`Unable to update incident ${incidentReportNumber}`);
			}
		}
		catch (error) {
			console.error(
				`FAILED to update incident ${incidentReportNumber}`,
				error,
			);
		}
	}
	else {
		console.warn('Unable to update incident: no report was created');
	}
	return false;
}

module.exports = enforceGuildAllowlist;
