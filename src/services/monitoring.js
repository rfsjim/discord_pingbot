const getPingMonitoring = require('../storage/getPingMonitoring');

/**
 * Creates Ping Monitoring Services
 * @param {import('node:sqlite').Database} database
 */
function createMonitoringService(database) {
	/**
	 * Returns if the monitoring is enabled or disabled
	 * @param {string} guildId
	 * @param {string} userId
	 * @returns {boolean}
	*/
	return function isEnabled(guildId, userId) {
		return getPingMonitoring(
			database,
			guildId,
			userId,
		);
	};
}

module.exports = createMonitoringService;
