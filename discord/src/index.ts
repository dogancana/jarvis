import { Client } from "discord.js";
import { deployCommands } from "./deploy-commands";
import { commands } from "./commands";
import { config, logger } from "./platform";

const client = new Client({
  intents: ["Guilds", "GuildMessages", "DirectMessages"],
});

client.once("ready", () => {
  logger.info("Jarvis is Ready!");
});

client.on("guildCreate", async (guild) => {
  logger.info(`Joined a new guild`, { guild });
  await deployCommands({ guildId: guild.id });
});

client.on("interactionCreate", async (interaction) => {
  logger.info(`Received interaction`, { interaction });

  if (!interaction.isCommand()) return;

  const { commandName } = interaction;
  if (commands[commandName as keyof typeof commands]) {
    commands[commandName as keyof typeof commands].execute(interaction);
  }
});

client.login(config.DISCORD_TOKEN);
