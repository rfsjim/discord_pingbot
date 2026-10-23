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

					assert.strictEqual(
						actual,
						expected,
						`Unexpect response for ${command}`,
					);

					continue;
				}
				if (command !== 'enable' && command !== 'disable') {
					continue;
				}
				actual = preferences.setMonitoring(
					TEST_GUILD_ID,
					TEST_USER_ID,
					command,
				);

				assert.strictEqual(
					actual,
					expected,
					`Unexpect response for ${command}`,
				);

				if (command === 'enable') {
					const memberEnabled = database.prepare(`
						SELECT enabled
						FROM member_preferences
						WHERE
							guild_id = ? AND
							user_id = ?
					`).get(TEST_GUILD_ID, TEST_USER_ID);

					assert.ok(
						memberEnabled,
						'Member preferences row does not exist');
					assert.strictEqual(
						memberEnabled.enabled,
						ENABLED,
						'Enable Ping Monitoring Did Not Enable',
					);
				}
				else if (command === 'disable') {
					const memberEnabled = database.prepare(`
						SELECT enabled
						FROM member_preferences
						WHERE
							guild_id = ? AND
							user_id = ?
					`).get(TEST_GUILD_ID, TEST_USER_ID);
					assert.ok(
						memberEnabled,
						'Member preferences row not returned');
					assert.strictEqual(
						memberEnabled.enabled,
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

			assert.strictEqual(
				getPingMonitoring(database, TEST_GUILD_ID, TEST_USER_ID),
				true,
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

			assert.strictEqual(
				getPingMonitoring(database, TEST_GUILD_ID, TEST_USER_ID),
				false,
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
			assert.strictEqual(
				getPingMonitoring(database, TEST_GUILD_ID, TEST_USER_ID),
				false,
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
					// @ts-expect-error Intentionally invalid command to test runtime validation.
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

			assert.strictEqual(
				member.user_id,
				TEST_USER_ID,
				'Member Settings do not include new user',
			);
			assert.strictEqual(
				member.guild_id,
				TEST_GUILD_ID,
				'Member Setting matches guild',
			);
			assert.strictEqual(
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
			const originalRowCount = database.prepare(`
				SELECT COUNT(*) AS originalRowCount
				FROM member_preferences
				WHERE
					user_id = ? AND
					guild_id = ?
			`).get(TEST_USER_ID, TEST_GUILD_ID);

			assert.ok(originalRowCount);
			assert.ok(originalMember);

			assert.strictEqual(
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

			const updatedRowCount = database.prepare(`
				SELECT COUNT(*) AS updatedRowCount
				FROM member_preferences
				WHERE
					user_id = ? AND
					guild_id = ?
			`).get(TEST_USER_ID, TEST_GUILD_ID);

			assert.ok(updatedRowCount);
			assert.ok(updatedMember);

			assert.notEqual(
				originalMember.enabled,
				updatedMember.enabled,
				'Member status is the same',
			);
			assert.strictEqual(
				updatedMember.enabled,
				ENABLED,
				'Updated member is disabled',
			);
			assert.strictEqual(
				originalRowCount.originalRowCount,
				updatedRowCount.updatedRowCount,
				'Additional rows added',
			);
			assert.strictEqual(
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
			const originalRowCount = database.prepare(`
				SELECT COUNT(*) AS originalRowCount
				FROM member_preferences
				WHERE
					user_id = ? AND
					guild_id = ?
			`).get(TEST_USER_ID, TEST_GUILD_ID);

			assert.ok(originalRowCount);

			setPingMonitoring(database, TEST_GUILD_ID, TEST_USER_ID, ENABLED);

			const additionalCallMember = database.prepare(`
				SELECT *
				FROM member_preferences
				WHERE
					user_id = ? AND
					guild_id = ?
			`).get(TEST_USER_ID, TEST_GUILD_ID);

			const additionalCallRowCount = database.prepare(`
				SELECT COUNT(*) AS additionalCallRowCount
				FROM member_preferences
				WHERE
					user_id = ? AND
					guild_id = ?
			`).get(TEST_USER_ID, TEST_GUILD_ID);
			assert.ok(additionalCallRowCount);

			assert.strictEqual(
				originalRowCount.originalRowCount,
				additionalCallRowCount.additionalCallRowCount,
				'Row Counts Different - Duplicate Created',
			);
			assert.strictEqual(
				additionalCallRowCount.additionalCallRowCount,
				1,
				'Expected exactly one member record row count',
			);

			assert.ok(originalMember);
			assert.ok(additionalCallMember);

			assert.strictEqual(
				originalMember.created_at,
				additionalCallMember.created_at,
				'Created_At Differs',
			);
			assert.strictEqual(
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

		assert.strictEqual(
			getPingMonitoring(database, TEST_GUILD_ID, TEST_USER_ID),
			true,
		);

		assert.strictEqual(
			getPingMonitoring(database, otherGuildId, TEST_USER_ID),
			false,
		);
	}
	finally {
		database.close();
	}
});

test('preferences accepts custom messages and handles methods',
	() => {
		const database = openDatabase(':memory:');
		const preferences = createPreferencesService(database);

		try {
			preferences.setMessage(TEST_GUILD_ID, TEST_USER_ID, 'I like airplanes');

			const actualSetMessage = database.prepare(`
				SELECT custom_message
				FROM member_preferences
				WHERE guild_id = ?
				AND user_id = ?
			`).get(TEST_GUILD_ID, TEST_USER_ID);

			assert.ok(actualSetMessage);

			assert.strictEqual(
				actualSetMessage.custom_message,
				'I like airplanes',
				'Set Message is not the same as saved message');

			preferences.setMessage(TEST_GUILD_ID, TEST_USER_ID, 'A'.repeat(200));

			const actual200Message = database.prepare(`
				SELECT custom_message
				FROM member_preferences
				WHERE guild_id = ?
				AND user_id = ?
			`).get(TEST_GUILD_ID, TEST_USER_ID);

			assert.ok(actual200Message);

			const { custom_message: customMessage } = actual200Message;

			assert.ok(
				typeof customMessage === 'string',
				'Expect custom message to be a string',
			);

			assert.strictEqual(
				customMessage.length,
				200,
				'Set message 200 long is not saved',
			);

			preferences.resetMessage(TEST_GUILD_ID, TEST_USER_ID);

			const actualResetMessage = database.prepare(`
				SELECT custom_message
				FROM member_preferences
				WHERE guild_id = ?
				AND user_id = ?
			`).get(TEST_GUILD_ID, TEST_USER_ID);

			assert.ok(actualResetMessage);

			assert.strictEqual(
				actualResetMessage.custom_message,
				null,
				'Message does not reset');

			assert.throws(
				() => preferences.setMessage(TEST_GUILD_ID, TEST_USER_ID, ''),
				{
					name: 'RangeError',
					message: 'Custom message cannot be empty',
				},
				'Empty message is accepted');

			assert.throws(
				() => preferences.setMessage(
					TEST_GUILD_ID,
					TEST_USER_ID,
					// @ts-expect-error Intentionally invalid command to test runtime validation.
					{}),
				{
					name: 'TypeError',
					message: 'Custom message must be a string',
				},
				'Object was accepted');

			assert.throws(
				() => preferences.setMessage(TEST_GUILD_ID, TEST_USER_ID, 'A'.repeat(201)),
				{
					name: 'RangeError',
					message: 'Custom message exceeds 200 characters',
				},
				'Oversized string was accepted');

			assert.throws(
				() => preferences.setMessage(TEST_GUILD_ID, TEST_USER_ID, 'Invalid\u0001message'),
				{
					name: 'RangeError',
					message: 'Custom message contains invalid control characters',
				},
				'Control character was accepted');

			assert.throws(
				() => preferences.setMessage(TEST_GUILD_ID, TEST_USER_ID, '   '),
				{
					name: 'RangeError',
					message: 'Custom message cannot be empty',
				},
				'Whitespace-only message was accepted');

			const actualAfterRejectedMessage = database.prepare(`
				SELECT custom_message
				FROM member_preferences
				WHERE guild_id = ?
				AND user_id = ?
			`).get(TEST_GUILD_ID, TEST_USER_ID);

			assert.ok(actualAfterRejectedMessage);

			assert.strictEqual(
				actualAfterRejectedMessage.custom_message,
				actualResetMessage.custom_message,
				'Rejected messages modified the stored preference');
		}
		finally {
			database.close();
		}
	},
);

test('database retains preferences after database reopens', () => {
	const fs = require('node:fs');
	const os = require('node:os');
	const path = require('node:path');

	const directory = fs.mkdtempSync(
		path.join(os.tmpdir(), 'pingbot-test-'),
	);
	const dbPath = path.join(directory, 'test.sqlite');

	try {
		const firstDatabase = openDatabase(dbPath);

		try {
			const preferences = createPreferencesService(firstDatabase);
			preferences.setMonitoring(TEST_GUILD_ID, TEST_USER_ID, 'enable');
			preferences.setMessage(TEST_GUILD_ID, TEST_USER_ID, 'I like aeroplane jelly ✈️ 飛行機');
		}
		finally {
			firstDatabase.close();
		}

		const secondDatabase = openDatabase(dbPath);

		try {
			const preferences = createPreferencesService(secondDatabase);
			const actualReopenMessage = secondDatabase.prepare(`
				SELECT custom_message
				FROM member_preferences
				WHERE guild_id = ?
				AND user_id = ?
			`).get(TEST_GUILD_ID, TEST_USER_ID);

			assert.ok(actualReopenMessage);

			assert.strictEqual(
				preferences.getMonitoringStatus(TEST_GUILD_ID, TEST_USER_ID),
				'Ping Notifications are enabled',
				'Enabled preference should survive reopening',
			);
			assert.strictEqual(
				actualReopenMessage.custom_message,
				'I like aeroplane jelly ✈️ 飛行機',
				'Custom message persists through database open and close',
			);
		}
		finally {
			secondDatabase.close();
		}
	}
	finally {
		fs.rmSync(directory, { recursive: true, force: true });
	}
});

test('preferences Handles visibility preferences and visibility without a custom message',
	() => {
		const database = openDatabase(':memory:');
		const preferences = createPreferencesService(database);
		const getVisibility = require('../src/storage/getMessageVisibility');

		try {
			preferences.setVisibility(TEST_GUILD_ID, TEST_USER_ID, 'custom');

			const actualVisibility = database.prepare(`
				SELECT message_visibility
				FROM member_preferences
				WHERE guild_id = ?
				AND user_id = ?
			`).get(TEST_GUILD_ID, TEST_USER_ID);

			assert.ok(actualVisibility);

			assert.strictEqual(
				actualVisibility.message_visibility,
				'custom',
				'Message Visibility did not get set',
			);

			preferences.setVisibility(TEST_GUILD_ID, TEST_USER_ID, 'generic');

			const visibility = getVisibility(database, TEST_GUILD_ID, TEST_USER_ID);

			assert.strictEqual(
				visibility,
				'generic',
				'Message Visibility did not change',
			);

			assert.throws(
				() => preferences.setVisibility(
					TEST_GUILD_ID,
					TEST_USER_ID,
					// @ts-expect-error Intentionally invalid command to test runtime validation.
					'garbage'),
				{
					name: 'Error',
					code: 'ERR_SQLITE_ERROR',
					errcode: 275,
				},
			);

			assert.strictEqual(
				getVisibility(database, TEST_GUILD_ID, TEST_USER_ID),
				'generic',
				'Message Visibility accepted and changed to a garbage value',
			);

			preferences.setMessage(TEST_GUILD_ID, TEST_USER_ID, 'hello world');
			preferences.setVisibility(TEST_GUILD_ID, TEST_USER_ID, 'custom');
			preferences.setMonitoring(TEST_GUILD_ID, TEST_USER_ID, 'enable');

			const actualMultipleChanges = database.prepare(`
				SELECT enabled, custom_message, message_visibility
				FROM member_preferences
				WHERE guild_id = ?
				AND user_id = ?
			`).get(TEST_GUILD_ID, TEST_USER_ID);

			assert.deepStrictEqual(
				{ ...actualMultipleChanges },
				{
					enabled: 1,
					custom_message: 'hello world',
					message_visibility: 'custom',
				},
				'Multiple changes affect other fields results');
		}
		finally {
			database.close();
		}
	},
);

test(
	'preferences Cooldowns are set, boundaries are respected',
	() => {
		const database = openDatabase(':memory:');
		const preferences = createPreferencesService(database);
		const getCooldown = require('../src/storage/getCustomCooldown');

		try {
			preferences.setCooldown(TEST_GUILD_ID, TEST_USER_ID, 100);

			const actualCooldown = database.prepare(`
					SELECT cooldown_seconds
					FROM member_preferences
					WHERE guild_id = ?
					AND user_id = ?
				`).get(TEST_GUILD_ID, TEST_USER_ID);

			assert.ok(actualCooldown);

			assert.strictEqual(
				actualCooldown.cooldown_seconds,
				100,
				'Set Cooldown setter does not set cooldown bad setter',
			);

			preferences.setCooldown(TEST_GUILD_ID, TEST_USER_ID, 30);

			assert.strictEqual(
				getCooldown(database, TEST_GUILD_ID, TEST_USER_ID),
				30,
				'Thirty is not accepted',
			);

			preferences.setCooldown(TEST_GUILD_ID, TEST_USER_ID, 3600);

			assert.strictEqual(
				getCooldown(database, TEST_GUILD_ID, TEST_USER_ID),
				3600,
				'60 minutes is not accepted',
			);

			assert.throws(
				() => preferences.setCooldown(TEST_GUILD_ID, TEST_USER_ID, 29),
				{
					name: 'RangeError',
					message: 'Cooldown of 29 is incorrect it needs to be between 30 and 3600 seconds',
				},
			);

			assert.throws(
				() => preferences.setCooldown(
					TEST_GUILD_ID,
					TEST_USER_ID,
					// @ts-expect-error Intentionally invalid command to test runtime validation.
					'one hundred and eighty'),
				{
					name: 'RangeError',
					message: 'Cooldown of one hundred and eighty is incorrect it needs to be between 30 and 3600 seconds',
				},
			);

			assert.strictEqual(
				getCooldown(database, TEST_GUILD_ID, TEST_USER_ID),
				3600,
				'Range Error Thrown but database row still changed',
			);

			preferences.setMessage(TEST_GUILD_ID, TEST_USER_ID, 'hello world');
			preferences.setVisibility(TEST_GUILD_ID, TEST_USER_ID, 'custom');
			preferences.setMonitoring(TEST_GUILD_ID, TEST_USER_ID, 'enable');
			preferences.setCooldown(TEST_GUILD_ID, TEST_USER_ID, 3600);

			const actualMultipleChanges = database.prepare(`
				SELECT enabled, custom_message, message_visibility, cooldown_seconds
				FROM member_preferences
				WHERE guild_id = ?
				AND user_id = ?
			`).get(TEST_GUILD_ID, TEST_USER_ID);

			assert.deepStrictEqual(
				{ ...actualMultipleChanges },
				{
					enabled: 1,
					custom_message: 'hello world',
					message_visibility: 'custom',
					cooldown_seconds: 3600,
				},
				'Multiple changes affect other fields results');
		}
		finally {
			database.close();
		}
	},
);

test(
	'preferences Order Independence Test Works without needing specific order of operations',
	() => {
		const database = openDatabase(':memory:');
		const preferences = createPreferencesService(database);

		try {
			const emptyMember = database.prepare(`
				SELECT COUNT(*) AS originalRowCount
				FROM member_preferences
				WHERE
					user_id = ? AND
					guild_id = ?
			`).get(TEST_USER_ID, TEST_GUILD_ID);

			assert.ok(emptyMember);

			assert.strictEqual(
				emptyMember.originalRowCount,
				0,
				'Member starts off empty',
			);

			preferences.setCooldown(TEST_GUILD_ID, TEST_USER_ID, 180);
			preferences.setMessage(TEST_GUILD_ID, TEST_USER_ID, 'No ping plz');
			preferences.setVisibility(TEST_GUILD_ID, TEST_USER_ID, 'custom');
			preferences.setMonitoring(TEST_GUILD_ID, TEST_USER_ID, 'enable');

			const actualMultipleChangesOne = database.prepare(`
				SELECT enabled, custom_message, message_visibility, cooldown_seconds
				FROM member_preferences
				WHERE guild_id = ?
				AND user_id = ?
			`).get(TEST_GUILD_ID, TEST_USER_ID);

			assert.deepStrictEqual(
				{ ...actualMultipleChangesOne },
				{
					enabled: 1,
					custom_message: 'No ping plz',
					message_visibility: 'custom',
					cooldown_seconds: 180,
				},
				'Multiple changes affect other fields results');

			preferences.setMonitoring(TEST_GUILD_ID, TEST_USER_ID, 'disable');
			preferences.setCooldown(TEST_GUILD_ID, TEST_USER_ID, 360);
			preferences.resetMessage(TEST_GUILD_ID, TEST_USER_ID);
			preferences.setVisibility(TEST_GUILD_ID, TEST_USER_ID, 'generic');

			const actualMultipleChangesTwo = database.prepare(`
				SELECT enabled, custom_message, message_visibility, cooldown_seconds
				FROM member_preferences
				WHERE guild_id = ?
				AND user_id = ?
			`).get(TEST_GUILD_ID, TEST_USER_ID);

			assert.deepStrictEqual(
				{ ...actualMultipleChangesTwo },
				{
					enabled: 0,
					custom_message: null,
					message_visibility: 'generic',
					cooldown_seconds: 360,
				},
				'Multiple changes affect other fields results');
		}
		finally {
			database.close();
		}
	},
);
