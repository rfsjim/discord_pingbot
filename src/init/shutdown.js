/**
 * Registers Shutdown Service
 * @typedef {Object} ShutdownProcess
 * @property {(signal: 'SIGINT' | 'SIGTERM', handler: () => void | Promise<void>) => unknown} once
 * @property {NodeJS.Process['exitCode']} exitCode
 * @param {Pick<import('discord.js').Client, 'destroy'>} client
 * @param {Pick<import('node:sqlite').Database, 'close'>} db
 * @param {ShutdownProcess} processRef
 */
module.exports = function registerShutdown(
	client,
	db,
	processRef = process,
) {
	let shuttingDown = false;

	/** @param {'SIGINT' | 'SIGTERM'} signal */
	async function shutdown(signal) {
		if (shuttingDown) return;
		shuttingDown = true;

		console.log(`\n🛑 Shutdown requested: ${signal}. Shutting down bot...`);

		try {
			await client.destroy();
			console.log('🤖 Discord client disconnected.');

			db.close();
			console.log('💾 Database connection closed.');

			console.log('✅ Shutdown complete.');
		}
		catch (error) {
			console.error('❌ Shutdown error: ', error);
			processRef.exitCode = 1;
		}
	}

	processRef.once('SIGINT', () => shutdown('SIGINT'));
	processRef.once('SIGTERM', () => shutdown('SIGTERM'));
};
