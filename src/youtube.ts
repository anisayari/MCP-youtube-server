export interface YouTubeVideo {
  videoId: string;
  title: string;
  description: string;
  url: string;
  thumbnail: {
    default: string;
    medium: string;
    high: string;
  };
  publishedAt: string;
  channelTitle: string;
  viewCount?: string;
  duration?: string;
  captions: Caption[];
}

export interface Caption {
  language: string;
  text: string;
}

export interface YouTubeComment {
  text: string;
  author: string;
  publishedAt: string;
  likeCount: number;
  replyCount?: number;
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

    // Get video IDs for statistics
    const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');
    
    // Fetch video statistics
    let videoStats: any = {};
    if (videoIds) {
      const statsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
      statsUrl.searchParams.append('part', 'statistics,contentDetails');
      statsUrl.searchParams.append('id', videoIds);
      statsUrl.searchParams.append('key', this.apiKey);
      
      try {
        const statsResponse = await fetch(statsUrl.toString());
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          statsData.items.forEach((item: any) => {
            videoStats[item.id] = {
              viewCount: item.statistics?.viewCount || '0',
              duration: this.parseDuration(item.contentDetails?.duration || '')
            };
          });
        }
      } catch (error) {
        console.error('Failed to fetch video statistics:', error);
      }
    }

    for (const item of searchData.items) {
      const videoId = item.id.videoId;
      const snippet = item.snippet;
      const stats = videoStats[videoId] || {};
      
      videos.push({
        videoId,
        title: snippet.title,
        description: snippet.description,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        thumbnail: {
          default: snippet.thumbnails.default.url,
          medium: snippet.thumbnails.medium.url,
          high: snippet.thumbnails.high.url
        },
        publishedAt: snippet.publishedAt,
        channelTitle: snippet.channelTitle,
        viewCount: stats.viewCount,
        duration: stats.duration,
        captions: []
      });
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

  private parseDuration(duration: string): string {
    // Parse ISO 8601 duration (e.g., PT4M13S)
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '';
    
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  async fetchVideoComments(videoId: string, maxResults: number = 100): Promise<YouTubeComment[]> {
    const commentsUrl = new URL('https://www.googleapis.com/youtube/v3/commentThreads');
    commentsUrl.searchParams.append('part', 'snippet');
    commentsUrl.searchParams.append('videoId', videoId);
    commentsUrl.searchParams.append('maxResults', maxResults.toString());
    commentsUrl.searchParams.append('order', 'relevance');
    commentsUrl.searchParams.append('key', this.apiKey);

    try {
      const response = await fetch(commentsUrl.toString());
      if (!response.ok) {
        throw new Error(`YouTube comments fetch failed: ${response.statusText}`);
      }

      const data = await response.json();
      const comments: YouTubeComment[] = [];

      for (const item of data.items) {
        const snippet = item.snippet.topLevelComment.snippet;
        comments.push({
          text: snippet.textDisplay,
          author: snippet.authorDisplayName,
          publishedAt: snippet.publishedAt,
          likeCount: snippet.likeCount || 0,
          replyCount: item.snippet.totalReplyCount || 0
        });
      }

      return comments;
    } catch (error) {
      console.error(`Failed to fetch comments for video ${videoId}:`, error);
      return [];
    }
  }
}