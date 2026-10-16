const { test } = require('node:test');
const assert = require('node:assert/strict');
const createPreferencesService = require('../src/services/preferences');
const openDatabase = require('../src/storage/database');
const enablePingMonitoring = require('../src/storage/enablePingMonitoring');

const TEST_GUILD_ID = '7516697462984152536';
const TEST_USER_ID = '7516697462984151181';
const ENABLED = 1;
const DISABLED = 0;


/**
 * TODO: state-transition test - test how enable, disable and status
 * behave together over the lifetime of a member's preferences.
 * Verify that for each state enable → disable → status
 * Operation	Expected enabled	Additional expectation
 * Enable	1	Member record created
 * Disable	0	Existing record updated
 * Status	0	No database changes
 *
 * Needs the other services wired in before it will operate
 **/
test (
	'parse, categorises, and persists the requested preferences',
	() => {
		const database = openDatabase(':memory:');
		const preferences = createPreferencesService(database);

		const validResponses = {
			enable: 'enable ping notification',
			disable: 'disable ping notification',
			status: 'status ping notification',
		};

		try {
			for (const [command, expected] of Object.entries(validResponses)) {
				const actual = preferences(
					command,
					TEST_GUILD_ID,
					TEST_USER_ID,
				);

				assert.equal(
					actual,
					expected,
					`Unexpect response for ${command}`,
				);
			}
		}
		finally {
			database.close();
		}
	},
);

test(
	'rejects nonexistent commands',
	() => {
		const database = openDatabase(':memory:');
		const preferences = createPreferencesService(database);

		try {
			assert.throws(
				() => preferences(
					'disenable',
					TEST_GUILD_ID,
					TEST_USER_ID,
				),
				{
					name: 'Error',
					message: 'Unhandled command disenable',
				},
			);
		}
		finally {
			database.close();
		}
	},
);

/**
 * TODO: Test for three scenarios against an in-memory database:
 * Starting state	Expected result
 * No guild, no member	Both records created; monitoring enabled ✅
 * (Verification via counting version [master da8e7f5] Feat: Add persistent storage of enable ping preference)
 * Guild exists, member doesn't	Member created; monitoring enabled ✅
 * Guild and member exist, monitoring disabled	Existing member updated; monitoring enabled
 * test calling the function twice to confirm it doesn't create duplicate records or overwrite created_at
 *
 */
test(
	'no guild no member creates records in both tables and enables monitoring',
	() => {
		const database = openDatabase(':memory:');

		try {
			enablePingMonitoring(database, TEST_GUILD_ID, TEST_USER_ID);

			const guild = database.prepare(`
			SELECT *
			FROM guild_settings
			WHERE guild_id = ?
			`).get(TEST_GUILD_ID);
			const member = database.prepare(`
				SELECT *
				FROM member_preferences
				WHERE
					user_id = ? AND
					guild_id = ?
			`).get(TEST_USER_ID, TEST_GUILD_ID);

			assert.ok(
				guild,
				'Guild was not created',
			);
			assert.ok(
				member,
				'Member was not created',
			);

			assert.equal(
				guild.guild_id,
				TEST_GUILD_ID,
				'Guild Settings do not include new guild',
			);
			assert.equal(
				member.user_id,
				TEST_USER_ID,
				'Member Settings do not include new user',
			);
			assert.equal(
				member.guild_id,
				TEST_GUILD_ID,
				'Member Setting matches guild',
			);
			assert.equal(
				member.enabled,
				ENABLED,
				'Monitoring was not enabled',
			);
			assert.equal(
				member.created_at,
				guild.created_at,
				'Member and Guild created at different times',
			);
		}
		finally {
			database.close();
		}
	},
);

test(
	'Creates member for existing guild and enables monitoring',
	() => {
		const database = openDatabase(':memory:');
		const newUserId = '7516697462984154807';

		try {
			enablePingMonitoring(database, TEST_GUILD_ID, TEST_USER_ID);

			const originalGuild = database.prepare(`
				SELECT updated_at
				FROM guild_settings
				WHERE guild_id = ?
			`).get(TEST_GUILD_ID);
			const originalMember = database.prepare(`
				SELECT user_id
				FROM member_preferences
				WHERE
					user_id = ? AND
					guild_id = ?
			`).get(TEST_USER_ID, TEST_GUILD_ID);

			enablePingMonitoring(database, TEST_GUILD_ID, newUserId);

			const member = database.prepare(`
				SELECT *
				FROM member_preferences
				WHERE
					user_id = ? AND
					guild_id = ?
			`).get(newUserId, TEST_GUILD_ID);

			const guild = database.prepare(`
				SELECT updated_at
				FROM guild_settings
				WHERE guild_id = ?
			`).get(TEST_GUILD_ID);

			assert.ok(
				member,
				'Member not created',
			);
			assert.equal(
				member.enabled,
				ENABLED,
				'Monitoring not enabled',
			);
			assert.equal(
				member.guild_id,
				TEST_GUILD_ID,
				'Incorrect Guild Id',
			);
			assert.equal(
				guild.updated_at,
				originalGuild.updated_at,
				'Existing Guild was updated when already exists',
			);
			assert.equal(
				originalMember.user_id,
				TEST_USER_ID,
				'Existing User was overridden',
			);
			assert.notEqual(
				member.created_at,
				guild.updated_at,
				'Existing guild timestamp changed by new member',
			);
		}
		finally {
			database.close();
		}
	},
);

