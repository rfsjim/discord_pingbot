/**
 *
 * @param {import('node:sqlite').Database} database
 * @param {string} guildId
 * @param {string} userId
 * @returns
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

	return member?.enabled ?? 0;
};
