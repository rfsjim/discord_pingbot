const { Events } = require('discord.js');

const gentleResponse = [
	'Gentle reminder: some members prefer not to be pinged unless necessary. Thanks for helping keep notifications manageable.',
	'Please be mindful when mentioning members, as some prefer fewer notifications. Thanks for understanding!',
];

const defaultCooldownSeconds = 360;

/**
 * Creates the Discord message-create event handler.
 *
 * @param {{
 *   monitoring: ReturnType<typeof import('../services/monitoring')>,
 *   now?: () => number,
 *   schedule?: (callback: () => void, delay: number) => { unref?: () => void }
 * }} context
 */
module.exports = function createMessageCreate({
	monitoring,
	now = Date.now,
	schedule = setTimeout,
}) {
	/** @type {Map<string, number>} */
	const cooldowns = new Map();

	return {
		name: Events.MessageCreate,
		/**
		 * Responds to guild messages received
		 * @param {import('discord.js').Message} message
		 */
		async execute(message) {
			if (message.author.bot || message.webhookId || !message.guild) return;
			if (message.mentions.everyone || message.mentions.roles.size > 0) return;
			if (!message.inGuild()) return;
			if (!message.channel.isSendable()) return;

			const protectedUsers = message.mentions.users.filter(
				(user) => monitoring.isEnabled(message.guildId, user.id),
			);

			if (protectedUsers.size === 0) return;

			const timestamp = now();
			const eligibleUsers = protectedUsers.filter((user) => {
				const expiresAt = cooldowns.get(`${message.guildId}:${user.id}`);
				return expiresAt === undefined || timestamp >= expiresAt;
			});

			if (eligibleUsers.size === 0) return;

			let response;
			let cooldownSeconds = defaultCooldownSeconds;

			if (protectedUsers.size === 1) {
				const protectedUser = protectedUsers.first();

				if (protectedUser) {
					const userId = protectedUser.id;
					cooldownSeconds = monitoring.getCooldown(
						message.guildId,
						userId,
					) ?? defaultCooldownSeconds;
					const customMessage = monitoring.getMessage(message.guildId, userId);

					if (customMessage !== null) {
						const visibility = monitoring.getVisibility(message.guildId, userId);

						if (visibility === 'custom') {
							response = customMessage;
						}
					}
				}
			}

			response ??= gentleResponse[
				Math.floor(Math.random() * gentleResponse.length)
			];
			const cooldownMilliseconds = cooldownSeconds * 1_000;
			/** @type {string[]} */
			const cooldownKeys = [];

			for (const user of eligibleUsers.values()) {
				const cooldownKey = `${message.guildId}:${user.id}`;
				cooldownKeys.push(cooldownKey);
				cooldowns.set(cooldownKey, timestamp + cooldownMilliseconds);
			}

			try {
				const reminder = await message.channel.send({
					content: response,
					allowedMentions : {
						parse: [],
						repliedUser: false,
					},
				});
				const timer = schedule(() => {
					for (const cooldownKey of cooldownKeys) {
						if (cooldowns.get(cooldownKey) === timestamp + cooldownMilliseconds) {
							cooldowns.delete(cooldownKey);
						}
					}

					reminder.delete().catch(console.error);
				}, cooldownMilliseconds);
				timer.unref?.();
			}
			catch (error) {
				for (const cooldownKey of cooldownKeys) {
					if (cooldowns.get(cooldownKey) === timestamp + cooldownMilliseconds) {
						cooldowns.delete(cooldownKey);
					}
				}
				console.error(error);
			}
		},
	};
};
