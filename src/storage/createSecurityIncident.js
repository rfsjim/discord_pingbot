/**
 * Create a new security incident in the database.
 * @param {import('node:sqlite').Database} database
 * @param {string | null} guildId
 * @param {string} category
 * @param {'info'|'warning'|'critical'} severity
 * @param {string} description
 * @param {string | null} details
 * @returns {number} The ID of the incident that was created
 */
module.exports = function createSecurityIncident(
	database,
	guildId,
	category,
	severity,
	description,
	details,
) {
	const result = database.prepare(`
		INSERT INTO security_incidents (
			guild_id,
			category,
			severity,
			description,
			incident_status,
			details,
			notification_status,
		)
		VALUES (?, ?, ?, ?, 'open', ?, 'pending')
	`).run(guildId, category, severity, description, details);

	return Number(result.lastInsertRowid);
};
