const fs = require('node:fs');
const path = require('node:path');
const { Database } = require('node:sqlite');

module.exports = function openDatabase(dbPath) {

	const database = new Database(dbPath);

	database.exec('PRAGMA foreign_keys = ON');

	const schema = fs.readFileSync(
		path.join(__dirname, 'schema.sql'),
		'utf8',
	);

	database.exec(schema);

	return database;
};
