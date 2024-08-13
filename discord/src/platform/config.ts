export const config = {
  DISCORD_TOKEN: process.env.DISCORD_TOKEN ?? "",
  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID ?? "",
} as const;

validate();

function validate() {
  if (!config.DISCORD_TOKEN || !config.DISCORD_CLIENT_ID) {
    throw new Error("Missing environment variables");
  }
}
