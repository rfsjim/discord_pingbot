/**
 * Gets the current ping monitoring status
 * @param {import('node:sqlite').Database} database
 * @param {string} guildId
 * @param {string} userId
 * @returns {boolean}
 */
module.exports = function getPingMonitoring(
	database,
	guildId,
	userId,
) {

	const member = database.prepare(`
		SELECT enabled
		FROM member_preferences
		WHERE
			user_id = ? AND
			guild_id = ?
	`).get(userId, guildId);

	const value = member?.enabled ?? 0;
	return value === 1;
};
