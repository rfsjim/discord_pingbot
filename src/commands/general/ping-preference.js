const { SlashCommandBuilder, MessageFlags } = require('discord.js');

/**
 * @typedef {ReturnType<typeof import('../../services/preferences')>} PreferencesWidget
 */

/**
 * @param {{ preferences: PreferencesWidget }} context
 */

module.exports = function createCommand({ preferences }) {
	return {
		data: new SlashCommandBuilder()
			.setName('ping-preference')
			.setDescription('Manage your ping notification preferences')
			.addSubcommand((subcommand) =>
				subcommand
					.setName('monitoring')
					.setDescription('Enable, disable, or check ping monitoring')
					.addStringOption((option) =>
						option
							.setName('action')
							.setDescription('What would you like to do?')
							.setRequired(true)
							.addChoices(
								{ name: 'Enable', value: 'enable' },
								{ name: 'Disable', value: 'disable' },
								{ name: 'Status', value: 'status' },
							),
					),
			)
			.addSubcommand((subcommand) =>
				subcommand
					.setName('message-set')
					.setDescription('Set your custom reminder message')
					.addStringOption((option) =>
						option
							.setName('message')
							.setDescription('Your custom reminder message')
							.setRequired(true)
							.setMaxLength(200),
					),
			)
			.addSubcommand((subcommand) =>
				subcommand
					.setName('message-reset')
					.setDescription('Restore the default reminder message'),
			)
			.addSubcommand((subcommand) =>
				subcommand
					.setName('visibility')
					.setDescription('Choose which reminder message is displayed')
					.addStringOption((option) =>
						option
							.setName('mode')
							.setDescription('Reminder message type')
							.setRequired(true)
							.addChoices(
								{ name: 'Generic', value: 'generic' },
								{ name: 'Custom', value: 'custom' },
							),
					),
			)
			.addSubcommand((subcommand) =>
				subcommand
					.setName('cooldown')
					.setDescription('Set your personal reminder cooldown')
					.addStringOption((option) =>
						option
							.setName('duration')
							.setDescription('Minimum time between reminders')
							.setRequired(true)
							.addChoices(
								{ name: '30 seconds', value: '30' },
								{ name: '1 minute', value: '60' },
								{ name: '2 minutes', value: '120' },
								{ name: '5 minutes', value: '300' },
								{ name: '10 minutes', value: '600' },
								{ name: '15 minutes', value: '900' },
								{ name: '30 minutes', value: '1800' },
								{ name: '60 minutes', value: '3600' },
							),
					),
			),
		/**
		 *
		 * @param {import('discord.js').ChatInputCommandInteraction} interaction
		 */
		async execute(interaction) {
			try {
				const subcommand = interaction.options.getSubcommand();
				const guildId = interaction.guildId;
				const userId = interaction.user.id;

				if (guildId === null) {
					throw new Error('Ping preferences are only available in servers');
				}

				let response;

				switch (subcommand) {
				case 'monitoring': {
					const action = interaction.options.getString('action', true);

					if (action === 'status') {
						response = await preferences.getMonitoringStatus(
							guildId,
							userId,
						);
					}
					else if (action === 'enable' || action === 'disable') {
						response = await preferences.setMonitoring(
							guildId,
							userId,
							action,
						);
					}
					else {
						throw new RangeError(`Invalid monitoring action: ${action}`);
					}
					break;
				}
				case 'message-set':
					response = await preferences.setMessage(
						guildId,
						userId,
						interaction.options.getString('message', true),
					);
					break;
				case 'message-reset':
					response = await preferences.resetMessage(
						guildId,
						userId,
					);
					break;
				case 'visibility': {
					const visibility = interaction.options.getString('mode', true);

					if (visibility !== 'generic' && visibility !== 'custom') {
						throw new RangeError(`Invalid visibility mode: ${visibility}`);
					}

					response = await preferences.setVisibility(
						guildId,
						userId,
						visibility,
					);
					break;
				}
				case 'cooldown': {
					const cooldown = Number(interaction.options.getString(
						'duration',
						true,
					));
					if (Number.isInteger(cooldown) && cooldown >= 30 && cooldown <= 3600) {
						response = await preferences.setCooldown(
							guildId,
							userId,
							cooldown,
						);
					}
					break;
				}
				default:
					throw new Error(`Unhandled command ${subcommand}`);
				}

				await interaction.reply({
					content: response,
					flags: MessageFlags.Ephemeral,
				});
			}
			catch (error) {
				console.error('Preference Command Failed: ', error);

				if (!interaction.replied && !interaction.deferred) {
					await interaction.reply({
						content: 'Unable to update your preferences',
						flags: MessageFlags.Ephemeral,
					});
				}
				else {
					await interaction.followUp({
						content: 'Unable to update your preferences',
						flags: MessageFlags.Ephemeral,
					});
				}
			}
		},
	};
};
