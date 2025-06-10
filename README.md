# YouTube MCP Server

A powerful Model Context Protocol (MCP) server that provides comprehensive YouTube functionality and AI-powered text processing tools, deployed as a Cloudflare Worker.

## 🚀 Live Server

The server is deployed at: https://youtube-mcp-server.anis-ayari-perso.workers.dev

## 📋 Features

- **YouTube Video Search**: Search and analyze YouTube videos with detailed metadata
- **Comment Analysis**: Analyze video comments for sentiment and insights
- **AI-Powered Text Tools**: Rewrite, summarize, expand, translate, and enhance text
- **SEO Optimization**: Extract keywords and tags from successful videos
- **Video Comparison**: Compare performance metrics across multiple videos
- **Script Generation**: Create complete YouTube video scripts
- **Caching**: KV-based caching for improved performance
- **MCP Protocol Support**: Full MCP protocol implementation
- **REST API**: Direct REST endpoints for easy integration
- **CORS Enabled**: Can be called from web browsers

## 🛠️ Available Tools (13 Total)

### YouTube Tools

#### 1. YouTube Video Search (`search_youtube_videos`)
Search YouTube videos with detailed metadata.

**Parameters:**
- `query` (string, required): Search query
- `maxResults` (number, optional): Maximum results (default: 20)

**Returns:** Video ID, title, description, URL, thumbnails, view count, duration, channel info

#### 2. Analyze Video Comments (`analyze_video_comments`)
Analyze comments sentiment and themes for a video.

**Parameters:**
- `videoId` (string, required): YouTube video ID
- `maxComments` (number, optional): Maximum comments to analyze (default: 100)

**Returns:** Sentiment analysis, recurring themes, viewer feedback insights

#### 3. Generate Video Script (`generate_video_script`)
Generate complete YouTube video scripts with hooks, content, and CTAs.

**Parameters:**
- `topic` (string, required): Video topic
- `duration` (string, optional): "short", "medium", "long" (default: "medium")
- `style` (string, optional): "educational", "entertainment", "tutorial", "vlog" (default: "educational")
- `targetAudience` (string, optional): Target audience description

**Returns:** Complete script with timestamps, visual suggestions, and engagement prompts

#### 4. Extract YouTube SEO (`extract_youtube_seo`)
Extract SEO keywords and tags from successful videos.

**Parameters:**
- `query` (string, required): Topic to analyze
- `competitors` (number, optional): Number of videos to analyze (default: 10)

**Returns:** Keywords, title formulas, tags, optimization techniques

#### 5. Compare Videos (`compare_videos`)
Compare performance metrics of multiple videos.

**Parameters:**
- `videoIds` (array, required): Array of video IDs to compare

**Returns:** Performance rankings, success factors, improvement recommendations

#### 6. Analyze Video Landscape (`analyze_video_landscape`)
Analyze existing videos and suggest unique content angles.

**Parameters:**
- `query` (string, required): Topic to analyze
- `maxVideos` (number, optional): Number of videos to analyze (default: 10)

**Returns:** Content gaps, unique video ideas, target audiences

### AI Text Tools

#### 7. OpenAI Completion (`openai_completion`)
Generate text using OpenAI models.

**Parameters:**
- `prompt` (string, required): Text prompt
- `model` (string, optional): OpenAI model (default: "gpt-4o-mini")
- `maxTokens` (number, optional): Maximum tokens (default: 1000)

#### 8. Rewrite Text (`rewrite_text`)
Rewrite text in different styles.

**Parameters:**
- `text` (string, required): Text to rewrite
- `style` (string, optional): "professional", "casual", "formal", "creative" (default: "professional")

#### 9. Summarize Text (`summarize_text`)
Create concise summaries.

**Parameters:**
- `text` (string, required): Text to summarize
- `length` (string, optional): "short", "medium", "long" (default: "medium")

#### 10. Expand Text (`expand_text`)
Expand text with additional details.

**Parameters:**
- `text` (string, required): Text to expand
- `targetLength` (string, optional): Target expansion (default: "double")

#### 11. Fix Grammar (`fix_grammar`)
Fix grammar, spelling, and punctuation.

**Parameters:**
- `text` (string, required): Text to fix

#### 12. Translate Text (`translate_text`)
Translate text to other languages.

**Parameters:**
- `text` (string, required): Text to translate
- `targetLanguage` (string, optional): Target language (default: "Spanish")

#### 13. Simplify Text (`simplify_text`)
Simplify text for easier reading.

**Parameters:**
- `text` (string, required): Text to simplify
- `readingLevel` (string, optional): "elementary", "high-school", "general" (default: "general")

## 📡 API Endpoints

### REST Endpoints

