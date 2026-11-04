const { test } = require('node:test');
const assert = require('node:assert/strict');

const openDatabase = require('../src/storage/database');
const createSecurityIncident = require('../src/storage/createSecurityIncident');
const updateSecurityIncident = require('../src/storage/updateSecurityIncident');

/**
 * @param {import('node:sqlite').Database} database
 * @returns {number}
 */
function createIncident(database) {
	return createSecurityIncident(
		database,
		'guild-123',
		'Unauthorised guild usage',
		'critical',
		'Activity detected outside the allowlist',
		'Initial details',
	);
}

test('updateSecurityIncident updates the status, details, and timestamp', () => {
	const database = openDatabase(':memory:');

	try {
		const incidentId = createIncident(database);
		database.prepare(`
			UPDATE security_incidents
			SET updated_at = ?
			WHERE id = ?
		`).run('2000-01-01 00:00:00', incidentId);

		const updated = updateSecurityIncident(
			database,
			incidentId,
			'resolved',
			'Bot successfully left the guild',
		);
		const incident = database.prepare(`
			SELECT incident_status, details, updated_at
			FROM security_incidents
			WHERE id = ?
		`).get(incidentId);

		assert.equal(updated, true);
		assert.ok(incident);
		assert.deepEqual(
			{
				incident_status: incident.incident_status,
				details: incident.details,
			},
			{
				incident_status: 'resolved',
				details: 'Bot successfully left the guild',
			},
		);
		assert.notEqual(incident.updated_at, '2000-01-01 00:00:00');
	}
	finally {
		database.close();
	}
});

test('updateSecurityIncident accepts null details', () => {
	const database = openDatabase(':memory:');

	try {
		const incidentId = createIncident(database);

		const updated = updateSecurityIncident(
			database,
			incidentId,
			'failed',
			null,
		);
		const incident = database.prepare(`
			SELECT incident_status, details
			FROM security_incidents
			WHERE id = ?
		`).get(incidentId);

		assert.equal(updated, true);
		assert.ok(incident);
		assert.equal(incident.incident_status, 'failed');
		assert.equal(incident.details, null);
	}
	finally {
		database.close();
	}
});

test('updateSecurityIncident preserves the notification status', () => {
	const database = openDatabase(':memory:');

	try {
		const incidentId = createIncident(database);

		assert.equal(
			updateSecurityIncident(
				database,
				incidentId,
				'resolved',
				'Incident resolved',
			),
			true,
		);
		const incident = database.prepare(`
			SELECT incident_status, notification_status
			FROM security_incidents
			WHERE id = ?
		`).get(incidentId);

		assert.ok(incident);
		assert.equal(incident.incident_status, 'resolved');
		assert.equal(incident.notification_status, 'pending');
	}
	finally {
		database.close();
	}
});

test('updateSecurityIncident returns false when the incident does not exist', () => {
	const database = openDatabase(':memory:');

	try {
		assert.equal(
			updateSecurityIncident(database, 999, 'resolved', 'Not found'),
			false,
		);
	}
	finally {
		database.close();
	}
});

test('updateSecurityIncident propagates invalid status constraints', () => {
	const database = openDatabase(':memory:');

	try {
		const incidentId = createIncident(database);

		assert.throws(
			() => updateSecurityIncident(
				database,
				incidentId,
				// @ts-expect-error Deliberately exercise the SQLite constraint.
				'ignored',
				'Invalid update',
			),
			{
				code: 'ERR_SQLITE_ERROR',
				errcode: 275,
			},
		);
		const incident = database.prepare(`
			SELECT incident_status, details
			FROM security_incidents
			WHERE id = ?
		`).get(incidentId);

		assert.ok(incident);
		assert.equal(incident.incident_status, 'open');
		assert.equal(incident.details, 'Initial details');
	}
	finally {
		database.close();
	}
});
