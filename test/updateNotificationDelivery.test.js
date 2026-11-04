const { test } = require('node:test');
const assert = require('node:assert/strict');

const openDatabase = require('../src/storage/database');
const createSecurityIncident = require('../src/storage/createSecurityIncident');
const updateNotificationDelivery = require('../src/storage/updateNotificationDelivery');

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
		null,
	);
}

test('updateNotificationDelivery updates the notification status and timestamp', () => {
	const database = openDatabase(':memory:');

	try {
		const incidentId = createIncident(database);
		database.prepare(`
			UPDATE security_incidents
			SET updated_at = ?
			WHERE id = ?
		`).run('2000-01-01 00:00:00', incidentId);

		const updated = updateNotificationDelivery(
			database,
			incidentId,
			'sent',
		);
		const incident = database.prepare(`
			SELECT notification_status, updated_at
			FROM security_incidents
			WHERE id = ?
		`).get(incidentId);

		assert.equal(updated, true);
		assert.ok(incident);
		assert.equal(incident.notification_status, 'sent');
		assert.notEqual(incident.updated_at, '2000-01-01 00:00:00');
	}
	finally {
		database.close();
	}
});

test('updateNotificationDelivery can record a failed delivery', () => {
	const database = openDatabase(':memory:');

	try {
		const incidentId = createIncident(database);

		assert.equal(
			updateNotificationDelivery(database, incidentId, 'failed'),
			true,
		);
		assert.equal(
			database.prepare(`
				SELECT notification_status
				FROM security_incidents
				WHERE id = ?
			`).get(incidentId)?.notification_status,
			'failed',
		);
	}
	finally {
		database.close();
	}
});

test('updateNotificationDelivery preserves the incident status', () => {
	const database = openDatabase(':memory:');

	try {
		const incidentId = createIncident(database);

		assert.equal(
			updateNotificationDelivery(database, incidentId, 'sent'),
			true,
		);
		const incident = database.prepare(`
			SELECT notification_status, incident_status
			FROM security_incidents
			WHERE id = ?
		`).get(incidentId);

		assert.ok(incident);
		assert.equal(incident.notification_status, 'sent');
		assert.equal(incident.incident_status, 'open');
	}
	finally {
		database.close();
	}
});

test('updateNotificationDelivery returns false when the incident does not exist', () => {
	const database = openDatabase(':memory:');

	try {
		assert.equal(
			updateNotificationDelivery(database, 999, 'sent'),
			false,
		);
	}
	finally {
		database.close();
	}
});

test('updateNotificationDelivery propagates invalid status constraints', () => {
	const database = openDatabase(':memory:');

	try {
		const incidentId = createIncident(database);

		assert.throws(
			() => updateNotificationDelivery(
				database,
				incidentId,
				// @ts-expect-error Deliberately exercise the SQLite constraint.
				'skipped',
			),
			{
				code: 'ERR_SQLITE_ERROR',
				errcode: 275,
			},
		);
		assert.equal(
			database.prepare(`
				SELECT notification_status
				FROM security_incidents
				WHERE id = ?
			`).get(incidentId)?.notification_status,
			'pending',
		);
	}
	finally {
		database.close();
	}
});
