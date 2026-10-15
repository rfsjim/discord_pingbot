/*
 *
 * Requirement	Data needed
 * Opt-in preferences	Guild ID, user ID, enabled
 * Custom messages	User-specific text
 * Visibility	Generic or custom
 * Personal cooldown	Duration
 * Server settings	Enabled, default message, cooldown
 * Channel policies	Guild ID, channel ID, monitoring mode
 *
 * A few deliberate decisions:
 * Snowflakes are stored as TEXT, not JavaScript numbers. Discord IDs can exceed JavaScript's safe integer range.
 * The composite (guild_id, user_id) key allows different preferences for the same user across servers.
 * enabled defaults to false, preserving your opt-in policy.
 * A NULL personal cooldown means inherit the server default.
 * SQLite uses integers for Boolean values.
 *
 * There are really three layers of validation
 * Layer	Responsibility	Example
 * Discord.js	API structure and interaction types	Slash command integer option
 * Application	Business rules and permissions	Cooldown must be 30–3600 seconds
 * SQLite	Data integrity	CHECK, NOT NULL, UNIQUE, foreign keys
 *
 */

 CREATE TABLE IF NOT EXISTS guild_settings (
	guild_id TEXT PRIMARY KEY,
	enabled INTEGER NOT NULL DEFAULT 1,
	default_message TEXT,
	default_cooldown_seconds INTEGER NOT NULL DEFAULT 60
		CHECK (default_cooldown_seconds BETWEEN 30 AND 3600),
	channel_mode TEXT,
	include_reply_mentions INTEGER NOT NULL DEFAULT 0,
	created_at TEXT,
	updated_at TEXT
);

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

	PRIMARY KEY (guild_id, user_id),
	FOREIGN KEY (guild_id)
		REFERENCES guild_settings(guild_id)
);

CREATE TABLE IF NOT EXISTS channel_rules (
	guild_id TEXT NOT NULL,
	channel_id TEXT NOT NULL,
	enabled INTEGER NOT NULL DEFAULT 1
		CHECK (enabled IN (0, 1)),

	PRIMARY KEY (guild_id, channel_id),
	FOREIGN KEY (guild_id)
		REFERENCES guild_settings(guild_id)
);
