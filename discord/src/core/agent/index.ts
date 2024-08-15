import OpenAI from "openai";
import { config, logger } from "../../platform";
import { ConversationMessage, NewCompletionEventPayload, User } from "./models";
import { sytemPrompt } from "./system";
import { EventBus, Publisher } from "../../utils/pub-sub";
import { AgentEvent } from "./constants";
import { writeFileContent } from "../../utils/files";
import { format } from "date-fns";

interface AgentConfig {
  limit: number;
}

const model = "gpt-4o-mini";
const openai = new OpenAI({ apiKey: config.OPENAI_API_KEY });

export class Agent {
  private conversation: ConversationMessage[] = [];
  private eventBus = new EventBus();
  private publisher = new Publisher(this.eventBus);

  constructor(
    private id: string,
    private config?: AgentConfig,
  ) {}

  public addUserMessage(text: string, user: User) {
    this.conversation.push({
      user,
      timestamp: new Date(),
      messageParam: {
        role: "user",
        content: text,
        name: `${user.name} (${user.id})`,
      },
    });
  }

  public subscribe(
    topic: AgentEvent.NewCompletion,
    callback: (payload: NewCompletionEventPayload) => void,
  ): void;

  public subscribe(topic: AgentEvent, callback: (message: any) => void): void {
    this.eventBus.subscribe(topic, callback);
  }

  public async completion() {
    try {
      const response = await openai.chat.completions.create({
        model,
        messages: this.prepareConversation(),
        temperature: 0,
        max_tokens: 1000,
        stream: false,
      });

      const tmp = format(new Date(), "YYYY-MM-dd_HH");
      writeFileContent(
        `./conversations/${tmp}_${this.id}.json`,
        JSON.stringify(this.conversation, null, 2),
      );

      const messageParam = response.choices[0]?.message;
      if (!messageParam) return;
      this.conversation.push({ timestamp: new Date(), messageParam });

      const payload: NewCompletionEventPayload = {
        messageParam,
        conversation: this.conversation,
      };
      this.publisher.publish(AgentEvent.NewCompletion, payload);
    } catch (e) {
      logger.error("Completion error", e);
      this.conversation.push({
        timestamp: new Date(),
        messageParam: {
          role: "system",
          content: "There was a problem. I couldn't respond.",
        },
      });
    }
  }

  private prepareConversation() {
    const limit = Math.min(this.config?.limit ?? 50, 200);
    return [
      this.getSystemPrompt(),
      ...this.conversation.slice(-limit).map((message) => message.messageParam),
    ];
  }

  private getSystemPrompt(): OpenAI.ChatCompletionSystemMessageParam {
    return {
      role: "system",
      content: sytemPrompt,
    };
  }
}
