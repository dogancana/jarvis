import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { deployCommands } from "../deploy-commands";
import { logger } from "../platform";

const data = new SlashCommandBuilder()
  .setName("deploy")
  .setDescription("Deploy commands to the server");

async function execute(interaction: CommandInteraction) {
  const guildId = interaction.guildId;
  if (!guildId) return interaction.reply("Cannot deploy here");

  try {
    await deployCommands({ guildId });
  } catch (error) {
    logger.error("Failed to deploy commands", error);
    return interaction.reply("Failed to deploy commands");
  }
  return interaction.reply("Deployed!");
}

export const deploy = { data, execute };
