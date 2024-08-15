import { createAudioResource } from "@discordjs/voice";
import { ElevenLabs, ElevenLabsClient } from "elevenlabs";
import { createWriteStream, unlink } from "fs";
import { config, logger } from "../platform";

const client = new ElevenLabsClient({ apiKey: config.ELEVENLABS_API_KEY });

const en_male = "hQ12xvdbwzzYc5xTcaIY";
const tr_female = "mBUB5zYuPwfVE6DTcEjf";

const voices: { [key: string]: string } = {
  "tr-TR": tr_female,
  tr: tr_female,
  "en-US": en_male,
  en: en_male,
};

export async function textToSpeech(text: string, language: string) {
  const voice = voices[language] ?? en_male;

  const response = await client.textToSpeech.convert(voice, {
    optimize_streaming_latency: ElevenLabs.OptimizeStreamingLatency.Two,
    output_format: ElevenLabs.OutputFormat.Mp32205032,
    text,
    model_id: "eleven_turbo_v2",
  });

  const name = `./recordings/eleventh_${uuid()}.mp3`;

  const fs = createWriteStream(name);
  for await (const chunk of response) {
    fs.write(chunk);
  }
  fs.end();

  const resource = createAudioResource(name);

  return {
    resource,
    clear: () => {
      unlink(name, (err) => {
        if (err) logger.error(err);
      });
    },
  };
}

function uuid() {
  return "xxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
