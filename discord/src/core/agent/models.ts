import OpenAI from "openai";

/**
 * From agent perspective, a user is a party in a conversation.
 * It can be a human or a bot.
 */
export interface User {
  id: string;
  name: string;
  isBot: boolean;
}

export interface ConversationMessage {
  user?: User;
  timestamp: Date;
  messageParam: OpenAI.ChatCompletionMessageParam;
}

export interface NewCompletionEventPayload {
  language: string | undefined;
  messageParam: OpenAI.ChatCompletionMessage;
  conversation: ConversationMessage[];
}
