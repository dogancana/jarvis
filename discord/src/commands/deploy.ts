import { CommandInteraction, SlashCommandBuilder } from "discord.js";

const data = new SlashCommandBuilder()
  .setName("deploy")
  .setDescription("Syncs commands with the server.");

function execute(interaction: CommandInteraction) {
  return interaction.reply("Deployed!");
}

export const deploy = { data, execute };
