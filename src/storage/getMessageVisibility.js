/**
 * Gets Custom Message Visibility or Returns null if not stored
 * @param {import('node:sqlite').Database} database
 * @param {string} guildId
 * @param {string} userId
 * @returns {'generic' | 'custom' | null }
 */
module.exports = function getMessageVisibility(
	database,
	guildId,
	userId,
) {

	const message = database.prepare(`
		SELECT message_visibility
		FROM member_preferences
		WHERE
			user_id = ? AND
			guild_id = ?
	`).get(userId, guildId);

	const value = message?.message_visibility;
	return value === 'generic' || value === 'custom'
		? value
		: null;
};
