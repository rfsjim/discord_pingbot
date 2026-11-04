const { test } = require('node:test');
const assert = require('node:assert/strict');

const enforceGuildAllowlist = require('../src/services/guildAllowlist');

/**
 * @param {string} id
 * @param {string} name
 * @param {() => Promise<void>} leave
 * @returns {import('discord.js').Guild}
 */
function createGuild(id, name, leave) {
	const guild = {
		id,
		name,
		leave,
	};

	// @ts-expect-error Tests only need the Guild members used by the service.
	return guild;
}

/**
 * @param {(guildId: string, incidentType: string, reportSource: string) => number | null} logNewSecurityIncident
 * @param {(incidentId: number, updatedIncidentStatus: 'open'|'resolved'|'failed', updatedDetails: string) => boolean} updateExistingSecurityIncident
 * @returns {ReturnType<typeof import('../src/services/incidentReporting')>}
 */
function createIncidentReporting(logNewSecurityIncident, updateExistingSecurityIncident) {
	return { logNewSecurityIncident, updateExistingSecurityIncident };
}

test('guildAllowlist authorises an allowed guild without leaving it', async (testContext) => {
	const leave = testContext.mock.fn(async () => undefined);
	const logIncident = testContext.mock.fn(() => null);
	const updateIncident = testContext.mock.fn(() => false);
	const incidentReporting = createIncidentReporting(logIncident, updateIncident);
	const log = testContext.mock.method(console, 'log', () => undefined);
	const error = testContext.mock.method(console, 'error', () => undefined);
	const warn = testContext.mock.method(console, 'warn', () => undefined);
	const guild = createGuild('allowed-guild', 'Allowed Guild', leave);

	const authorised = await enforceGuildAllowlist(
		guild,
		['allowed-guild'],
		incidentReporting,
		'Ready',
	);

	assert.strictEqual(authorised, true);
	assert.strictEqual(leave.mock.callCount(), 0);
	assert.strictEqual(logIncident.mock.callCount(), 0);
	assert.strictEqual(updateIncident.mock.callCount(), 0);
	assert.strictEqual(log.mock.callCount(), 0);
	assert.strictEqual(error.mock.callCount(), 0);
	assert.strictEqual(warn.mock.callCount(), 0);
});

test('guildAllowlist leaves an unauthorised guild', async (testContext) => {
	const leave = testContext.mock.fn(async () => undefined);
	const logIncident = testContext.mock.fn(() => 42);
	const updateIncident = testContext.mock.fn(() => true);
	const incidentReporting = createIncidentReporting(logIncident, updateIncident);
	const log = testContext.mock.method(console, 'log', () => undefined);
	const error = testContext.mock.method(console, 'error', () => undefined);
	const warn = testContext.mock.method(console, 'warn', () => undefined);
	const guild = createGuild(
		'unauthorised-guild',
		'Unauthorised Guild',
		leave,
	);

	const authorised = await enforceGuildAllowlist(
		guild,
		['allowed-guild'],
		incidentReporting,
		'GuildCreate',
	);

	assert.strictEqual(authorised, false);
	assert.strictEqual(leave.mock.callCount(), 1);
	assert.deepStrictEqual(logIncident.mock.calls[0].arguments, [
		'unauthorised-guild',
		'unauthorisedGuild',
		'GuildCreate',
	]);
	assert.strictEqual(logIncident.mock.callCount(), 1);
	assert.deepStrictEqual(updateIncident.mock.calls[0].arguments, [
		42,
		'resolved',
		'Left unauthorised guild',
	]);
	assert.strictEqual(updateIncident.mock.callCount(), 1);
	assert.deepStrictEqual(error.mock.calls[0].arguments, [
		'UNAUTHORISED GUILD: unauthorised-guild',
	]);
	assert.deepStrictEqual(log.mock.calls[0].arguments, [
		'Left unauthorised guild: Unauthorised Guild unauthorised-guild',
	]);
	assert.strictEqual(log.mock.callCount(), 1);
	assert.strictEqual(error.mock.callCount(), 1);
	assert.strictEqual(warn.mock.callCount(), 0);
});

