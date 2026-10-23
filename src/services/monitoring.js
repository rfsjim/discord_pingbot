const getPingMonitoring = require('../storage/getPingMonitoring');
const getCustomMessage = require('../storage/getCustomMessage');
const getMessageVisibility = require('../storage/getMessageVisibility');
const getCustomCooldown = require('../storage/getCustomCooldown');

/**
 * Creates Ping Preference Monitoring Services
 * @param {import('node:sqlite').Database} database
 */
function createMonitoringService(database) {
	return {
		/**
		 * Returns if the monitoring is enabled or disabled
		 * @param {string} guildId
		 * @param {string} userId
		 * @returns {boolean} Ping Monitoring Status
		 */
		isEnabled(guildId, userId) {
			return getPingMonitoring(
				database,
				guildId,
				userId,
			);
		},

		/**
		 * Returns custom message text
		 * @param {string} guildId
		 * @param {string} userId
		 * @returns {string|null} Custom Message
		 */
		getMessage(guildId, userId) {
			return getCustomMessage(database, guildId, userId);
		},

		/**
		 * Returns member's message visibility option
		 * @param {string} guildId
		 * @param {string} userId
		 * @returns {'generic'|'custom'|null}
		 */
		getVisibility(guildId, userId) {
			return getMessageVisibility(database, guildId, userId);
		},

		/**
		 * Returns member's custom cooldown in seconds
		 * @param {string} guildId
		 * @param {string} userId
		 * @returns {number|null}
		 */
		getCooldown(guildId, userId) {
			return getCustomCooldown(database, guildId, userId);
		},
	};
}

module.exports = createMonitoringService;
