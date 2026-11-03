/**
 * Update the status of a security incident in the database.
 * @param {import('node:sqlite').Database} database
 * @param {number} incidentId
 * @param {'open'|'resolved'|'failed'} incidentStatus
 * @param {string | null} details
 * @returns {boolean}
 */
module.exports = function updateSecurityIncident(
	database,
	incidentId,
	incidentStatus,
	details,
) {
	const result = database.prepare(`
		UPDATE security_incidents
		 SET
			incident_status = ?,
			details = ?,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = ?
	`).run(incidentStatus, details, incidentId);

	return result.changes === 1;
};
