const fs = require('node:fs');
const path = require('node:path');

const migrations = [
	'001-initial-schema.sql',
];

const CURRENT_SCHEMA_VERSION = migrations.length;

/**
 *
 * @param {import('node:sqlite').Database} database
 * @returns
 */
module.exports = function migrateDatabase(database) {
	let { user_version: version } = database
		.prepare('PRAGMA user_version')
		.get();
	version = Number(version);

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
