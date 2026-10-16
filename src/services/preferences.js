const setPingMonitoring = require('../storage/setPingMonitoring');

function createPreferencesService(database) {
	return function preferences(command, guildId, userId) {
		const ENABLED = 1;
		const DISABLED = 0;

		switch (command) {
		case 'enable':
			console.log(`✅ Enable Ping Notifications for ${userId} in ${guildId}`);
			setPingMonitoring(database, guildId, userId, ENABLED);
			break;
		case 'disable':
			console.log(`❌ Disable Ping Notifications for ${userId} in ${guildId}`);
			setPingMonitoring(database, guildId, userId, DISABLED);
			break;
		case 'status':
			console.log(`🗒️ Display Ping Notification Status for ${userId} in ${guildId}`);
			// TODO: getPingMonitoringStatus(database, command, guildId, userId)
			break;
		default:
			throw new Error(`Unhandled command ${command}`);
		}

		return `${command} ping notification`;
	};
}

module.exports = createPreferencesService;
