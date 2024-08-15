import {
  createAudioPlayer,
  createAudioResource,
  NoSubscriberBehavior,
  StreamType,
  VoiceConnection,
} from "@discordjs/voice";
import { textToSpeech } from "../services/deepgram";

const player = createAudioPlayer({
  behaviors: {
    noSubscriber: NoSubscriberBehavior.Play,
    maxMissedFrames: 20,
  },
});

export async function talk(text: string, connection: VoiceConnection) {
  const result = await textToSpeech(text);
  const stream = await result?.getStream();

  if (!stream) throw new Error("Failed to get speech stream");

  const resource = createAudioResource(stream as any, {
    inputType: StreamType.OggOpus,
  });

  player.play(resource);

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

  return connection.subscribe(player);
}
