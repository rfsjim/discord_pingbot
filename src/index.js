const { Client, Collection, GatewayIntentBits } = require('discord.js');

const config = require('./init/config');
const openDatabase = require('./storage/database');
const createPreferencesService = require('./services/preferences');
// TODO: const createMonitoringService = require('./services/monitoring');

const registerCommands = require('./init/registerCommands');
const registerEvents = require('./init/registerEvents');
const registerShutdown = require('./init/shutdown');

const db = openDatabase(config.dbPath);

const client = new Client(
	{
		intents: [
			GatewayIntentBits.Guilds,
			GatewayIntentBits.GuildMessages,
		],
	},
);

client.commands = new Collection();
client.cooldowns = new Collection();

const context = {
	preferences: createPreferencesService(db),
	monitoring: createMonitoringService(db),
};

registerCommands(context, db);
registerEvents(context, db);
registerShutdown(client, db);

client.login(config.token);
