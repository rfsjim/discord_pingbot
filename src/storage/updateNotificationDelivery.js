/**
 * Update the notification delivery status of a security incident in the database.
 * @param {import('node:sqlite').Database} database
 * @param {number} incidentId
 * @param {'pending'|'sent'|'failed'} notificationStatus
 * @returns {boolean} Did one row in database get updated?
 */
module.exports = function updateNotificationDelivery(
	database,
	incidentId,
	notificationStatus,
) {
	const result = database.prepare(`
		UPDATE security_incidents
		 SET
			notification_status = ?,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = ?
	`).run(notificationStatus, incidentId);

	return result.changes === 1;
};
