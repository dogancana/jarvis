import {
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  NoSubscriberBehavior,
  StreamType,
  VoiceConnection,
} from "@discordjs/voice";
import { VoiceBasedChannel } from "discord.js";
import { logger } from "../platform";
import { audioFileToText, textToSpeech } from "../services/deepgram";
import { completion } from "../services/openai";
import { createListeningStream } from "../utils/listening";
import { writeFileContent } from "../utils/files";

const player = createAudioPlayer({
  behaviors: {
    noSubscriber: NoSubscriberBehavior.Play,
    maxMissedFrames: 10,
  },
});

interface ConversationMessage {
  text: string;
  user: string;
  timestamp: number;
}

export class VoiceChannelOrchestrator {
  private connection: VoiceConnection;
  private listening = false;
  private listeningTo = new Set<string>();
  private conversation: ConversationMessage[] = [];
  private completionInProgress = false;

  constructor(private channel: VoiceBasedChannel) {
    this.connection = joinVoiceChannel({
      selfDeaf: false,
      selfMute: false,
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
    });
    process.on("SIGINT", () => this.destroy());
    process.on("SIGTERM", () => this.destroy());
  }

  public listen() {
    if (this.listening) return;
    this.listening = true;

    try {
      const receiver = this.connection.receiver;

      receiver.speaking.on("start", async (userId) => {
        if (this.listeningTo.has(userId)) return;
        this.listeningTo.add(userId);
        try {
          const filename = await createListeningStream(
            receiver,
            this.channel.guildId,
            userId,
          );
          if (!filename) return;

          await this.addConversationMessage(filename, userId);
          await this.completionCycle();
        } catch (e) {
          console.error(e);
        }
      });

      receiver.speaking.on("end", (userId) => {
        this.listeningTo.delete(userId);
      });

      this.connection.on("stateChange", async (_, newState) => {
        logger.info(`Connection state changed to ${newState.status}`);
      });
    } catch (error) {
      this.connection.destroy();
      throw error;
    }
  }

  private async addConversationMessage(filename: string, user: string) {
    const { results } = await audioFileToText(filename);
    const transcript = results.channels?.[0]?.alternatives?.[0]?.transcript;
    if (!transcript) return;

    const message: ConversationMessage = {
      text: transcript,
      user,
      timestamp: Date.now(),
    };
    logger.info("Adding conversation message", { message: message.text });
    this.conversation.push(message);

    writeFileContent(
      `./conversations/${this.channel.guildId}-${this.channel.id}.json`,
      JSON.stringify(this.conversation, null, 2),
    );
  }

  private async completionCycle() {
    if (this.completionInProgress) return;
    this.completionInProgress = true;

    try {
      const messages = this.conversation.map((message) => message.text);
      const response = await completion(messages);
      if (!response) return;

      const result = await textToSpeech(response);
      if (!result) return;

      logger.info("Talking", { response });
      await this.talk(response);
    } catch (e) {
      console.error(e);
      logger.error(e);
    } finally {
      this.completionInProgress = false;
    }
  }

  private async talk(text: string) {
    try {
      const result = await textToSpeech(text);
      if (!result) return;

      const stream = await result.getStream();

      const resource = createAudioResource(stream, {
        inputType: StreamType.OggOpus,
      });

      player.play(resource);

      this.connection.subscribe(player);

      // player.on(AudioPlayerStatus.Playing, () => {
      //   console.log("The audio player has started playing!");
      // });

      // player.on(AudioPlayerStatus.Idle, () => {
      //   console.log("The audio player is idle.");
      //   player.stop(); // Stop the player after the stream ends
      // });

      // player.on("error", (error) => {
      //   console.error("Error:", error.message);
      // });
    } catch (e) {
      console.error(e);
      logger.error(e);
    }
  }

  private destroy() {
    this.connection.destroy();
  }
}