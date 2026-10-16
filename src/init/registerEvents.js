const fs = require('node:fs');
const path = require('node:path');

module.exports = function registerEvents(client, context) {
	const eventsPath = path.join(__dirname, 'events');
	const eventsFiles = fs
		.readdirSync(eventsPath)
		.filter(
			(file) => file.endsWith('.js'),
		);

	for (const file of eventsFiles) {
		const filePath = path.join(eventsPath, file);
		const createEvent = require(filePath);
		const event = createEvent(context);

		const listener = (...args) => event.execute(...args);

		if (event.once) {
			client.once(event.name, listener);
		}
		else {
			client.on(event.name, listener);
		}
	}
};
