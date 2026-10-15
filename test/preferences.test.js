const { test } = require('node:test');
const assert = require('node:assert/strict');
const preferences = require('../src/services/preferences');

test (
	'parse and categorises the requested preferences',
	() => {
		const validResponses = {
			enable: 'enable ping notification',
			disable: 'disable ping notification',
			status: 'status ping notification',
		};

		for (const [command, expected] of Object.entries(validResponses)) {
			const actual = preferences(
				command,
				'123456789',
				'987654321',
			);

			assert.equal(
				actual,
				expected,
				`Unexpect response for ${command}`,
			);
		}
	},
);

test(
	'rejects nonexistent commands',
	() => {
		assert.throws(
			() => preferences(
				'disenable',
				'987654321',
				'123456789',
			),
			{
				name: 'Error',
				message: 'Unhandled command disenable',
			},
		);
	},
);
