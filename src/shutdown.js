/*
 * TODO - Add db object as args once created
 */

module.exports = function registerShutdown(client, db) {
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
			process.exitCode = 1;
		}
	}

	process.once('SIGINT', shutdown);
	process.once('SIGTERM', shutdown);
};
