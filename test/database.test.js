const { test } = require('node:test');
const assert = require('node:assert/strict');
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
