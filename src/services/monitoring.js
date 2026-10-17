const getPingMonitoring = require('../storage/getPingMonitoring');
const ENABLED = 1;

function createMonitoringService(database) {
	return function isEnabled(guildId, userId) {
		return getPingMonitoring(
			database,
			guildId,
			userId,
		) === ENABLED;
	};
}

module.exports = createMonitoringService;
