const getPingMonitoring = require('../storage/getPingMonitoring');
const setPingMonitoring = require('../storage/setPingMonitoring');
const setCustomMessage = require('../storage/setCustomMessage');
const setMessageVisibility = require('../storage/setMessageVisibility');
const setCustomCooldown = require('../storage/setCustomCooldown');

const ENABLED = 1;
const DISABLED = 0;

/**
 * Factory for preference functions
 * @param {import('node:sqlite').Database} database
 */
module.exports = function createPreferencesService(database) {
	return {
		/**
		 * Select ping monitoring status
		 *
		 * @param {string} guildId
		 * @param {string} userId
		 * @param {'enable' | 'disable'} action
		 * @returns {string}
		 */
		setMonitoring(guildId, userId, action) {
			switch (action) {
			case 'enable':
				setPingMonitoring(database, guildId, userId, ENABLED);
				break;
			case 'disable':
				setPingMonitoring(database, guildId, userId, DISABLED);
				break;
			default:
				throw new Error(`Unhandled command ${action}`);
			}

			return `${action} ping notification`;
		},
		/**
		 * Get Monitoring Status
		 * @param {string} guildId
		 * @param {string} userId
		 * @returns {string}
		 */
		getMonitoringStatus(guildId, userId) {
			const isEnabled = getPingMonitoring(database, guildId, userId);
			return isEnabled
				? 'Ping Notifications are enabled'
				: 'Ping Notifications are disabled';
		},
		/**
		 * Set a member's custom message
		 * @param {string} guildId
		 * @param {string} userId
		 * @param {string} message
		 * @returns {string}
		 */
		setMessage(guildId, userId, message) {
			const validatedMessage = validateCustomMessage(message);

			setCustomMessage(database, guildId, userId, validatedMessage);

			return `Set custom message to ${validatedMessage}`;
		},
		/**
		 * Reset a member's custom message
		 * @param {string} guildId
		 * @param {string} userId
		 * @returns {string}
		 */
		resetMessage(guildId, userId) {
			setCustomMessage(database, guildId, userId, null);

			return 'Reset your custom message';
		},
		/**
		 * Set member's custom message visibility
		 * @param {string} guildId
		 * @param {string} userId
		 * @param {'generic' | 'custom'} visibility
		 * @returns {string}
		 */
		setVisibility(guildId, userId, visibility) {
			setMessageVisibility(database, guildId, userId, visibility);

			return `Now showing the ${visibility} message`;
		},
		/**
		 * Set Custom Cooldown
		 * @param {string} guildId
		 * @param {string} userId
		 * @param {number} seconds
		 * @returns {string}
		 */
		setCooldown(guildId, userId, seconds) {
			if (Number.isInteger(seconds) && seconds >= 30 && seconds <= 3600) {
				setCustomCooldown(database, guildId, userId, seconds);

				const duration = seconds >= 60
					? `${seconds / 60} minute${seconds === 60 ? '' : 's'}`
					: `${seconds} seconds`;

				return `Cooldown is now ${duration}`;
			}
			else {
				throw new RangeError(
					`Cooldown of ${seconds} is incorrect it needs to be between 30 and 3600 seconds`,
				);
			}
		},
	};
};

/**
 * Validate Custom Message
 * @param {string} message
 * @returns {string}
 */
function validateCustomMessage(message) {
	if (typeof message !== 'string') {
		throw new TypeError('Custom message must be a string');
	}

	const cleaned = message.trim();

	if (cleaned.length === 0) {
		throw new RangeError('Custom message cannot be empty');
	}

	if (cleaned.length > 200) {
		throw new RangeError('Custom message exceeds 200 characters');
	}

	// eslint-disable-next-line no-control-regex -- Intentionally reject control characters in user input.
	if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u.test(cleaned)) {
		throw new RangeError('Custom message contains invalid control characters');
	}

	return cleaned;
}
