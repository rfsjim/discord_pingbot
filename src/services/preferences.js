const getPingMonitoring = require('../storage/getPingMonitoring');
const setPingMonitoring = require('../storage/setPingMonitoring');

function createPreferencesService(database) {
	return function preferences(command, guildId, userId) {
		const ENABLED = 1;
		const DISABLED = 0;
		let isEnabled;

		switch (command) {
		case 'enable':
			setPingMonitoring(database, guildId, userId, ENABLED);
			break;
		case 'disable':
			setPingMonitoring(database, guildId, userId, DISABLED);
			break;
		case 'status':
			isEnabled = getPingMonitoring(database, guildId, userId);
			return isEnabled === ENABLED
				? 'Ping Notifications are enabled'
				: 'Ping Notifications are disabled';
		default:
			throw new Error(`Unhandled command ${command}`);
		}

		return `${command} ping notification`;
	};
}

module.exports = createPreferencesService;
