const fs = require('node:fs');
const path = require('node:path');

const migrations = [
	'001-initial-schema.sql',
];

const CURRENT_SCHEMA_VERSION = migrations.length;

/**
 * Applies any outstanding schema migrations to a database.
 *
 * @param {import('node:sqlite').Database} database The database to migrate.
 * @returns {import('node:sqlite').Database} The migrated database.
 */
module.exports = function migrateDatabase(database) {
	const versionRow = database
		.prepare('PRAGMA user_version')
		.get();
	const version = versionRow?.user_version;

	if (
		typeof version !== 'number' ||
		!Number.isInteger(version) ||
		version < 0
	) {
		throw new TypeError('PRAGMA user_version did not return a non-negative integer');
	}

	if (version > CURRENT_SCHEMA_VERSION) {
		throw new Error(
			`Database schema version ${version} is newer than supported version ${CURRENT_SCHEMA_VERSION}`,
		);
	}

	if (version === CURRENT_SCHEMA_VERSION) {
		return database;
	}

	for (let i = version; i < migrations.length; i++) {
		const schema = fs.readFileSync(
			path.join(__dirname, 'migrations', migrations[i]),
			'utf8',
		);

		database.exec('BEGIN');

		try {
			database.exec(schema);
			database.exec('COMMIT');
		}
		catch (error) {
			database.exec('ROLLBACK');
			throw error;
		}
	}

	return database;
};
