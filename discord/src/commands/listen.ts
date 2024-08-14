import { entersState, joinVoiceChannel } from "@discordjs/voice";
import {
  CommandInteraction,
  GuildMember,
  SlashCommandBuilder,
} from "discord.js";
import { processRecording } from "../core/listener";
import { logger } from "../platform";
import { createListeningStream } from "../utils/listening";

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

  try {
    // await entersState(connection, VoiceConnectionStatus.Ready, 20e3);
    // const receiver = connection.receiver;

    // receiver.speaking.on("start", (userId) => {
    //   logger.info(`Listening to ${userId}`);
    //   createListeningStream(receiver, userId, guildMember.user);
    // });

    const listening = new Set<string>();

    connection.receiver.speaking.on("start", async (userId) => {
      if (listening.has(userId)) return;
      listening.add(userId);
      logger.info(`Listening to ${userId}`);
      try {
        const filename = await createListeningStream(
          connection.receiver,
          userId,
          guildMember.user,
        );
        processRecording(filename);
      } catch (e) {}
    });

    connection.receiver.speaking.on("end", (userId) => {
      listening.delete(userId);
    });

    connection.on("stateChange", async (_, newState) => {
      logger.info(`Connection state changed to ${newState.status}`);
    });
  } catch (error) {
    logger.error("Failed to join voice channel", error);
    console.error(error);
    await interaction.followUp(
      "Failed to join voice channel within 20 seconds, please try again later!",
    );

    connection.destroy();
  }

  return interaction.followUp("Listening...");
}

export const listen = { data, execute };
