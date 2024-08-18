import { config } from "../platform";

const BASE_URL = "https://api.tavily.com/";

interface SearchResult {
  query: string;
  answer: string;
  results: {
    title: string;
    url: string;
    content: string;
    score: number;
  }[];
}

export async function saerch(query: string) {
  const result = await fetch(`${BASE_URL}search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, api_key: config.TAVILY_API_KEY }),
  });

  if (!result.ok) {
    throw new Error("Failed to fetch search results");
  }

  const data = (await result.json()) as SearchResult;
  return data;
}