#### YouTube Search
```bash
GET /youtube/search?query=<search_term>&maxResults=<number>
```

#### OpenAI Completion
```bash
POST /openai/completion
Content-Type: application/json

{
  "prompt": "Your prompt here",
  "model": "gpt-4o-mini",
  "maxTokens": 1000
}
```

#### Text Enhancement Endpoints
```bash
POST /text/rewrite
POST /text/summarize
POST /text/expand
POST /text/fix-grammar
POST /text/translate
POST /text/simplify

Content-Type: application/json
{
  "text": "Your text here",
  // Additional parameters based on endpoint
}
```

### MCP Endpoint

#### List All Tools
```bash
POST /mcp
Content-Type: application/json

{
  "method": "tools/list"
}
```

#### Call a Tool
```bash
POST /mcp
Content-Type: application/json

{
  "method": "tools/call",
  "params": {
    "name": "tool_name",
    "arguments": {
      // tool-specific arguments
    }
  }
}
```

## 💻 Usage Examples

### Example 1: Analyze Video Performance
```javascript
// Search for videos
const searchResponse = await fetch('https://youtube-mcp-server.anis-ayari-perso.workers.dev/mcp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    method: 'tools/call',
    params: {
      name: 'search_youtube_videos',
      arguments: { query: 'javascript tutorial', maxResults: 5 }
    }
  })
});

// Analyze comments from top video
const videoId = 'VIDEO_ID_HERE';
const commentsResponse = await fetch('https://youtube-mcp-server.anis-ayari-perso.workers.dev/mcp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    method: 'tools/call',
    params: {
      name: 'analyze_video_comments',
      arguments: { videoId, maxComments: 100 }
    }
  })
});
```

### Example 2: Generate Optimized Content
```javascript
// Extract SEO insights
const seoResponse = await fetch('https://youtube-mcp-server.anis-ayari-perso.workers.dev/mcp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    method: 'tools/call',
    params: {
      name: 'extract_youtube_seo',
      arguments: { query: 'web development', competitors: 10 }
    }
  })
});

// Generate script based on insights
const scriptResponse = await fetch('https://youtube-mcp-server.anis-ayari-perso.workers.dev/mcp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    method: 'tools/call',
    params: {
      name: 'generate_video_script',
      arguments: {
        topic: 'Web Development for Beginners',
        duration: 'medium',
        style: 'tutorial',
        targetAudience: 'Complete beginners'
      }
    }
  })
});
```

### Example 3: Compare Competitor Videos
```javascript
const compareResponse = await fetch('https://youtube-mcp-server.anis-ayari-perso.workers.dev/mcp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    method: 'tools/call',
    params: {
      name: 'compare_videos',
      arguments: {
        videoIds: ['VIDEO_ID_1', 'VIDEO_ID_2', 'VIDEO_ID_3']
      }
    }
  })
});
```

## 📝 Response Formats

### YouTube Search Response
```json
{
  "videoId": "dQw4w9WgXcQ",
  "title": "Video Title",
  "description": "Video description...",
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "thumbnail": {
    "default": "https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg",
    "medium": "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
    "high": "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
  },
  "publishedAt": "2024-01-01T00:00:00Z",
  "channelTitle": "Channel Name",
  "viewCount": "1000000",
  "duration": "10:30",
  "captions": []
}
```

### MCP Tool Response
```json
{
  "content": [
    {
      "type": "text",
      "text": "Tool execution result..."
    }
  ],
  "metadata": {
    // Optional metadata specific to each tool
  }
}
```

## 🚀 Performance Features

- **Caching**: Results are cached for 1 hour using Cloudflare KV
- **Concurrent Processing**: Multiple tools can be called in parallel
- **Optimized Responses**: Large responses are efficiently structured

## 🔧 Development

### Local Development
```bash
npm install
npm run dev
```

### Deploy to Cloudflare
```bash
npm run deploy
```

### Environment Variables
- `YOUTUBE_API_KEY`: YouTube Data API v3 key
- `OPENAI_API_KEY`: OpenAI API key
- `CACHE`: KV namespace binding (configured in wrangler.toml)

## 🔒 Security

- API keys stored as Cloudflare Worker secrets
- CORS enabled for browser access
- Rate limiting handled by Cloudflare

## 📊 Use Cases

1. **Content Creators**: Research trends, analyze competition, generate scripts
2. **SEO Specialists**: Extract keywords, optimize titles and descriptions
3. **Market Researchers**: Analyze viewer sentiment and engagement
4. **Educators**: Create educational content with proper structure
5. **Marketers**: Compare campaign performance, identify content gaps

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a pull request.

## 📄 License

MIT License

## 📧 Support

For issues and questions, please open an issue on [GitHub](https://github.com/anisayari/MCP-youtube-server).