test('guildAllowlist leaves a guild when the allowlist is empty', async (testContext) => {
	const leave = testContext.mock.fn(async () => undefined);
	const logIncident = testContext.mock.fn(() => 43);
	const updateIncident = testContext.mock.fn(() => true);
	const incidentReporting = createIncidentReporting(logIncident, updateIncident);
	const log = testContext.mock.method(console, 'log', () => undefined);
	const error = testContext.mock.method(console, 'error', () => undefined);
	const warn = testContext.mock.method(console, 'warn', () => undefined);
	const guild = createGuild(
		'any-guild',
		'Any Guild',
		leave,
	);

	const authorised = await enforceGuildAllowlist(
		guild,
		[],
		incidentReporting,
		'Ready',
	);

	assert.strictEqual(authorised, false);
	assert.strictEqual(leave.mock.callCount(), 1);
	assert.deepStrictEqual(logIncident.mock.calls[0].arguments, [
		'any-guild',
		'unauthorisedGuild',
		'Ready',
	]);
	assert.strictEqual(logIncident.mock.callCount(), 1);
	assert.deepStrictEqual(updateIncident.mock.calls[0].arguments, [
		43,
		'resolved',
		'Left unauthorised guild',
	]);
	assert.strictEqual(updateIncident.mock.callCount(), 1);
	assert.deepStrictEqual(error.mock.calls[0].arguments, [
		'UNAUTHORISED GUILD: any-guild',
	]);
	assert.deepStrictEqual(log.mock.calls[0].arguments, [
		'Left unauthorised guild: Any Guild any-guild',
	]);
	assert.strictEqual(log.mock.callCount(), 1);
	assert.strictEqual(error.mock.callCount(), 1);
	assert.strictEqual(warn.mock.callCount(), 0);
});

test('guildAllowlist reports a failure to leave an unauthorised guild', async (testContext) => {
	const leaveFailure = new Error('Missing permissions');
	const leave = testContext.mock.fn(async () => {
		throw leaveFailure;
	});
	const logIncident = testContext.mock.fn(() => 44);
	const updateIncident = testContext.mock.fn(() => true);
	const incidentReporting = createIncidentReporting(logIncident, updateIncident);
	const log = testContext.mock.method(console, 'log', () => undefined);
	const error = testContext.mock.method(console, 'error', () => undefined);
	const warn = testContext.mock.method(console, 'warn', () => undefined);
	const guild = createGuild(
		'unauthorised-guild',
		'Unauthorised Guild',
		leave,
	);

	const authorised = await enforceGuildAllowlist(
		guild,
		[],
		incidentReporting,
		'GuildCreate',
	);

	assert.strictEqual(authorised, false);
	assert.strictEqual(leave.mock.callCount(), 1);
	assert.deepStrictEqual(logIncident.mock.calls[0].arguments, [
		'unauthorised-guild',
		'unauthorisedGuild',
		'GuildCreate',
	]);
	assert.strictEqual(logIncident.mock.callCount(), 1);
	assert.deepStrictEqual(updateIncident.mock.calls[0].arguments, [
		44,
		'failed',
		'FAILED to leave unauthorised guild',
	]);
	assert.strictEqual(updateIncident.mock.callCount(), 1);
	assert.strictEqual(log.mock.callCount(), 0);
	assert.deepStrictEqual(error.mock.calls[0].arguments, [
		'UNAUTHORISED GUILD: unauthorised-guild',
	]);
	assert.deepStrictEqual(error.mock.calls[1].arguments, [
		'FAILED to leave unauthorised guild: unauthorised-guild',
		leaveFailure,
	]);
	assert.strictEqual(error.mock.callCount(), 2);
	assert.strictEqual(warn.mock.callCount(), 0);
});

test('guildAllowlist still leaves when incident creation fails', async (testContext) => {
	const incidentFailure = new Error('Database unavailable');
	const leave = testContext.mock.fn(async () => undefined);
	const logIncident = testContext.mock.fn(() => {
		throw incidentFailure;
	});
	const updateIncident = testContext.mock.fn(() => true);
	const incidentReporting = createIncidentReporting(logIncident, updateIncident);
	const log = testContext.mock.method(console, 'log', () => undefined);
	const error = testContext.mock.method(console, 'error', () => undefined);
	const warn = testContext.mock.method(console, 'warn', () => undefined);
	const guild = createGuild('unauthorised-guild', 'Unauthorised Guild', leave);

	const authorised = await enforceGuildAllowlist(
		guild,
		[],
		incidentReporting,
		'Ready',
	);

	assert.strictEqual(authorised, false);
	assert.strictEqual(leave.mock.callCount(), 1);
	assert.strictEqual(updateIncident.mock.callCount(), 0);
	assert.deepStrictEqual(error.mock.calls[1].arguments, [
		'FAILED to create new incident from Ready',
		incidentFailure,
	]);
	assert.deepStrictEqual(warn.mock.calls[0].arguments, [
		'Unable to update incident: no report was created',
	]);
	assert.strictEqual(log.mock.callCount(), 1);
});

