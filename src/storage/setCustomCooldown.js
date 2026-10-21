/**
 * Sets Custom Member Notification Cooldown
 * @param {import('node:sqlite').DatabaseSync} database
 * @param {string} guildId
 * @param {string} userId
 * @param {number} seconds
  * @param {() => string} [clock]
 */
module.exports = function setCustomCooldown(
	database,
	guildId,
	userId,
	seconds,
	clock = () => Temporal.Now.instant().toString(),
) {
	const now = clock();

	database.prepare(`
		INSERT INTO member_preferences
			(guild_id, user_id, cooldown_seconds, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?)
		ON CONFLICT (guild_id, user_id) DO UPDATE SET
			cooldown_seconds = excluded.cooldown_seconds,
			updated_at = excluded.updated_at
	`).run(guildId, userId, seconds, now, now);
};
