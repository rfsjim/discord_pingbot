const { Database } = require('node:sqlite');
const migrateDatabase = require('./migrateDatabase');

/**
 *
 * @param {string} dbPath
 * @returns {Database}
 */
module.exports = function openDatabase(dbPath) {

	const database = new Database(dbPath);

	try {
		database.exec('PRAGMA foreign_keys = ON');
		migrateDatabase(database);
		return database;
	}
	catch (error) {
		database.close();
		throw error;
	}
};
