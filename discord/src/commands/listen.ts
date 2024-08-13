import { CommandInteraction, SlashCommandBuilder } from "discord.js";

const data = new SlashCommandBuilder()
  .setName("listen")
  .setDescription("Join a voice channel and start listening!");

async function execute(interaction: CommandInteraction) {
  await interaction.deferReply();

  const { member } = interaction;
  if (!member)
    return interaction.reply(
      "You must be in a voice channel to use this command."
    );

  return interaction.reply("Listening...");
}

export const listen = { data, execute };
