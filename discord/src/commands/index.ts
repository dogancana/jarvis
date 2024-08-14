import { ping } from "./ping";
import { listen } from "./listen";

export const commands = {
  ping,
  listen,
} as const;
