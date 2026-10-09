const { REST, Routes } = require('discord.js');
const { clientId, guildId, token } = require('./config.json');

const rest = new REST().setToken(token);

if (process.argv.length < 4) {
    console.log('Expected command type (guild or global) and the commandId(s)');
    return;
}

for (let i = 3; i < process.argv.length; i++) {
    if (process.argv[2] == 'guild')
    {
        rest
        .delete(
            Routes.applicationGuildCommand(
                clientId,
                guildId,
                process.argv[i]
            )
        )
        .then(
            () => console.log('Successfully deleted guild command')
        )
        .catch(console.error);
    } else {
        rest
        .delete(
            Routes.applicationCommand(
            clientId,
            process.argv[i]
            )
        )
        .then(
            () => console.log('Successfully delete global application command')
        )
        .catch(console.error);
    }
}