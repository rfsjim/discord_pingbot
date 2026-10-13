const fs = require('node:fs');
const path = require('node:path');

const requiredEnv = [
	'DISCORD_TOKEN',
	'DISCORD_CLIENT_ID',
	'DISCORD_GUILD_ID',
	'DATABASE_PATH',
];

requiredEnv.forEach(
	name => {
		if (!process.env[name]?.trim()) {
			throw new Error(`Missing required environment variable: ${name}`);
		}
	},
);

const config = {
	token: process.env.DISCORD_TOKEN,
	clientId: process.env.DISCORD_CLIENT_ID,
	guildId: process.env.DISCORD_GUILD_ID,
	dbPath: process.env.DATABASE_PATH,
	env: process.env.NODE_ENV,
};

if (config.dbPath !== ':memory:') {
	const projectRoot = path.resolve(__dirname, '..');
	const resolvedPath = path.isAbsolute(config.dbPath)
		? config.dbPath
		: path.resolve(projectRoot, config.dbPath);

	const dbDirectory = path.dirname(resolvedPath);

	if (
		!fs.existsSync(dbDirectory) ||
		!fs.statSync(dbDirectory).isDirectory()
	) {
		throw new Error(`Database directory does not exist: ${dbDirectory}`);
	}

	config.dbPath = resolvedPath;
}


module.exports = config;
