import {
  AudioPlayer,
  createAudioResource,
  VoiceConnection,
} from "@discordjs/voice";
import { OpenAI } from "openai";
import { stream } from "play-dl";
import { search } from "../../../services/youtube";
import { Tool } from "./models";

export class MusicFunction implements Tool {
  name = "MusicFunction";
  description = `A tool for searching, playing, and managing music. 
  It can search for music, play a song, pause, resume, skip, add to queue, clear queue, and set volume.
  It can only accept one command at a time. Each command has a different parameter.`;
  parameters: OpenAI.FunctionParameters = {
    type: "object",
    properties: {
      search: {
        type: "string",
        description: "The search query to use when searching for music.",
      },
      play: {
        type: "string",
        description: "The url of the song to play.",
      },
      pause: {
        type: "boolean",
        description: "Whether to pause the current song.",
      },
      resume: {
        type: "boolean",
        description: "Whether to resume the current song.",
      },
      skip: {
        type: "boolean",
        description: "Whether to skip the current song.",
      },
      queue: {
        type: "string",
        description: "The name of the song to add to the queue.",
      },
      clear: {
        type: "boolean",
        description: "Whether to clear the queue.",
      },
      volume: {
        type: "number",
        description: "The volume to set the music player to.",
      },
    },
  };

  constructor(
    private connection: VoiceConnection,
    private player: AudioPlayer,
  ) {}

  async function(parameters: Record<string, unknown>) {
    // Implement the music tool here.

    const keys = Object.keys(parameters);
    const command = keys[0];

    if (keys.length !== 1 || !command) {
      return "Please provide only one command at a time.";
    }

    const value = parameters[command];

    switch (command) {
      case "search":
        return this.search(value as string);
      case "play":
        return this.play(value as string);
      case "pause":
        return this.pause();
      case "resume":
        return "Resumed the current song";
      case "skip":
        return "Skipped the current song";
      case "queue":
        return `Added ${value} to the queue`;
      case "clear":
        return "Cleared the queue";
      case "volume":
        return `Set the volume to ${value}`;
      default:
        return `Command ${command} not recognized`;
    }
  }

  async context() {
    return ``;
  }

  private async search(query: string) {
    const results = await search(query);
    return results.length > 0
      ? `Found ${results.length} results for ${query}: ${results
          .map((r) =>
            [
              `Title: ${r.snippet.title}`,
              `URL: ${r.url}`,
              `Description: ${r.snippet.description}`,
            ].join(", "),
          )
          .join("'n")}`
      : `No results found for ${query}`;
  }

  private async play(url: string) {
    const result = await stream(url, { discordPlayerCompatibility: true });
    const resource = createAudioResource(result.stream, {
      inputType: result.type,
    });

    this.player.play(resource);
    this.connection.subscribe(this.player);
    return `Playing the song with url: ${url}`;
  }

  private async pause() {
    this.player.pause();
    return "Paused the current song";
  }
}
