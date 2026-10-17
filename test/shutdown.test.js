const { test } = require('node:test');
const assert = require('node:assert/strict');
const registerShutdown = require('../src/init/shutdown');

test(
	'shutdown disconnects Discord and close SQLite',
	async () => {
		const calls = [];
		const handlers = new Map();

		const client = {
			destroy() {
				calls.push('discord');
			},
		};

		const database = {
			close() {
				calls.push('database');
			},
		};

		const fakeProcess = {
			once(signal, handler) {
				handlers.set(signal, handler);
			},
			exitCode: undefined,
		};

		registerShutdown(client, database, fakeProcess);

		assert.equal(handlers.has('SIGINT'), true);
		assert.equal(handlers.has('SIGTERM'), true);

		await handlers.get('SIGINT')('SIGINT');
		await handlers.get('SIGTERM')('SIGTERM');

		assert.deepEqual(
			calls,
			[
				'discord',
				'database',
			],
			'Shutdown did not release resources in order',
		);

		assert.equal(
			fakeProcess.exitCode,
			undefined,
			'Should exit without an exit code',
		);
	},
);
