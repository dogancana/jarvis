export const config = {
  DISCORD_TOKEN: process.env.DISCORD_TOKEN ?? "",
  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID ?? "",
  PICOVOICE_API_KEY: process.env.PICOVOICE_API_KEY ?? "",
  DEEPGRAM_API_KEY: process.env.DEEPGRAM_API_KEY ?? "",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "",
  ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY ?? "",
  YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY ?? "",
} as const;

validate();

function validate() {
  for (const [key, value] of Object.entries(config)) {
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
}
