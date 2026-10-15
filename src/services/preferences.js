const enablePingMonitoring = require('../storage/enablePingMonitoring');

function createPreferencesService(database) {
	return function preferences(command, guildId, userId) {
		switch (command) {
		case 'enable':
			console.log(`✅ Enable Ping Notifications for ${userId} in ${guildId}`);
			enablePingMonitoring(database, command, guildId, userId);
			break;
		case 'disable':
			console.log(`❌ Disable Ping Notifications for ${userId} in ${guildId}`);
			// TODO: disablePingMonitoring(database, command, guildId, userId)
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
