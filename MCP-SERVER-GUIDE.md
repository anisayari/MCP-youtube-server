# YouTube MCP Server Guide

## Overview

This MCP (Model Context Protocol) server provides AI-powered tools for YouTube content creation and text manipulation. It's deployed on Cloudflare Workers and can be integrated with any MCP-compatible client.

## Available Tools

### YouTube Tools

1. **search_youtube_videos**
   - Search YouTube videos with metadata
   - Parameters: `query` (string), `maxResults` (number, default: 20)
   - Returns: video title, description, URL, thumbnails, view count, duration

2. **analyze_video_comments**
   - Analyze sentiment and themes in video comments
   - Parameters: `videoId` (string), `maxComments` (number, default: 100)
   - Returns: sentiment analysis, recurring themes, viewer feedback

3. **generate_video_script**
   - Generate complete YouTube video scripts
   - Parameters: 
     - `topic` (string, required)
     - `duration` (string: "short", "medium", "long")
     - `style` (string: "educational", "entertainment", "tutorial", "vlog")
     - `targetAudience` (string)
   - Returns: Complete script with timestamps and visual suggestions

4. **extract_youtube_seo**
   - Extract SEO keywords from successful videos
   - Parameters: `query` (string), `competitors` (number, default: 10)
   - Returns: keywords, title patterns, tags, SEO recommendations

5. **compare_videos**
   - Compare performance metrics of multiple videos
   - Parameters: `videoIds` (array of strings)
   - Returns: performance comparison, success factors, recommendations

6. **analyze_video_landscape**
   - Analyze existing videos and suggest unique content angles
   - Parameters: `query` (string), `maxVideos` (number, default: 10)
   - Returns: content gaps, unique video ideas, audience targeting

### Text Tools

7. **rewrite_text**
   - Rewrite text in different styles
   - Parameters: `text` (string), `style` (string: "professional", "casual", "formal", "creative")

8. **summarize_text**
   - Summarize text to specific lengths
   - Parameters: `text` (string), `length` (string: "short", "medium", "long")

9. **expand_text**
   - Expand text with more details
   - Parameters: `text` (string), `targetLength` (string, default: "double")

10. **fix_grammar**
    - Fix grammar and spelling errors
    - Parameters: `text` (string)

11. **translate_text**
    - Translate text to another language
    - Parameters: `text` (string), `targetLanguage` (string, default: "Spanish")

12. **simplify_text**
    - Simplify text for easier reading
    - Parameters: `text` (string), `readingLevel` (string: "elementary", "high-school", "general")

13. **openai_completion**
    - Direct OpenAI API access
    - Parameters: `prompt` (string), `model` (string, default: "gpt-4o-mini"), `maxTokens` (number, default: 1000)

## API Endpoints

### MCP Protocol Endpoint
```
POST https://youtube-mcp-server.anis-ayari-perso.workers.dev/mcp
```

### Direct REST Endpoints
- `GET /youtube/search?query=QUERY&maxResults=N`
- `POST /openai/completion`
- `POST /text/rewrite`
- `POST /text/summarize`
- `POST /text/expand`
- `POST /text/fix-grammar`
- `POST /text/translate`
- `POST /text/simplify`

## How to Use with MCP Clients

### 1. List Available Tools
```bash
curl -X POST https://youtube-mcp-server.anis-ayari-perso.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{"method": "tools/list"}'
```

### 2. Call a Tool
```bash
curl -X POST https://youtube-mcp-server.anis-ayari-perso.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "search_youtube_videos",
      "arguments": {
        "query": "python tutorial",
        "maxResults": 5
      }
    }
  }'
```

## Example Workflows

### Complete YouTube Video Creation Workflow

```javascript
// 1. Analyze the landscape
const landscape = await callMCPTool('analyze_video_landscape', {
  query: 'React hooks tutorial',
  maxVideos: 10
});

// 2. Extract SEO insights
const seo = await callMCPTool('extract_youtube_seo', {
  query: 'React hooks tutorial',
  competitors: 15
});

// 3. Generate optimized script
const script = await callMCPTool('generate_video_script', {
  topic: 'Advanced React Hooks',
  duration: 'medium',
  style: 'tutorial',
  targetAudience: 'intermediate developers'
});

// 4. Create multiple title options
const titles = await Promise.all([
  callMCPTool('rewrite_text', {
    text: 'React Hooks Tutorial',
    style: 'creative'
  }),
  callMCPTool('rewrite_text', {
    text: 'React Hooks Tutorial',
    style: 'professional'
  })
]);
```

### Content Optimization Workflow

```javascript
// 1. Analyze top video comments
const comments = await callMCPTool('analyze_video_comments', {
  videoId: 'dQw4w9WgXcQ',
  maxComments: 200
});

// 2. Generate script addressing viewer concerns
const improvedScript = await callMCPTool('generate_video_script', {
  topic: 'React Hooks - Addressing Common Issues',
  duration: 'medium',
  style: 'educational',
  targetAudience: comments.metadata.audienceProfile
});

// 3. Simplify complex sections
const simplifiedIntro = await callMCPTool('simplify_text', {
  text: improvedScript.sections.introduction,
  readingLevel: 'general'
});
```

## Deployment Guide

### Prerequisites
- Node.js and npm installed
- Cloudflare account
- Wrangler CLI (`npm install -g wrangler`)

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/anisayari/MCP-youtube-server.git
   cd youtube-mcp-server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Cloudflare secrets**
   ```bash
   # Set your YouTube API key
   npx wrangler secret put YOUTUBE_API_KEY
   # Enter your key when prompted

   # Set your OpenAI API key
   npx wrangler secret put OPENAI_API_KEY
   # Enter your key when prompted
   ```

