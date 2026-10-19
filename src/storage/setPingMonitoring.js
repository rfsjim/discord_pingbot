module.exports = function setPingMonitoring(
	database,
	guildId,
	userId,
	status,
	clock = () => Temporal.Now.instant().toString(),
) {
	const now = clock();

	database.prepare(`
		INSERT INTO member_preferences
			(guild_id, user_id, enabled, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?)
		ON CONFLICT (guild_id, user_id) DO UPDATE SET
			enabled = excluded.enabled,
			updated_at = excluded.updated_at
	`).run(guildId, userId, status, now, now);
};
