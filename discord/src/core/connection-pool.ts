import { VoiceChannelOrchestrator } from "./voice-channel-orchestrator";
import { VoiceBasedChannel } from "discord.js";

const orchestrators = new Map<string, VoiceChannelOrchestrator>();

export function mustGetOrchestrator(channel: VoiceBasedChannel) {
  const key = getKey(channel);
  let orchestrator = orchestrators.get(key);
  if (!orchestrator) {
    orchestrator = new VoiceChannelOrchestrator(channel);
    orchestrators.set(key, orchestrator);
  }
  return orchestrator;
}

function getKey(channel: VoiceBasedChannel) {
  return `${channel.guild.id}_${channel.id}`;
}