test('guildAllowlist warns when an incident cannot be updated', async (testContext) => {
	const leave = testContext.mock.fn(async () => undefined);
	const logIncident = testContext.mock.fn(() => 45);
	const updateIncident = testContext.mock.fn(() => false);
	const incidentReporting = createIncidentReporting(logIncident, updateIncident);
	testContext.mock.method(console, 'log', () => undefined);
	testContext.mock.method(console, 'error', () => undefined);
	const warn = testContext.mock.method(console, 'warn', () => undefined);
	const guild = createGuild('unauthorised-guild', 'Unauthorised Guild', leave);

	const authorised = await enforceGuildAllowlist(
		guild,
		[],
		incidentReporting,
		'GuildCreate',
	);

	assert.strictEqual(authorised, false);
	assert.deepStrictEqual(warn.mock.calls[0].arguments, [
		'Unable to update incident 45',
	]);
	assert.strictEqual(warn.mock.callCount(), 1);
});

test('guildAllowlist contains incident update failures', async (testContext) => {
	const updateFailure = new Error('Database unavailable');
	const leave = testContext.mock.fn(async () => undefined);
	const logIncident = testContext.mock.fn(() => 46);
	const updateIncident = testContext.mock.fn(() => {
		throw updateFailure;
	});
	const incidentReporting = createIncidentReporting(logIncident, updateIncident);
	testContext.mock.method(console, 'log', () => undefined);
	const error = testContext.mock.method(console, 'error', () => undefined);
	const warn = testContext.mock.method(console, 'warn', () => undefined);
	const guild = createGuild('unauthorised-guild', 'Unauthorised Guild', leave);

	const authorised = await enforceGuildAllowlist(
		guild,
		[],
		incidentReporting,
		'GuildCreate',
	);

	assert.strictEqual(authorised, false);
	assert.deepStrictEqual(error.mock.calls[1].arguments, [
		'FAILED to update incident 46',
		updateFailure,
	]);
	assert.strictEqual(error.mock.callCount(), 2);
	assert.strictEqual(warn.mock.callCount(), 0);
});

test('guildAllowlist contains departure and incident update failures', async (testContext) => {
	const departureFailure = new Error('Missing permissions');
	const updateFailure = new Error('Database unavailable');
	const leave = testContext.mock.fn(async () => {
		throw departureFailure;
	});
	const logIncident = testContext.mock.fn(() => 47);
	const updateIncident = testContext.mock.fn(() => {
		throw updateFailure;
	});
	const incidentReporting = createIncidentReporting(logIncident, updateIncident);
	const log = testContext.mock.method(console, 'log', () => undefined);
	const error = testContext.mock.method(console, 'error', () => undefined);
	const warn = testContext.mock.method(console, 'warn', () => undefined);
	const guild = createGuild('unauthorised-guild', 'Unauthorised Guild', leave);

	const authorised = await enforceGuildAllowlist(
		guild,
		[],
		incidentReporting,
		'GuildCreate',
	);

	assert.strictEqual(authorised, false);
	assert.strictEqual(leave.mock.callCount(), 1);
	assert.deepStrictEqual(updateIncident.mock.calls[0].arguments, [
		47,
		'failed',
		'FAILED to leave unauthorised guild',
	]);
	assert.deepStrictEqual(error.mock.calls[1].arguments, [
		'FAILED to leave unauthorised guild: unauthorised-guild',
		departureFailure,
	]);
	assert.deepStrictEqual(error.mock.calls[2].arguments, [
		'FAILED to update incident 47',
		updateFailure,
	]);
	assert.strictEqual(error.mock.callCount(), 3);
	assert.strictEqual(log.mock.callCount(), 0);
	assert.strictEqual(warn.mock.callCount(), 0);

	assert.deepStrictEqual(logIncident.mock.calls[0].arguments, [
		'unauthorised-guild',
		'unauthorisedGuild',
		'GuildCreate',
	]);
});
