import { Client, Events } from "discord.js";
import { deployCommands } from "./deploy-commands";
import { commands } from "./commands";
import { config, logger } from "./platform";

const client = new Client({
  intents: ["Guilds", "GuildMessages", "DirectMessages"],
});

client.once(Events.ClientReady, () => {
  logger.info("Jarvis is Ready!");
});

client.on(Events.GuildCreate, async (guild) => {
  logger.info(`Joined a new guild`, { guild });
  await deployCommands({ guildId: guild.id });
});

client.on(Events.InteractionCreate, async (interaction) => {
  logger.info(`Received interaction`, interaction);

  if (!interaction.isCommand() || !interaction.guildId) return;

  const { commandName } = interaction;
  if (commands[commandName as keyof typeof commands]) {
    commands[commandName as keyof typeof commands].execute(interaction);
  }
});

client.on(Events.Error, (error) => {
  logger.error("Client error", error);
});

client.login(config.DISCORD_TOKEN);
