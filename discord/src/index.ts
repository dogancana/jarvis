import { generateDependencyReport } from "@discordjs/voice";
import { Client, Events, GatewayIntentBits } from "discord.js";
import { commands } from "./commands";
import { deployCommands } from "./deploy-commands";
import { config, logger } from "./platform";
import { clearRecordings } from "./utils/recordings";

clearRecordings();

logger.info("Starting Jarvis...", generateDependencyReport());

const client = new Client({
  intents: [
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.Guilds,
  ],
});

client.once(Events.ClientReady, () => {
  logger.info("Jarvis is Ready!");
});

client.on(Events.GuildCreate, async (guild) => {
  logger.info(`Joined a new guild`, { guild });
  await deployCommands({ guildId: guild.id });
});

client.on(Events.InteractionCreate, async (interaction) => {
  logger.info(`Received interaction`, {
    guild: interaction.guild?.name ?? interaction.guildId,
    user: interaction.user.username,
    command: interaction.isCommand() ? interaction.commandName : null,
  });

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
