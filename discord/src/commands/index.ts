import { ping } from "./ping";
import { listen } from "./listen";
import { deploy } from "./deploy";

export const commands = {
  ping,
  listen,
  deploy,
} as const;
