const { test } = require('node:test');
const assert = require('node:assert/strict');

const openDatabase = require('../src/storage/database');
const createIncidentReportingService = require('../src/services/incidentReporting');

test('incidentReporting records unauthorised guild incidents', () => {
	const database = openDatabase(':memory:');
	const incidentReporting = createIncidentReportingService(
		database,
		['allowed-guild'],
	);

	try {
		const incidentId = incidentReporting.logNewSecurityIncident(
			'unauthorised-guild',
			'unauthorisedGuild',
			'GuildCreate',
		);
		const incident = database.prepare(`
			SELECT guild_id, category, severity, description, details
			FROM security_incidents
			WHERE id = ?
		`).get(incidentId);

		assert.equal(incidentId, 1);
		assert.ok(incident);
		assert.deepEqual({ ...incident }, {
			guild_id: 'unauthorised-guild',
			category: 'Unauthorised guild usage',
			severity: 'critical',
			description: 'GuildCreate detected activity from a guild outside the allowlist',
			details: 'Bot detected in guild',
		});
	}
	finally {
		database.close();
	}
});

test('incidentReporting ignores incidents from an allowed guild', () => {
	const database = openDatabase(':memory:');
	const incidentReporting = createIncidentReportingService(
		database,
		['allowed-guild'],
	);

	try {
		assert.equal(
			incidentReporting.logNewSecurityIncident(
				'allowed-guild',
				'unauthorisedGuild',
				'Ready',
			),
			null,
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

test('incidentReporting ignores unsupported incident types', () => {
	const database = openDatabase(':memory:');
	const incidentReporting = createIncidentReportingService(database, []);

	try {
		assert.equal(
			incidentReporting.logNewSecurityIncident(
				'unauthorised-guild',
				'unknownIncident',
				'Ready',
			),
			null,
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

test('incidentReporting updates an existing incident', () => {
	const database = openDatabase(':memory:');
	const incidentReporting = createIncidentReportingService(database, []);

	try {
		const incidentId = incidentReporting.logNewSecurityIncident(
			'unauthorised-guild',
			'unauthorisedGuild',
			'Ready',
		);

		if (incidentId === null) {
			assert.fail('Expected an incident report to be created');
		}
		assert.equal(
			incidentReporting.updateExistingSecurityIncident(
				incidentId,
				'resolved',
				'Left unauthorised guild',
			),
			true,
		);
		const incident = database.prepare(`
			SELECT incident_status, details, notification_status
			FROM security_incidents
			WHERE id = ?
		`).get(incidentId);

		assert.ok(incident);
		assert.deepEqual({ ...incident }, {
			incident_status: 'resolved',
			details: 'Left unauthorised guild',
			notification_status: 'pending',
		});
	}
	finally {
		database.close();
	}
});

test('incidentReporting returns false when updating a missing incident', () => {
	const database = openDatabase(':memory:');
	const incidentReporting = createIncidentReportingService(database, []);

	try {
		assert.equal(
			incidentReporting.updateExistingSecurityIncident(
				999,
				'failed',
				'Incident not found',
			),
			false,
		);
	}
	finally {
		database.close();
	}
});
