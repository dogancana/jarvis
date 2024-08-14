import {
  AudioPlayerStatus,
  AudioResource,
  createAudioPlayer,
  entersState,
  NoSubscriberBehavior,
} from "@discordjs/voice";
import { pipeline, Readable } from "node:stream";
import { logger } from "../platform";
import { speak, transcribeFile } from "../services/deepgram";
import { completion } from "../services/openai";

const player = createAudioPlayer({
  behaviors: {
    noSubscriber: NoSubscriberBehavior.Play,
    maxMissedFrames: 10,
  },
});

export async function processRecording(path: string) {
  try {
    const { results } = await transcribeFile(path);
    const transcript = results.channels?.[0]?.alternatives?.[0]?.transcript;
    logger.info(`Transcript`, { transcript });
    if (!transcript) return;

    const response = await completion(transcript);
    logger.info(`Response`, { response });
    if (!response) return;

    const result = await speak(response);
    if (!result?.body) return;

    const readables: Readable[] = [];
    pipeline(result.body as any, readables as any, (error: unknown) => {
      if (error) {
        console.error(error);
      }
    });
    const audio = new AudioResource([], readables, { inlineVolume: true }, 2);

    player.play(audio);

    entersState(player, AudioPlayerStatus.Playing, 5000);
  } catch (e) {
    console.error(e);
    logger.error(e);
  }
}
