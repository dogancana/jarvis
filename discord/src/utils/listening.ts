import { EndBehaviorType, VoiceReceiver } from "@discordjs/voice";
import { pipeline, Writable } from "node:stream";
import * as prism from "prism-media";
import { PipelineDestination, PipelineSource, PipelineTransform } from "stream";
import { logger } from "../platform";

const K = 1000;
const BYTE_MIN_LIMIT = 7 * K;
const BYTE_MAX_LIMIT = 500 * K;

export function createListeningStream(
  receiver: VoiceReceiver,
  userId: string,
  out: Writable,
) {
  const opusStream = receiver.subscribe(userId, {
    end: {
      behavior: EndBehaviorType.AfterInactivity,
      duration: 1000,
    },
  });

  const oggStream = new prism.opus.OggLogicalBitstream({
    opusHead: new prism.opus.OpusHead({
      channelCount: 2,
      sampleRate: 48000,
    }),
    pageSizeControl: { maxPackets: 10 },
  });

  const source: PipelineSource<unknown> = opusStream;
  const transform: PipelineTransform<any, any> = oggStream as any;
  const destination: PipelineDestination<any, any> = out as any;

  return pipeline(source, transform, destination, (error: unknown) => {
    if (error) logger.error(error);

    if (!opusStream.destroyed) opusStream.destroy();
    if (!oggStream.destroyed) oggStream.destroy();
    if (!out.destroyed) out.destroy();
  });
}
