/**
 * Gets Custom Cooldown or Returns null if not stored
 * @param {import('node:sqlite').Database} database
 * @param {string} guildId
 * @param {string} userId
 * @returns {number | null}
 */
module.exports = function getCustomCooldown(
	database,
	guildId,
	userId,
) {

	const cooldown = database.prepare(`
		SELECT cooldown_seconds
		FROM member_preferences
		WHERE
			user_id = ? AND
			guild_id = ?
	`).get(userId, guildId);

	const value = cooldown?.cooldown_seconds;
	return typeof value === 'number' ? value : null;
};
