import { createClient } from "@deepgram/sdk";
import fs from "fs";
import { config } from "../platform";

const client = createClient(config.DEEPGRAM_API_KEY);

export async function transcribeFile(path: string) {
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

export async function speak(text: string) {
  const response = await client.speak.request(
    { text },
    { model: "aura-zeus-en", encoding: "opus" },
  );

  return response.result;
}
