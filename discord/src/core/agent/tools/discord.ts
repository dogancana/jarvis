import { VoiceBasedChannel } from "discord.js";
import { OpenAI } from "openai";
import { Tool } from "./models";

export class VoiceChannelManagementFunction implements Tool {
  name = "VoiceChannelManagementFunction";
  description = `A tool for managing the current voice channel.
    It can kick, disconnect, mute and deafen membembers in the voice channel.
    It can only accept one command at a time. Each command has a different parameter.`;
  parameters: OpenAI.FunctionParameters = {
    type: "object",
    properties: {
      kick: {
        type: "string",
        description: "The id of the member to kick.",
      },
      mute: {
        type: "string",
        description: "The id of the member to mute.",
      },
      deafen: {
        type: "string",
        description: "The id of the member to deafen.",
      },
    },
  };

  constructor(private channel: VoiceBasedChannel) {}

  async function(parameters: Record<string, unknown>) {
    const keys = Object.keys(parameters);
    const command = keys[0];

    if (keys.length !== 1 || !command) {
      return "Please provide only one command at a time.";
    }

    const value = parameters[command];

    switch (command) {
      case "kick":
        return this.kick(value as string);
      case "mute":
        return this.mute(value as string);
      case "deafen":
        return this.deafen(value as string);
      default:
        return "Unknown command.";
    }
  }

  public async context() {
    return `
    - You are currently managing the voice channel: ${this.channel.name}.
    - The members in the channel are: ${this.channel.members
      .map((m) =>
        [
          `Name: ${m.user.username}`,
          `ID: ${m.id}`,
          `Nick Name: ${m.nickname}`,
          `Global Name: ${m.user.globalName}`,
        ].join(", "),
      )
      .join("\n")}
    ])`;
  }

  private async kick(userId: string) {
    const member = this.channel.members.get(userId);
    if (!member) return "Member not found.";

    member.edit({ channel: null });
    return "Member kicked.";
  }

  private async mute(userId: string) {
    const member = this.channel.members.get(userId);
    if (!member) return "Member not found.";

    member.voice?.setMute(true);
    return "Member muted.";
  }

  private async deafen(userId: string) {
    const member = this.channel.members.get(userId);
    if (!member) return "Member not found.";

    member.voice?.setDeaf(true);
    return "Member deafened.";
  }
}
