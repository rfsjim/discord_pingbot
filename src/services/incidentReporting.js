const createSecurityIncident = require('../storage/createSecurityIncident');
const updateSecurityIncident = require('../storage/updateSecurityIncident');

/**
 * Factory function to provide a service for reporting on incidents
 * @param {import('node:sqlite').Database} database
 * @param {ReadonlyArray<string>} allowedGuilds
 */
module.exports = function createIncidentReportingService(database, allowedGuilds) {
	return {
		/**
		 * Logs a new security incident
		 * @param {string} guildId Id of guild where incident occurred
		 * @param {string} incidentType What Occurred
		 * @param {string} reportSource Which event identified incident
		 * @returns {number | null} Report Id or null if no incident was recorded
		 */
		logNewSecurityIncident(guildId, incidentType, reportSource) {
			let reportId = null;
			if (incidentType === 'unauthorisedGuild' && !allowedGuilds.includes(guildId)) {
				reportId = createSecurityIncident(
					database,
					guildId,
					'Unauthorised guild usage',
					'critical',
					`${reportSource} detected activity from a guild outside the allowlist`,
					'Bot detected in guild',
				);
			}
			return reportId;
		},
		/**
		 * Updates an existing security incident
		 * @param {number} incidentId
		 * @param {'open'|'resolved'|'failed'} updatedIncidentStatus
		 * @param {string} updatedDetails
		 * @returns {boolean} Did update complete successfully?
		 */
		updateExistingSecurityIncident(incidentId, updatedIncidentStatus, updatedDetails) {
			return updateSecurityIncident(database, incidentId, updatedIncidentStatus, updatedDetails);
		},
	};
};
