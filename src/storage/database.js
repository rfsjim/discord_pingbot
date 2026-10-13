const fs = require('node:fs');
const path = require('node:path');
const { Database } = require('node:sqlite');

module.exports = function openDatabase(dbPath) {
	const database = new Database(dbPath);

	database.exec('PRAGMA foreign_keys = ON');

	const schema = fs.readFileSync(
		path.join(__dirname, 'schema.sql'),
		'utf8',
	);

	database.exec(schema);

	return database;
};

/**

const preferences = require('./repositories/preferences');

const setting = preferences.get(guildId, userId);
preferences.enable(guildId, userId);
preferences.disable(guildId, userId);

const statement = db.prepare(`
    INSERT INTO user_preferences
        (guild_id, user_id, enabled)
    VALUES (?, ?, ?)
    ON CONFLICT(guild_id, user_id)
    DO UPDATE SET enabled = excluded.enabled
`);

statement.run(guildId, userId, enabled ? 1 : 0);

setUserPreference(guildId, userId, true);
getUserPreference(guildId, userId);
 */
