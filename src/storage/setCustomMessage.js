/**
 * Set Custom Message
 * @param {import('node:sqlite').DatabaseSync} database
 * @param {string} guildId
 * @param {string} userId
 * @param {string | null} message
 * @param {() => string} [clock]
 */
module.exports = function setCustomMessage(
	database,
	guildId,
	userId,
	message,
	clock = () => Temporal.Now.instant().toString(),
) {
	const now = clock();

	database.prepare(`
		INSERT INTO member_preferences
			(guild_id, user_id, custom_message, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?)
		ON CONFLICT (guild_id, user_id) DO UPDATE SET
			custom_message = excluded.custom_message,
			updated_at = excluded.updated_at
	`).run(guildId, userId, message, now, now);
};
