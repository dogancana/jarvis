import { createClient } from "@deepgram/sdk";
import { createAudioResource, StreamType } from "@discordjs/voice";
import fs from "fs";
import { config } from "../platform";

const client = createClient(config.DEEPGRAM_API_KEY);

const languageMap: { [key: string]: string } = {
  "en-US": "en",
  en: "en",
  // TODO tr not available
  // "tr-TR": "tr",
  // tr: "tr",
};

export async function audioFileToText(path: string) {
  const { result, error } = await client.listen.prerecorded.transcribeFile(
    fs.readFileSync(path),
    {
      model: "nova-2",
      detect_language: true,
      smart_format: true,
    },
  );

  if (error) throw error;
  return result;
}

export async function textToSpeech(text: string, language: string) {
  const lang = languageMap[language] ?? "en";

  const response = await client.speak.request(
    { text },
    {
      model: `aura-luna-${lang}`,
      encoding: "opus",
      container: "ogg",
      bit_rate: 64000,
    },
  );

  if (!response.result) throw new Error("Deepgrapm failed text-to-speech");
  const stream = await response.getStream();

  return {
    resource: createAudioResource(stream, {
      inputType: StreamType.OggOpus,
    }),
    clear: () => {},
  };
}