test(
	'Existing Guild and Member, Disabled monitoring - enable monitoring',
	() => {
		const database = openDatabase(':memory:');
		const now = Temporal.Now.instant().toString();

		try {
			enablePingMonitoring(database, TEST_GUILD_ID, TEST_USER_ID);

			// TODO: Migrate to disablePingMonitoring() call when exists
			database.prepare(`
				UPDATE member_preferences
				SET
					enabled = ?,
					updated_at = ?
				WHERE
					user_id = ? AND
					guild_id = ?
			`).run(DISABLED, now, TEST_USER_ID, TEST_GUILD_ID);

			const originalMember = database.prepare(`
				SELECT *
				FROM member_preferences
				WHERE
					user_id = ? AND
					guild_id = ?
			`).get(TEST_USER_ID, TEST_GUILD_ID);
			const { originalRowCount } = database.prepare(`
				SELECT COUNT(*) AS originalRowCount
				FROM member_preferences
				WHERE
					user_id = ? AND
					guild_id = ?
			`).get(TEST_USER_ID, TEST_GUILD_ID);

			assert.equal(
				originalMember.enabled,
				DISABLED,
				'Member is enabled',
			);

			enablePingMonitoring(database, TEST_GUILD_ID, TEST_USER_ID);

			const updatedMember = database.prepare(`
				SELECT *
				FROM member_preferences
				WHERE
					user_id = ? AND
					guild_id = ?
			`).get(TEST_USER_ID, TEST_GUILD_ID);
			const { updatedRowCount } = database.prepare(`
				SELECT COUNT(*) AS updatedRowCount
				FROM member_preferences
				WHERE
					user_id = ? AND
					guild_id = ?
			`).get(TEST_USER_ID, TEST_GUILD_ID);

			assert.notEqual(
				originalMember.enabled,
				updatedMember.enabled,
				'Member status is the same',
			);
			assert.equal(
				updatedMember.enabled,
				ENABLED,
				'Updated member is disabled',
			);
			assert.equal(
				originalRowCount,
				updatedRowCount,
				'Additional rows added',
			);
			assert.equal(
				originalMember.created_at,
				updatedMember.created_at,
				'Member creation Dates Different',
			);
			assert.notEqual(
				originalMember.updated_at,
				updatedMember.updated_at,
				'Member updated dates remain the same',
			);
		}
		finally {
			database.close();
		}
	},
);

test(
	'Duplicate calling of same function does not create duplicate record or overwrite created_at',
	() => {
		const database = openDatabase(':memory:');

		try {
			enablePingMonitoring(database, TEST_GUILD_ID, TEST_USER_ID);

			const originalMember = database.prepare(`
				SELECT *
				FROM member_preferences
				WHERE
					user_id = ? AND
					guild_id = ?
			`).get(TEST_USER_ID, TEST_GUILD_ID);
			const { originalRowCount } = database.prepare(`
				SELECT COUNT(*) AS originalRowCount
				FROM member_preferences
				WHERE
					user_id = ? AND
					guild_id = ?
			`).get(TEST_USER_ID, TEST_GUILD_ID);

			enablePingMonitoring(database, TEST_GUILD_ID, TEST_USER_ID);

			const additionalCallMember = database.prepare(`
				SELECT *
				FROM member_preferences
				WHERE
					user_id = ? AND
					guild_id = ?
			`).get(TEST_USER_ID, TEST_GUILD_ID);
			const { additionalCallRowCount } = database.prepare(`
				SELECT COUNT(*) AS additionalCallRowCount
				FROM member_preferences
				WHERE
					user_id = ? AND
					guild_id = ?
			`).get(TEST_USER_ID, TEST_GUILD_ID);

			assert.equal(
				originalRowCount,
				additionalCallRowCount,
				'Row Counts Different - Duplicate Created',
			);
			assert.equal(
				additionalCallRowCount,
				1,
				'Expected exactly one member record row count',
			);
			assert.equal(
				originalMember.created_at,
				additionalCallMember.created_at,
				'Created At Differs',
			);
			assert.equal(
				originalMember.enabled,
				additionalCallMember.enabled,
				'Enabled Status is Different',
			);
		}
		finally {
			database.close();
		}
	},
);
