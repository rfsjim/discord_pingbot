const { Client, Collection, GatewayIntentBits } = require('discord.js');

const config = require('./init/config');
const openDatabase = require('./storage/database');
const createPreferencesService = require('./services/preferences');
const createMonitoringService = require('./services/monitoring');

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
client.commandPaths = new Collection();
client.cooldowns = new Collection();

const context = {
	preferences: createPreferencesService(db),
	monitoring: createMonitoringService(db),
	developerIds: config.developerIds,
};

registerCommands(client, context);
registerEvents(client, context);
registerShutdown(client, db);

try {
	await client.login(config.token);
}
catch (error) {
	console.error('❌ Discord login failed: ', error);
	client.destroy();
	db.close();
	process.exitCode = 1;
}
