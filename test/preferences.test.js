const { test } = require('node:test');
const assert = require('node:assert/strict');
const createPreferencesService = require('../src/services/preferences');
const openDatabase = require('../src/storage/database');
const setPingMonitoring = require('../src/storage/setPingMonitoring');
const getPingMonitoring = require('../src/storage/getPingMonitoring');

const TEST_GUILD_ID = '7516697462984152536';
const TEST_USER_ID = '7516697462984151181';
const ENABLED = 1;
const DISABLED = 0;
const PREVIOUS_TIMESTAMP = '1980-01-01T00:00:00.000Z';

test (
	'preferences parse, categorises, persists the requested preferences, gives correct monitoring status',
	() => {
		const database = openDatabase(':memory:');
		const preferences = createPreferencesService(database);

		const validResponses = {
			enable: 'enable ping notification',
			disable: 'disable ping notification',
			status: 'Ping Notifications are disabled',
		};

		try {
			for (const [command, expected] of Object.entries(validResponses)) {
				let actual;
				if (command === 'status') {
					actual = preferences.getMonitoringStatus(
						TEST_GUILD_ID,
						TEST_USER_ID,
					);
					continue;
				}
				actual = preferences.setMonitoring(
					TEST_GUILD_ID,
					TEST_USER_ID,
					command,
				);

				assert.equal(
					actual,
					expected,
					`Unexpect response for ${command}`,
				);

				if (command === 'enable') {
					const { enabled } = database.prepare(`
						SELECT enabled
						FROM member_preferences
						WHERE
							guild_id = ? AND
							user_id = ?
					`).get(TEST_GUILD_ID, TEST_USER_ID);
					assert.equal(
						enabled,
						ENABLED,
						'Enable Ping Monitoring Did Not Enable',
					);
				}
				else if (command === 'disable') {
					const { enabled } = database.prepare(`
						SELECT enabled
						FROM member_preferences
						WHERE
							guild_id = ? AND
							user_id = ?
					`).get(TEST_GUILD_ID, TEST_USER_ID);
					assert.equal(
						enabled,
						DISABLED,
						'Disable Ping Monitoring Did Not Disable',
					);
				}
			}
		}
		finally {
			database.close();
		}
	},
);

test(
	'preferences Enabled Member Returns Enabled',
	() => {
		const database = openDatabase(':memory:');

		try {
			setPingMonitoring(database, TEST_GUILD_ID, TEST_USER_ID, ENABLED);

			assert.equal(
				getPingMonitoring(database, TEST_GUILD_ID, TEST_USER_ID),
				ENABLED,
				'Enabled Member Returned Disabled',
			);
		}
		finally {
			database.close();
		}
	},
);

test(
	'preferences Disabled Member Returns Disabled',
	() => {
		const database = openDatabase(':memory:');

		try {
			setPingMonitoring(database, TEST_GUILD_ID, TEST_USER_ID, DISABLED);

			assert.equal(
				getPingMonitoring(database, TEST_GUILD_ID, TEST_USER_ID),
				DISABLED,
				'Disabled Member Returned Enabled',
			);
		}
		finally {
			database.close();
		}
	},
);

test(
	'preferences Un-configured member defaults to disabled',
	() => {
		const database = openDatabase(':memory:');

		try {
			assert.equal(
				getPingMonitoring(database, TEST_GUILD_ID, TEST_USER_ID),
				DISABLED,
				'Un-configured member Returned Enabled',
			);
		}
		finally {
			database.close();
		}
	},
);

test(
	'preferences rejects nonexistent commands',
	() => {
		const database = openDatabase(':memory:');
		const preferences = createPreferencesService(database);

		try {
			assert.throws(
				() => preferences.setMonitoring(
					TEST_GUILD_ID,
					TEST_USER_ID,
					'disenable',
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

test(
	'preferences no member creates records in table and enables monitoring',
	() => {
		const database = openDatabase(':memory:');

		try {
			setPingMonitoring(database, TEST_GUILD_ID, TEST_USER_ID, ENABLED);

			const member = database.prepare(`
				SELECT *
				FROM member_preferences
				WHERE
					user_id = ? AND
					guild_id = ?
			`).get(TEST_USER_ID, TEST_GUILD_ID);

			assert.ok(
				member,
				'Member was not created',
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
		}
		finally {
			database.close();
		}
	},
);

test(
	'preferences Existing Member, Disabled monitoring - enable monitoring',
	() => {
		const database = openDatabase(':memory:');

		try {
			setPingMonitoring(
				database,
				TEST_GUILD_ID,
				TEST_USER_ID,
				DISABLED,
				() => PREVIOUS_TIMESTAMP,
			);

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

			setPingMonitoring(database, TEST_GUILD_ID, TEST_USER_ID, ENABLED);

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
	'preferences Duplicate calling of same function does not create duplicate record or overwrite created_at',
	() => {
		const database = openDatabase(':memory:');

		try {
			setPingMonitoring(
				database,
				TEST_GUILD_ID,
				TEST_USER_ID,
				ENABLED,
				() => PREVIOUS_TIMESTAMP,
			);

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

			setPingMonitoring(database, TEST_GUILD_ID, TEST_USER_ID, ENABLED);

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
				'Created_At Differs',
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

test('preferences are isolated between guilds', () => {
	const database = openDatabase(':memory:');

	try {
		const otherGuildId = 'other-guild';

		setPingMonitoring(database, TEST_GUILD_ID, TEST_USER_ID, ENABLED);
		setPingMonitoring(database, otherGuildId, TEST_USER_ID, DISABLED);

		assert.equal(
			getPingMonitoring(database, TEST_GUILD_ID, TEST_USER_ID),
			ENABLED,
		);

		assert.equal(
			getPingMonitoring(database, otherGuildId, TEST_USER_ID),
			DISABLED,
		);
	}
	finally {
		database.close();
	}
});
