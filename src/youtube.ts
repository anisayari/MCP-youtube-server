export interface YouTubeVideo {
  videoId: string;
  title: string;
  captions: Caption[];
}

export interface Caption {
  language: string;
  text: string;
}

export class YouTubeAPI {
  constructor(private apiKey: string) {}

  async searchVideos(query: string, maxResults: number = 20): Promise<YouTubeVideo[]> {
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    searchUrl.searchParams.append('part', 'snippet');
    searchUrl.searchParams.append('q', query);
    searchUrl.searchParams.append('type', 'video');
    searchUrl.searchParams.append('order', 'viewCount');
    searchUrl.searchParams.append('maxResults', maxResults.toString());
    searchUrl.searchParams.append('key', this.apiKey);

    const searchResponse = await fetch(searchUrl.toString());
    if (!searchResponse.ok) {
      throw new Error(`YouTube search failed: ${searchResponse.statusText}`);
    }

    const searchData = await searchResponse.json();
    const videos: YouTubeVideo[] = [];

    for (const item of searchData.items) {
      const videoId = item.id.videoId;
      const title = item.snippet.title;
      
      try {
        const captions = await this.fetchCaptions(videoId);
        videos.push({ videoId, title, captions });
      } catch (error) {
        console.error(`Failed to fetch captions for video ${videoId}:`, error);
        videos.push({ videoId, title, captions: [] });
      }
    }

    return videos;
  }

  private async fetchCaptions(videoId: string): Promise<Caption[]> {
    const transcriptUrl = `https://youtube-transcriber-api.vercel.app/api/transcript?video_id=${videoId}`;
    
    const response = await fetch(transcriptUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch captions: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.transcripts || !Array.isArray(data.transcripts)) {
      return [];
    }

    return data.transcripts.map((transcript: any) => ({
      language: transcript.language || 'unknown',
      text: Array.isArray(transcript.segments) 
        ? transcript.segments.map((seg: any) => seg.text).join(' ')
        : transcript.text || ''
    }));
  }
}