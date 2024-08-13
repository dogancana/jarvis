import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream";
import { EndBehaviorType, VoiceReceiver } from "@discordjs/voice";
import type { User } from "discord.js";
import * as prism from "prism-media";
import { logger } from "../platform";

export function createListeningStream(
  receiver: VoiceReceiver,
  userId: string,
  user?: User
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
    pageSizeControl: {
      maxPackets: 10,
    },
  });

  const filename = `./recordings/${Date.now()}-${getDisplayName(
    userId,
    user
  )}.ogg`;

  const out = createWriteStream(filename);

  logger.info(`Started recording`, { filename });

  // TODO check types
  pipeline(
    opusStream as any,
    oggStream as any,
    out as any,
    (error: unknown) => {
      if (error) {
        logger.error(`Error recording file`, { filename, error });
      } else {
        logger.info(`Recorded`, { filename });
      }
    }
  );
}

function getDisplayName(userId: string, user?: User) {
  return user ? `${user.username}_${user.discriminator}` : userId;
}
