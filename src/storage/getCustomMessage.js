/**
 * Gets Custom Message or Returns null if not stored
 * @param {import('node:sqlite').Database} database
 * @param {string} guildId
 * @param {string} userId
 * @returns {string | null}
 */
module.exports = function getCustomMessage(
	database,
	guildId,
	userId,
) {

	const message = database.prepare(`
		SELECT custom_message
		FROM member_preferences
		WHERE
			user_id = ? AND
			guild_id = ?
	`).get(userId, guildId);

	const value = message?.custom_message;
	return typeof value === 'string' ? value : null;
};
