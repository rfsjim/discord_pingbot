module.exports = function preferences(command, guildId, userId) {
	switch (command) {
	case 'enable':
		console.log(`✅ Enable Ping Notifications for ${userId} in ${guildId}`);
		break;
	case 'disable':
		console.log(`❌ Disable Ping Notifications for ${userId} in ${guildId}`);
		break;
	case 'status':
		console.log(`🗒️ Display Ping Notification Status for ${userId} in ${guildId}`);
		break;
	default:
		throw new Error(`Unhandled command ${command}`);
	}

	return `${command} ping notification`;
};
