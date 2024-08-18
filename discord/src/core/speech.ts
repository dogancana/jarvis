import { AudioPlayer, VoiceConnection } from "@discordjs/voice";
import { textToSpeech } from "../services/deepgram";
// import { textToSpeech } from "../services/elevenlabs";

export async function talk(
  text: string,
  language: string,
  connection: VoiceConnection,
  player: AudioPlayer,
) {
  const { resource, clear } = await textToSpeech(text, language);

  player.play(resource);

  player.on("stateChange", (_, newState) => {
    if (newState.status === "idle") {
      clear();
    }
  });

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