4. **Create KV namespace**
   ```bash
   npx wrangler kv:namespace create youtube_cache
   ```
   
   Update `wrangler.toml` with the returned ID:
   ```toml
   [[kv_namespaces]]
   binding = "CACHE"
   id = "YOUR_KV_NAMESPACE_ID"
   ```

### Deploy to Cloudflare Workers

1. **Deploy the worker**
   ```bash
   npx wrangler deploy
   ```

2. **Verify deployment**
   ```bash
   curl https://YOUR-WORKER-NAME.workers.dev/mcp \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{"method": "tools/list"}'
   ```

### Custom Domain (Optional)

1. Go to Cloudflare Dashboard > Workers & Pages
2. Select your worker
3. Go to "Triggers" tab
4. Add a custom domain

## Configuration

### Caching
- YouTube search results are cached for 1 hour
- Cache is automatically managed by Cloudflare KV

### Rate Limiting
- Cloudflare Workers have built-in DDoS protection
- Default limits: 100,000 requests/day (free plan)

### API Keys
- YouTube Data API v3 key required (Get it from [Google Cloud Console](https://console.cloud.google.com))
- OpenAI API key required for AI features (Get it from [OpenAI Platform](https://platform.openai.com))
- Keys are stored securely as Cloudflare secrets

## Testing

### Test YouTube Search
```bash
curl -X POST https://youtube-mcp-server.anis-ayari-perso.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "search_youtube_videos",
      "arguments": {"query": "javascript", "maxResults": 2}
    }
  }'
```

### Test Text Rewriting
```bash
curl -X POST https://youtube-mcp-server.anis-ayari-perso.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "rewrite_text",
      "arguments": {
        "text": "The cat is on the mat",
        "style": "professional"
      }
    }
  }'
```

### Test Script Generation
```bash
curl -X POST https://youtube-mcp-server.anis-ayari-perso.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "generate_video_script",
      "arguments": {
        "topic": "Introduction to AI",
        "duration": "short",
        "style": "educational",
        "targetAudience": "beginners"
      }
    }
  }'
```

## Integration Examples

### With Claude Desktop

Add to your Claude Desktop configuration:
```json
{
  "mcpServers": {
    "youtube": {
      "url": "https://youtube-mcp-server.anis-ayari-perso.workers.dev/mcp"
    }
  }
}
```

### With Python
```python
import requests

def call_mcp_tool(tool_name, arguments):
    response = requests.post(
        'https://youtube-mcp-server.anis-ayari-perso.workers.dev/mcp',
        json={
            'method': 'tools/call',
            'params': {
                'name': tool_name,
                'arguments': arguments
            }
        }
    )
    return response.json()

# Example usage
results = call_mcp_tool('search_youtube_videos', {
    'query': 'python programming',
    'maxResults': 5
})
```

### With JavaScript/Node.js
```javascript
async function callMCPTool(toolName, args) {
  const response = await fetch('https://youtube-mcp-server.anis-ayari-perso.workers.dev/mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args
      }
    })
  });
  return response.json();
}

// Example usage
const videos = await callMCPTool('search_youtube_videos', {
  query: 'web development',
  maxResults: 10
});
```

## Troubleshooting

### Common Issues

1. **"KV namespace not found" error**
   - Create the KV namespace first: `npx wrangler kv:namespace create youtube_cache`
   - Update wrangler.toml with the correct ID

2. **API key errors**
   - Verify secrets are set correctly: `npx wrangler secret list`
   - Check API key validity and quotas in respective dashboards

3. **CORS errors**
   - The server includes CORS headers for all origins
   - Check client-side implementation
   - For production, consider restricting origins

4. **Rate limit errors**
   - YouTube API: 10,000 units/day default quota
   - OpenAI: Check your plan limits
   - Implement client-side rate limiting

### Debug Mode

Check worker logs in Cloudflare Dashboard:
1. Go to Workers & Pages
2. Select your worker
3. Click "Logs" to stream real-time logs

Or use Wrangler CLI:
```bash
npx wrangler tail
```

## Performance Optimization

### Caching Strategy
- YouTube searches: Cached for 1 hour
- Video metadata: Cached for 24 hours
- SEO analysis: Cached for 6 hours

### Parallel Processing
```javascript
// Good - Parallel execution
const [videos, seo, comments] = await Promise.all([
  callMCPTool('search_youtube_videos', { query: 'topic' }),
  callMCPTool('extract_youtube_seo', { query: 'topic' }),
  callMCPTool('analyze_video_comments', { videoId: 'abc123' })
]);

// Bad - Sequential execution
const videos = await callMCPTool('search_youtube_videos', { query: 'topic' });
const seo = await callMCPTool('extract_youtube_seo', { query: 'topic' });
const comments = await callMCPTool('analyze_video_comments', { videoId: 'abc123' });
```

## Security Notes

- API keys are stored as encrypted Cloudflare secrets
- Never commit API keys to version control
- Use environment-specific keys for development/production
- Monitor API usage to prevent abuse
- Consider implementing authentication for production use

## Pricing

### Cloudflare Workers
- Free: 100,000 requests/day
- Paid: $5/month for 10 million requests

### API Costs
- YouTube Data API: Free quota of 10,000 units/day
- OpenAI: Based on model usage (gpt-4o-mini ~$0.15/1M tokens)

## Support

- GitHub Issues: https://github.com/anisayari/MCP-youtube-server/issues
- Cloudflare Workers Docs: https://developers.cloudflare.com/workers/
- MCP Protocol Spec: https://modelcontextprotocol.io/
- YouTube API Docs: https://developers.google.com/youtube/v3
- OpenAI API Docs: https://platform.openai.com/docs