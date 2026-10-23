const { test } = require('node:test');
const assert = require('node:assert/strict');
const registerShutdown = require('../src/init/shutdown');

test(
	'shutdown disconnects Discord and close SQLite',
	async () => {
		/** @type {string[]} */
		const calls = [];
		/** @type {Map<'SIGINT' | 'SIGTERM', () => void | Promise<void>>} */
		const handlers = new Map();

		const client = {
			async destroy() {
				calls.push('discord');
			},
		};

		const database = {
			close() {
				calls.push('database');
			},
		};

		const fakeProcess = {
			/**
			 * @param {'SIGINT'|'SIGTERM'} signal
			 * @param {() => void | Promise<void>} handler
			 */
			once(signal, handler) {
				handlers.set(signal, handler);
			},
			exitCode: undefined,
		};

		registerShutdown(client, database, fakeProcess);

		assert.equal(handlers.has('SIGINT'), true);
		assert.equal(handlers.has('SIGTERM'), true);

		const sigintHandler = handlers.get('SIGINT');
		const sigtermHandler = handlers.get('SIGTERM');

		assert.ok(sigintHandler, 'SIGINT handler was not registered');
		assert.ok(sigtermHandler, 'SIGTERM handler was not registered');

		await sigintHandler();
		await sigtermHandler();

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
