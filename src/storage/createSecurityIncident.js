/**
 * @typedef {Object} OptionalStatus
 * @property {'open'|'resolved'|'failed'} [incidentStatus]
 * @property {'pending'|'sent'|'failed'} [notificationStatus]
 */

/**
 * Create a new security incident in the database.
 * @param {import('node:sqlite').Database} database
 * @param {string | null} guildId
 * @param {string} category
 * @param {'info'|'warning'|'critical'} severity
 * @param {string} description
 * @param {string | null} details
 * @param {OptionalStatus} [options] Optional initial statuses.
 * @returns {number} The ID of the incident that was created
 */
module.exports = function createSecurityIncident(
	database,
	guildId,
	category,
	severity,
	description,
	details,
	options = {},
) {
	const {
		incidentStatus = 'open',
		notificationStatus = 'pending',
	} = options;

	const result = database.prepare(`
		INSERT INTO security_incidents (
			guild_id,
			category,
			severity,
			description,
			incident_status,
			details,
			notification_status
		)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`).run(guildId, category, severity, description, incidentStatus, details, notificationStatus);

	return Number(result.lastInsertRowid);
};
