/**
 * Registers Shutdown Service
 * @param {import('discord.js').Client<boolean>} client
 * @param {import('node:sqlite').Database} db
 * @param {NodeJS.Process} processRef
 */
module.exports = function registerShutdown(
	client,
	db,
	processRef = process,
) {
	let shuttingDown = false;

	async function shutdown(signal) {
		if (shuttingDown) return;
		shuttingDown = true;

		console.log(`\n🛑 Shutdown requested: ${signal}. Shutting down bot...`);

		try {
			client.destroy();
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

	processRef.once('SIGINT', shutdown);
	processRef.once('SIGTERM', shutdown);
};
