import {
  createAudioPlayer,
  joinVoiceChannel,
  NoSubscriberBehavior,
  VoiceConnection,
} from "@discordjs/voice";
import { Events, VoiceBasedChannel } from "discord.js";
import { createWriteStream, unlink, WriteStream } from "node:fs";
import { logger } from "../platform";
import { audioFileToText } from "../services/deepgram";
import { createListeningStream } from "../utils/listening";
import { Agent } from "./agent";
import { AgentEvent } from "./agent/constants";
import {
  MusicFunction,
  VoiceChannelManagementFunction,
  WebSearchFunction,
} from "./agent/tools";
import { talk } from "./speech";

interface Member {
  id: string;
  name: string;
  isBot: boolean;
}

interface ListeningTo {
  stream: NodeJS.WritableStream;
  filename: string;
}

const K = 1000;
const BYTE_MIN_LIMIT = 7 * K;
export class VoiceChannelOrchestrator {
  private connection: VoiceConnection;
  private listening = false;
  private listeningTo = new Map<string, ListeningTo>();
  private completionInProgress = false;
  private members: Member[] = [];
  private agent: Agent;
  private player = createAudioPlayer({
    behaviors: {
      noSubscriber: NoSubscriberBehavior.Play,
      maxMissedFrames: 2,
    },
  });
  private musicTool: MusicFunction;
  private channelTool: VoiceChannelManagementFunction;

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

    this.musicTool = new MusicFunction(this.connection, this.player);
    this.channelTool = new VoiceChannelManagementFunction(channel);
    this.agent = new Agent(`${channel.guildId}_${channel.id}`, [
      // this.musicTool,
      this.channelTool,
      new WebSearchFunction(),
    ]);

    this.subscribeToAgent();
    this.subscribeToChannelState();
  }

  public listen() {
    if (this.listening) return;
    this.listening = true;

    try {
      const receiver = this.connection.receiver;

      receiver.speaking.on("start", async (userId) => {
        logger.debug("User started speaking", {
          userId,
          listeningTo: !!this.listeningTo.get(userId),
        });

        if (this.listeningTo.has(userId)) return;
        const filename = `./recordings/${Date.now()}-${this.channel.guildId}_${userId}.ogg`;
        const out = createWriteStream(filename);

        out.on("finish", async (error?: unknown) => {
          this.onRecordingEnd(filename, out, userId, error);
        });

        try {
          const stream = createListeningStream(receiver, userId, out);
          this.listeningTo.set(userId, { filename, stream });
        } catch (e) {
          logger.error("Error starting listening stream", e);
        }
      });

      this.connection.on("stateChange", async (_, newState) => {
        logger.debug(`Connection state changed to ${newState.status}`);
      });
    } catch (error) {
      this.connection.destroy();
      throw error;
    }
  }

  private async onRecordingEnd(
    filename: string,
    self: WriteStream,
    userId: string,
    error?: unknown,
  ) {
    logger.debug("Finished writing audio file", { filename, error });

    if (self.bytesWritten < BYTE_MIN_LIMIT) {
      logger.debug("Audio file too short", { filename });
    } else {
      await this.addConversationMessage(filename, userId);
      await this.completionCycle();
    }

    unlink(filename, (error) => {
      if (error) logger.error("Error deleting audio file", { filename, error });
    });

    const listeningTo = this.listeningTo.get(userId);
    if (!listeningTo) return;
    listeningTo.stream.end();
    this.listeningTo.delete(userId);
  }

  private async addConversationMessage(filename: string, userId: string) {
    const { results } = await audioFileToText(filename);
    const transcript = results.channels?.[0]?.alternatives?.[0]?.transcript;
    if (!transcript) return;

    const user = this.members.find((member) => member.id === userId);
    if (!user) {
      logger.error("No user data while processing recording", {
        filename,
        userId,
      });
      return;
    }

    logger.info("Adding user message to conversation", {
      name: user.name,
      text: transcript,
    });
    this.agent.addUserMessage(transcript, {
      id: user.id,
      name: user.name,
      isBot: false,
    });
  }

  private async completionCycle() {
    if (this.completionInProgress) return;
    this.completionInProgress = true;

    try {
      await this.agent.completion();
    } catch (e) {
      logger.error(e);
    } finally {
      this.completionInProgress = false;
    }
  }

  private subscribeToAgent() {
    this.agent.subscribe(AgentEvent.NewCompletion, async (payload) => {
      const { messageParam, language } = payload;
      const text = messageParam?.content;
      if (!text) return;

      logger.info("Talking", { text, language });
      talk(text, language ?? "en-US", this.connection, this.player);
    });
  }

  private subscribeToChannelState() {
    this.channel.client.on(Events.VoiceStateUpdate, async (_, newState) => {
      if (newState.channelId !== this.channel.id) return;
      const members = newState.channel?.members;
      const users = members?.map((member) => ({
        id: member.user.id,
        name: member.nickname || member.user.globalName || member.user.username,
        isBot: member.user.bot,
      }));
      this.members = users ?? [];
    });
  }

  private destroy() {
    this.connection.destroy();
  }
}
