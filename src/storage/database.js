const { Database } = require('node:sqlite');
const database = new Database(':memory:');

database.exec();

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
