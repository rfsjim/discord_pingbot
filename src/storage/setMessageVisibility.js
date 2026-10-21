/**
 * Set Custom Message Visibility
 * @param {import('node:sqlite').Database} database
 * @param {string} guildId
 * @param {string} userId
 * @param {'generic' | 'custom'} visibility
 * @param {() => string} [clock]
 */
module.exports = function setMessageVisibility(
	database,
	guildId,
	userId,
	visibility,
	clock = () => Temporal.Now.instant().toString(),
) {
	const now = clock();

	database.prepare(`
		INSERT INTO member_preferences
			(guild_id, user_id, message_visibility, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?)
		ON CONFLICT (guild_id, user_id) DO UPDATE SET
			message_visibility = excluded.message_visibility,
			updated_at = excluded.updated_at
	`).run(guildId, userId, visibility, now, now);
};
