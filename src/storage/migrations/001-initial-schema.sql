CREATE TABLE IF NOT EXISTS member_preferences (
	guild_id TEXT NOT NULL,
	user_id TEXT NOT NULL,
	enabled INTEGER NOT NULL DEFAULT 0
		CHECK (enabled IN (0, 1)),
	custom_message TEXT,
	message_visibility TEXT NOT NULL DEFAULT 'generic'
		CHECK (message_visibility IN ('generic', 'custom')),
	cooldown_seconds INTEGER
		CHECK (cooldown_seconds BETWEEN 30 AND 3600),
	created_at TEXT,
	updated_at TEXT,

	PRIMARY KEY (guild_id, user_id)
);

PRAGMA user_version = 1;
