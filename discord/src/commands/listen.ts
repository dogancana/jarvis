import { joinVoiceChannel } from "@discordjs/voice";
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
    return interaction.reply("You must be in a voice channel.");

  const connection = joinVoiceChannel({
    selfDeaf: false,
    selfMute: false,
    channelId: voiceChannel.id,
    guildId: voiceChannel.guild.id,
    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
  });
  process.on("SIGINT", () => connection.destroy());
  process.on("SIGTERM", () => connection.destroy());

  await interaction.followUp(
    "Joined voice channel! Will start listening shortly.",
  );

  const orchestrator = mustGetOrchestrator(voiceChannel);
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
