import { OpenAI } from "openai";
import { Tool } from "./models";
import { saerch } from "../../../services/tavily";
import { logger } from "../../../platform";

export class WebSearchFunction implements Tool {
  name = "WebSearchFunction";
  description = `A tool for searching the web to answer various questions or to fetch up to date information.`;
  parameters: OpenAI.FunctionParameters = {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "The search query to use when searching the web.",
      },
    },
  };

  constructor() {}

  async function(parameters: Record<string, unknown>) {
    const keys = Object.keys(parameters);
    const query = keys[0];

    if (keys.length !== 1 || !query) {
      return "Please provide a search query.";
    }

    const value = parameters[query];
    return this.search(value as string);
  }

  async context() {
    return "";
  }

  private async search(query: string) {
    try {
      const response = await saerch(query);
      if (!response) return "No results found.";

      const { answer, results } = response;
      const str = results
        .map((r) => `Title: ${r.title}, URL: ${r.url}, Content: ${r.content}`)
        .join("\n");

      return `Search results for "${query}":
          Answer: ${answer}
          Results: ${str}
      `;
    } catch (e) {
      console.error(e);
      logger.error("Web search error", { e });
      return "There was a problem searching the web.";
    }
  }
}
