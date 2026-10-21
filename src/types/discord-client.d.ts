import type {
	ChatInputCommandInteraction,
	Collection,
	SlashCommandBuilder,
} from 'discord.js';

declare module 'discord.js' {
	interface Client {
		commands: Collection<string, ChatInputCommand>;
		commandPaths: Collection<string, string>;
		cooldowns: Collection<string, Collection<string, number>>;
	}
}

interface ChatInputCommand {
	data: SlashCommandBuilder;
	execute(interaction: ChatInputCommandInteraction): Promise<void>;
	/** Command-specific cooldown duration in seconds. */
	cooldown?: number;
}
