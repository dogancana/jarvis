import {
  CommandInteraction,
  GuildMember,
  SlashCommandBuilder,
} from "discord.js";
import { mustGetOrchestrator } from "../core/connection-pool";

const data = new SlashCommandBuilder()
  .setName("listen")
  .setDescription("Join a voice channel and start listening!");

async function execute(interaction: CommandInteraction) {
  await interaction.deferReply();

  const { member } = interaction;
  const guildMember = member instanceof GuildMember ? member : null;
  const voiceChannel = guildMember?.voice.channel;

  if (!voiceChannel)
    return interaction.followUp("You must be in a voice channel.");

  const orchestrator = mustGetOrchestrator(voiceChannel);
  await interaction.followUp(
    "Joined voice channel! Will start listening shortly.",
  );

  try {
    orchestrator.listen();
  } catch (error) {
    await interaction.followUp(
      "Failed to join voice channel within 20 seconds, please try again later!",
    );
  }

  return interaction.followUp("Listening...");
}

export const listen = { data, execute };
