const { test } = require('node:test');
const assert = require('node:assert/strict');

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const openDatabase = require('../src/storage/database');

test (
	'database opens and initialises an in-memory database',
	() => {
		const database = openDatabase(':memory:');

		try {
			const result = database.prepare(
				`SELECT name
				FROM sqlite_master
				WHERE type = 'table'
					AND name = 'member_preferences'`,
			).get();

			assert.equal(result?.name, 'member_preferences');
		}
		finally {
			database.close();
		}
	},
);

test('database initialises the expected schema', () => {
	const database = openDatabase(':memory:');

	try {
		const tables = database.prepare(`
			SELECT name
			FROM sqlite_schema
			WHERE type = 'table'
			AND name NOT LIKE 'sqlite_%'
			ORDER BY name
		`).all();

		assert.deepEqual(
			tables.map((table) => table.name),
			['member_preferences'],
		);

		const columns = database.prepare(`
			PRAGMA table_info(member_preferences)
		`).all();

		assert.deepEqual(
			columns.map((column) => column.name),
			[
				'guild_id',
				'user_id',
				'enabled',
				'custom_message',
				'message_visibility',
				'cooldown_seconds',
				'created_at',
				'updated_at',
			],
		);

		const primaryKey = columns
			.filter((column) => Number(column.pk) > 0)
			.sort((a, b) => Number(a.pk) - Number(b.pk))
			.map((column) => column.name);

		assert.deepEqual(
			primaryKey,
			['guild_id', 'user_id'],
		);

		const result = database
			.prepare('PRAGMA user_version')
			.get();

		assert.ok(result, 'PRAGMA user_version should return a row');

		const { user_version: version } = result;

		assert.equal(version, 1);
	}
	finally {
		database.close();
	}
});

test('database retains preferences after reopening', () => {
	const createMonitoringService = require('../src/services/monitoring');
	const createPreferencesService = require('../src/services/preferences');

	const directory = fs.mkdtempSync(
		path.join(os.tmpdir(), 'pingbot-test-'),
	);
	const dbPath = path.join(directory, 'test.sqlite');

	const TEST_GUILD_ID = '7516697462984152536';
	const TEST_USER_ID = '7516697462984151181';

	try {
		const firstDatabase = openDatabase(dbPath);

		try {
			const preferences = createPreferencesService(firstDatabase);
			preferences.setMonitoring(TEST_GUILD_ID, TEST_USER_ID, 'enable');
		}
		finally {
			firstDatabase.close();
		}

		const secondDatabase = openDatabase(dbPath);

		try {
			const result = secondDatabase
				.prepare('PRAGMA user_version')
				.get();

			assert.ok(result,
				'PRAGMA user_version should return a row',
			);

			const { user_version: version } = result;

			assert.equal(version, 1);

			const monitoring = createMonitoringService(secondDatabase);

			assert.equal(
				monitoring.isEnabled(TEST_GUILD_ID, TEST_USER_ID),
				true,
				'Enabled preference should survive reopening',
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

test(
	'Database Constraints are constraining',
	() => {
		const database = openDatabase(':memory:');
		const TEST_GUILD_ID = '7516697462984152536';
		const TEST_USER_ID = '7516697462984151181';
		const setCustomCooldown = require('../src/storage/setCustomCooldown');
		const setMessageVisibility = require('../src/storage/setMessageVisibility');
		const setPingMonitoring = require('../src/storage/setPingMonitoring');
		const setCustomMessage = require('../src/storage/setCustomMessage');
		const sqliteErrorObj = {
			name: 'Error',
			code: 'ERR_SQLITE_ERROR',
			errcode: 275,
		};
		const sqliteNotNullErrorObj = {
			name: 'Error',
			code: 'ERR_SQLITE_ERROR',
			errcode: 1299,
		};

		try {
			assert.throws(
				() => setCustomCooldown(
					database,
					TEST_GUILD_ID,
					TEST_USER_ID,
					22),
				sqliteErrorObj,
				'Out of range cooldown is accepted',
			);

			assert.throws(
				() => setCustomCooldown(
					database,
					TEST_GUILD_ID,
					TEST_USER_ID,
					// @ts-expect-error Intentionally invalid command to test runtime validation.
					'thirty-three'),
				sqliteErrorObj,
				'Non numerical cooldown is accepted',
			);

			assert.throws(
				() => setPingMonitoring(
					database,
					TEST_GUILD_ID,
					TEST_USER_ID,
					// @ts-expect-error Intentionally invalid command to test runtime validation.
					22),
				sqliteErrorObj,
				'Out of range enabled option is accepted',
			);

			assert.throws(
				() => setPingMonitoring(
					database,
					TEST_GUILD_ID,
					TEST_USER_ID,
					// @ts-expect-error Intentionally invalid command to test runtime validation.
					null),
				sqliteNotNullErrorObj,
				'Null option accepted',
			);

			assert.throws(
				() => setMessageVisibility(
					database,
					TEST_GUILD_ID,
					TEST_USER_ID,
					// @ts-expect-error Intentionally invalid command to test runtime validation.
					'original'),
				sqliteErrorObj,
				'Out of range visibility option is accepted',
			);

			assert.throws(
				() => setMessageVisibility(
					database,
					// @ts-expect-error Intentionally invalid command to test runtime validation.
					null,
					TEST_USER_ID,
					'custom'),
				sqliteNotNullErrorObj,
				'Null GuildId Accepted',
			);

			assert.throws(
				() => setMessageVisibility(
					database,
					TEST_GUILD_ID,
					TEST_USER_ID,
					// @ts-expect-error Intentionally invalid command to test runtime validation.
					null),
				sqliteNotNullErrorObj,
				'Null Visibility option accepted',
			);

			assert.throws(
				() => setCustomMessage(
					database,
					TEST_GUILD_ID,
					// @ts-expect-error Intentionally invalid command to test runtime validation.
					null,
					'custom'),
				sqliteNotNullErrorObj,
				'Null user id accepted',
			);
		}
		finally {
			database.close();
		}
	},
);
