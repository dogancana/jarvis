import { OpenAI } from "openai";

export interface Tool extends OpenAI.FunctionDefinition {
  function(parameters: Record<string, unknown>): Promise<string>;
  context(): Promise<string>;
}
