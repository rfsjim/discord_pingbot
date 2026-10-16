module.exports = function setPingMonitoring(
	database,
	guildId,
	userId,
	status,
	clock = () => Temporal.Now.instant().toString(),
) {
	const now = clock();

	database.exec('BEGIN');

	try {
		database.prepare(`
			INSERT INTO guild_settings
				(guild_id, created_at, updated_at)
			VALUES (?, ?, ?)
			ON CONFLICT (guild_id) DO NOTHING
		`).run(guildId, now, now);

		database.prepare(`
			INSERT INTO member_preferences
				(guild_id, user_id, enabled, created_at, updated_at)
			VALUES (?, ?, ?, ?, ?)
			ON CONFLICT (guild_id, user_id) DO UPDATE SET
				enabled = excluded.enabled,
				updated_at = excluded.updated_at
		`).run(guildId, userId, status, now, now);

		database.exec('COMMIT');
	}
	catch (error) {
		database.exec('ROLLBACK');
		throw error;
	}
};
