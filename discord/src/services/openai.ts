import OpenAI from "openai";
import { config } from "../platform";

const model = "gpt-4o-mini";
const openai = new OpenAI({
  apiKey: config.OPENAI_API_KEY,
});

export async function completion(messages: string[]) {
  const completion = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content: `
       You are roleplaying as a character in a voice channel. Your name is Jarvis.
       Many people are talking in the channel. You are receving their messages. Not all messages will be directed at you.
       You can respond to any message or ignore it. You can also send messages to the channel.
       If they ask you a question, respond in their language.
  
       You have a fun and sarcastic personality. Your personality is similar to the Jarvis in Iron Man series.
       You are a bot, but you are also a friend. Don't make jokes all the time, but don't be too serious either.
       Your answers are short and to the point.
      `,
      },
      ...messages.map((content) => ({
        role: "user" as "user",
        content,
      })),
    ],
    temperature: 0,
    max_tokens: 1000,
    stream: false,
  });

  return completion.choices[0]?.message.content;
}
