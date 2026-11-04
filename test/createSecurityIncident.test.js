const { test } = require('node:test');
const assert = require('node:assert/strict');

const createSecurityIncident = require('../src/storage/createSecurityIncident');
const openDatabase = require('../src/storage/database');

test('createSecurityIncident persists an incident with default statuses', () => {
	const database = openDatabase(':memory:');

	try {
		const incidentId = createSecurityIncident(
			database,
			'guild-123',
			'Unauthorised guild usage',
			'critical',
			'Ready detected activity outside the allowlist',
			'Bot detected in guild',
		);
		const incident = database.prepare(`
			SELECT *
			FROM security_incidents
			WHERE id = ?
		`).get(incidentId);

		assert.equal(incidentId, 1);
		assert.ok(incident);
		assert.equal(incident.id, incidentId);
		assert.equal(incident.guild_id, 'guild-123');
		assert.equal(incident.category, 'Unauthorised guild usage');
		assert.equal(incident.severity, 'critical');
		assert.equal(
			incident.description,
			'Ready detected activity outside the allowlist',
		);
		assert.equal(incident.incident_status, 'open');
		assert.equal(incident.details, 'Bot detected in guild');
		assert.equal(incident.notification_status, 'pending');
		assert.equal(typeof incident.created_at, 'string');
		assert.equal(typeof incident.updated_at, 'string');
	}
	finally {
		database.close();
	}
});

test('createSecurityIncident accepts null fields and custom statuses', () => {
	const database = openDatabase(':memory:');

	try {
		const incidentId = createSecurityIncident(
			database,
			null,
			'Notification delivery',
			'warning',
			'Notification could not be delivered',
			null,
			{
				incidentStatus: 'failed',
				notificationStatus: 'failed',
			},
		);
		const incident = database.prepare(`
			SELECT guild_id, incident_status, details, notification_status
			FROM security_incidents
			WHERE id = ?
		`).get(incidentId);

		assert.ok(incident);
		assert.deepEqual({ ...incident }, {
			guild_id: null,
			incident_status: 'failed',
			details: null,
			notification_status: 'failed',
		});
	}
	finally {
		database.close();
	}
});

test('createSecurityIncident returns a distinct ID for each incident', () => {
	const database = openDatabase(':memory:');

	try {
		const firstId = createSecurityIncident(
			database,
			'guild-123',
			'First incident',
			'info',
			'First description',
			null,
		);
		const secondId = createSecurityIncident(
			database,
			'guild-123',
			'Second incident',
			'warning',
			'Second description',
			null,
		);

		assert.equal(firstId, 1);
		assert.equal(secondId, 2);
		assert.equal(
			database.prepare('SELECT COUNT(*) AS count FROM security_incidents')
				.get()?.count,
			2,
		);
	}
	finally {
		database.close();
	}
});

test('createSecurityIncident propagates schema constraint failures', () => {
	const database = openDatabase(':memory:');

	try {
		assert.throws(
			() => createSecurityIncident(
				database,
				'guild-123',
				'Invalid incident',
				// @ts-expect-error Deliberately exercise the SQLite constraint.
				'emergency',
				'Invalid severity',
				null,
			),
			{
				code: 'ERR_SQLITE_ERROR',
				errcode: 275,
			},
		);
		assert.equal(
			database.prepare('SELECT COUNT(*) AS count FROM security_incidents')
				.get()?.count,
			0,
		);
	}
	finally {
		database.close();
	}
});
