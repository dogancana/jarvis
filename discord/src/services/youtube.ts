import { config } from "../platform";

const BASE_URL = "https://www.googleapis.com/youtube/v3";
const CREDS = `key=${config.YOUTUBE_API_KEY}`;

interface Thumbnail {
  url: string;
  width: number;
  height: number;
}

interface Snippet {
  publishedAt: Date;
  channelId: string;
  title: string;
  description: string;
  channelTitle: string;
  liveBroadcastContent: string;
  thumbnails: {
    default: Thumbnail;
    medium: Thumbnail;
    high: Thumbnail;
  };
}

interface SearchItem {
  kind: string;
  etag: string;
  id: {
    kind: string;
    videoId: string;
  };
  snippet: Snippet;
}

export async function search(query: string) {
  const q = encodeURIComponent(query);

  const endpoint = `${BASE_URL}/search?${CREDS}&type=video&part=snippet&q=${q}`;
  try {
    const response = await fetch(endpoint);
    const data = (await response.json()) as { items: SearchItem[] };
    return data.items.map((item) => ({
      ...item,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    }));
  } catch (error) {
    console.error(error);
    return [];
  }
}
