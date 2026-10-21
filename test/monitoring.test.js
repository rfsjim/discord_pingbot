const { test } = require('node:test');
const assert = require('node:assert/strict');

const createMonitoringService = require('../src/services/monitoring');
const createPreferencesService = require('../src/services/preferences');
const openDatabase = require('../src/storage/database');

const TEST_GUILD_ID = '7516697462984152536';
const TEST_USER_ID = '7516697462984151181';

test(
	'monitoring Given unknown user - test returns false',
	() => {
		const database = openDatabase(':memory:');
		const monitoring = createMonitoringService(database);

		try {
			assert.strictEqual(
				monitoring(TEST_GUILD_ID, TEST_USER_ID),
				false,
				'Unknown member returns true',
			);
		}
		finally {
			database.close();
		}
	},
);

test(
	'monitoring Given existing enabled user - test returns true',
	() => {
		const database = openDatabase(':memory:');
		const monitoring = createMonitoringService(database);
		const preferences = createPreferencesService(database);

		try {
			preferences.setMonitoring(TEST_GUILD_ID, TEST_USER_ID, 'enable');

			assert.strictEqual(
				monitoring(TEST_GUILD_ID, TEST_USER_ID),
				true,
				'Enabled member returns false',
			);
		}
		finally {
			database.close();
		}
	},
);

test(
	'monitoring Given existing disabled user - test returns false',
	() => {
		const database = openDatabase(':memory:');
		const monitoring = createMonitoringService(database);
		const preferences = createPreferencesService(database);

		try {
			preferences.setMonitoring(TEST_GUILD_ID, TEST_USER_ID, 'disable');

			assert.strictEqual(
				monitoring(TEST_GUILD_ID, TEST_USER_ID),
				false,
				'Disabled member returns false',
			);
		}
		finally {
			database.close();
		}
	},
);
