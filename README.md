# YouTube MCP Server for Cloudflare Workers

This is a TypeScript MCP (Model Context Protocol) server that wraps the YouTube API and can be deployed as a Cloudflare Worker endpoint.

## Deployment Options

### Option 1: Deploy from GitHub (Recommended)

1. Fork this repository
2. Go to your Cloudflare Dashboard → Workers & Pages
3. Create application → Workers → Deploy from GitHub
4. Select your forked repository
5. Add environment variables in Cloudflare Dashboard:
   - `YOUTUBE_API_KEY`
   - `OPENAI_API_KEY`

### Option 2: Deploy with Wrangler CLI

1. Clone the repository
2. Install dependencies: `npm install`
3. Add secrets:
   ```bash
   wrangler secret put YOUTUBE_API_KEY
   wrangler secret put OPENAI_API_KEY
   ```
4. Deploy: `npm run deploy`

### Option 3: GitHub Actions (CI/CD)

1. Add these secrets to your GitHub repository:
   - `CLOUDFLARE_API_TOKEN` (create at https://dash.cloudflare.com/profile/api-tokens)
   - `CLOUDFLARE_ACCOUNT_ID` (find in Workers dashboard)
2. Push to main branch to auto-deploy

## Features

- YouTube video search with caption/transcript retrieval
- OpenAI text completion integration
- MCP-compatible endpoints for tool discovery and execution
- REST API endpoints for direct access

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up your Cloudflare Worker secrets:
```bash
wrangler secret put YOUTUBE_API_KEY
wrangler secret put OPENAI_API_KEY
```

3. Deploy to Cloudflare Workers:
```bash
npm run deploy
```

## API Endpoints

### REST Endpoints

#### YouTube Search
```
GET /youtube/search?query=<search_term>&maxResults=<number>
```

Example:
```bash
curl "https://your-worker.workers.dev/youtube/search?query=javascript+tutorial&maxResults=5"
```

#### OpenAI Completion
```
POST /openai/completion
Content-Type: application/json

{
  "prompt": "Explain quantum computing",
  "model": "gpt-4o-mini",
  "maxTokens": 1000
}
```

### MCP Endpoint

```
POST /mcp
Content-Type: application/json
```

#### List Tools
```json
{
  "method": "tools/list"
}
```

#### Call Tool
```json
{
  "method": "tools/call",
  "params": {
    "name": "search_youtube_videos",
    "arguments": {
      "query": "javascript tutorial",
      "maxResults": 5
    }
  }
}
```

## Development

Run locally with Wrangler:
```bash
npm run dev
```

## Environment Variables

- `YOUTUBE_API_KEY`: Your YouTube Data API v3 key
- `OPENAI_API_KEY`: Your OpenAI API key

## Response Format

### YouTube Search Response
```json
[
  {
    "videoId": "dQw4w9WgXcQ",
    "title": "Video Title",
    "captions": [
      {
        "language": "en",
        "text": "Full transcript text..."
      }
    ]
  }
]
```

### OpenAI Completion Response
```json
{
  "completion": "Generated text response..."
}
```