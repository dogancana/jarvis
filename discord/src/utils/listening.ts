import { EndBehaviorType, VoiceReceiver } from "@discordjs/voice";
import type { User } from "discord.js";
import { createWriteStream } from "node:fs";
import { pipeline, Writable } from "node:stream";
import * as prism from "prism-media";
import { logger } from "../platform";
import fs from "fs";

const BYTE_MIN_LIMIT = 7000;
const BYTE_MAX_LIMIT = 200000;

export function createListeningStream(
  receiver: VoiceReceiver,
  userId: string,
  user?: User,
) {
  const opusStream = receiver.subscribe(userId, {
    end: {
      behavior: EndBehaviorType.AfterSilence,
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

  const filename = `./recordings/${Date.now()}-${getDisplayName(
    userId,
    user,
  )}.ogg`;

  const out = createWriteStream(filename);

  // Custom writable stream to monitor bytes written
  const byteLimiterStream = new Writable({
    write(chunk, encoding, callback) {
      if (out.bytesWritten + chunk.length > BYTE_MAX_LIMIT) {
        this.end(() => callback(new Error("Maximum byte limit reached")));
      } else {
        out.write(chunk, encoding, callback);
      }
    },
    final(callback) {
      out.end(callback);
    },
  });

  logger.info(`Started recording`, { filename });

  return new Promise<string>((resolve, reject) => {
    pipeline(
      opusStream,
      oggStream as any,
      byteLimiterStream as any,
      (error: unknown) => {
        if (error) return reject(error);

        if (out.bytesWritten < BYTE_MIN_LIMIT) fs.unlink(filename, () => {});
        else resolve(filename);
      },
    );
  });
}

function getDisplayName(userId: string, user?: User) {
  return user ? `${user.username}_${user.discriminator}` : userId;
}
