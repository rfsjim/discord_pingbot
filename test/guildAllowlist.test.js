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

test('guildAllowlist authorises an allowed guild without leaving it', async (testContext) => {
	const leave = testContext.mock.fn(async () => undefined);
	const log = testContext.mock.method(console, 'log', () => undefined);
	const error = testContext.mock.method(console, 'error', () => undefined);
	const guild = createGuild('allowed-guild', 'Allowed Guild', leave);

	const authorised = await enforceGuildAllowlist(guild, ['allowed-guild']);

	assert.strictEqual(authorised, true);
	assert.strictEqual(leave.mock.callCount(), 0);
	assert.strictEqual(log.mock.callCount(), 0);
	assert.strictEqual(error.mock.callCount(), 0);
});

test('guildAllowlist leaves an unauthorised guild', async (testContext) => {
	const leave = testContext.mock.fn(async () => undefined);
	const log = testContext.mock.method(console, 'log', () => undefined);
	const error = testContext.mock.method(console, 'error', () => undefined);
	const guild = createGuild(
		'unauthorised-guild',
		'Unauthorised Guild',
		leave,
	);

	const authorised = await enforceGuildAllowlist(guild, ['allowed-guild']);

	assert.strictEqual(authorised, false);
	assert.strictEqual(leave.mock.callCount(), 1);
	assert.deepStrictEqual(error.mock.calls[0].arguments, [
		'UNAUTHORISED GUILD: unauthorised-guild',
	]);
	assert.deepStrictEqual(log.mock.calls[0].arguments, [
		'Left unauthorised guild: Unauthorised Guild unauthorised-guild',
	]);
	assert.strictEqual(log.mock.callCount(), 1);
	assert.strictEqual(error.mock.callCount(), 1);
});

test('guildAllowlist leaves a guild when the allowlist is empty', async (testContext) => {
	const leave = testContext.mock.fn(async () => undefined);
	const log = testContext.mock.method(console, 'log', () => undefined);
	const error = testContext.mock.method(console, 'error', () => undefined);
	const guild = createGuild(
		'any-guild',
		'Any Guild',
		leave,
	);

	const authorised = await enforceGuildAllowlist(guild, []);

	assert.strictEqual(authorised, false);
	assert.strictEqual(leave.mock.callCount(), 1);
	assert.deepStrictEqual(error.mock.calls[0].arguments, [
		'UNAUTHORISED GUILD: any-guild',
	]);
	assert.deepStrictEqual(log.mock.calls[0].arguments, [
		'Left unauthorised guild: Any Guild any-guild',
	]);
	assert.strictEqual(log.mock.callCount(), 1);
	assert.strictEqual(error.mock.callCount(), 1);
});

test('guildAllowlist reports a failure to leave an unauthorised guild', async (testContext) => {
	const leaveFailure = new Error('Missing permissions');
	const leave = testContext.mock.fn(async () => {
		throw leaveFailure;
	});
	const log = testContext.mock.method(console, 'log', () => undefined);
	const error = testContext.mock.method(console, 'error', () => undefined);
	const guild = createGuild(
		'unauthorised-guild',
		'Unauthorised Guild',
		leave,
	);

	const authorised = await enforceGuildAllowlist(guild, []);

	assert.strictEqual(authorised, false);
	assert.strictEqual(leave.mock.callCount(), 1);
	assert.strictEqual(log.mock.callCount(), 0);
	assert.deepStrictEqual(error.mock.calls[0].arguments, [
		'UNAUTHORISED GUILD: unauthorised-guild',
	]);
	assert.deepStrictEqual(error.mock.calls[1].arguments, [
		'FAILED to leave unauthorised guild: unauthorised-guild',
		leaveFailure,
	]);
	assert.strictEqual(error.mock.callCount(), 2);
});
