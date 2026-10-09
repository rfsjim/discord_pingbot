const { REST, Routes } = require('discord.js');
const { clientId, guildId, token } = require('./config.json');

const rest = new REST.setToken(token);

if (process.argv.length < 3) {
    console.log('Expected commands type (guild or global)');
    return;
} else {
    if (process.argv[2] == 'guild') {
        rest
            .put(Routes.applicationGuildCommands(
                clientId,
                guildId,
            ),
            { body: [] }
            )
            .then(
                () => console.log('Successfully deleted all guild commands')
            )
            .error(console.error);
            
    } else {
        rest
            .put(Routes.applicationCommands(
                clientId),
                { body: [] }
            )
            .then(
                () => console.log('Successfully deleted all global application commands')
            )
            .error(console.error)
    }
}