const { test } = require('node:test');
const assert = require('node:assert/strict');
const createPreferencesService = require('../src/services/preferences');
const openDatabase = require('../src/storage/database');
const enablePingMonitoring = require('../src/storage/enablePingMonitoring');
const database = openDatabase(':memory:');
const preferences = createPreferencesService(database);

test (
	'parse and categorises the requested preferences',
	() => {
		const validResponses = {
			enable: 'enable ping notification',
			disable: 'disable ping notification',
			status: 'status ping notification',
		};

		for (const [command, expected] of Object.entries(validResponses)) {
			const actual = preferences(
				command,
				'123456789',
				'987654321',
			);

			assert.equal(
				actual,
				expected,
				`Unexpect response for ${command}`,
			);
		}
	},
);

test(
	'rejects nonexistent commands',
	() => {
		assert.throws(
			() => preferences(
				'disenable',
				'987654321',
				'123456789',
			),
			{
				name: 'Error',
				message: 'Unhandled command disenable',
			},
		);
	},
);

/**
 * TODO: Test for three scenarios against an in-memory database:
 * Starting state	Expected result
 * No guild, no member	Both records created; monitoring enabled ✅
 * Guild exists, member doesn't	Member created; monitoring enabled
 * Guild and member exist, monitoring disabled	Existing member updated; monitoring enabled
 * test calling the function twice to confirm it doesn't create duplicate records or overwrite created_at
 *
 */
test(
	'no guild no member creates records in both tables and enables monitoring',
	() => {
		const { startGuildCount } = database.prepare(`
			SELECT COUNT(*) AS startGuildCount
			FROM guild_settings
		`).get();
		const { startMemberCount } = database.prepare(`
			SELECT COUNT(*) AS startMemberCount
			FROM member_preferences
		`).get();

		try {
			enablePingMonitoring(database, 'pinku', 'neko');

			const { currentGuildCount } = database.prepare(`
			SELECT COUNT(*) AS currentGuildCount
			FROM guild_settings
			`).get();
			const { currentMemberCount } = database.prepare(`
				SELECT COUNT(*) AS currentMemberCount
				FROM member_preferences
			`).get();
			const { enabled } = database.prepare(`
				SELECT enabled
				FROM member_preferences
				WHERE user_id = 'neko'
			`).get();

			const expectedGuildCount = startGuildCount + 1;
			const expectedMemberCount = startMemberCount + 1;

			assert.equal(
				currentGuildCount, expectedGuildCount,
				'guild_settings dont balance',
			);
			assert.equal(
				currentMemberCount, expectedMemberCount,
				'member_preferences dont balance',
			);
			assert.equal(
				enabled,
				1,
				'monitoring not enabled',
			);
		}
		finally {
			database.close();
		}
	},
);
