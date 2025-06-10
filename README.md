# YouTube MCP Server

A Model Context Protocol (MCP) server that provides YouTube search functionality with transcript retrieval and OpenAI text generation capabilities, deployed as a Cloudflare Worker.

## 🚀 Live Server

The server is deployed at: https://youtube-mcp-server.anis-ayari-perso.workers.dev

## 📋 Features

- **YouTube Video Search**: Search for YouTube videos and automatically retrieve their transcripts/captions
- **OpenAI Text Generation**: Generate text using OpenAI's GPT models
- **MCP Protocol Support**: Full MCP protocol implementation for tool discovery and execution
- **REST API**: Direct REST endpoints for easy integration
- **CORS Enabled**: Can be called from web browsers

## 🛠️ Available Tools

### 1. YouTube Video Search (`search_youtube_videos`)
Search YouTube videos and retrieve their captions/transcripts.

**Parameters:**
- `query` (string, required): Search query for YouTube videos
- `maxResults` (number, optional): Maximum number of results (default: 20)

### 2. OpenAI Completion (`openai_completion`)
Generate text completions using OpenAI.

**Parameters:**
- `prompt` (string, required): Prompt for OpenAI completion
- `model` (string, optional): OpenAI model to use (default: "gpt-4o-mini")
- `maxTokens` (number, optional): Maximum tokens in response (default: 1000)

## 📡 API Endpoints

### REST Endpoints

#### 1. YouTube Search
```bash
GET /youtube/search?query=<search_term>&maxResults=<number>
```

**Example:**
```bash
curl "https://youtube-mcp-server.anis-ayari-perso.workers.dev/youtube/search?query=javascript%20tutorial&maxResults=2"
```

**Response:**
```json
[
  {
    "videoId": "abc123",
    "title": "JavaScript Tutorial for Beginners",
    "captions": [
      {
        "language": "en",
        "text": "Full transcript text..."
      }
    ]
  }
]
```

#### 2. OpenAI Completion
```bash
POST /openai/completion
Content-Type: application/json

{
  "prompt": "Your prompt here",
  "model": "gpt-4o-mini",
  "maxTokens": 1000
}
```

**Example:**
```bash
curl -X POST "https://youtube-mcp-server.anis-ayari-perso.workers.dev/openai/completion" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain quantum computing in simple terms",
    "maxTokens": 200
  }'
```

**Response:**
```json
{
  "completion": "Quantum computing is a type of computing that uses quantum mechanics..."
}
```

### MCP Endpoints

#### 1. List Available Tools
```bash
POST /mcp
Content-Type: application/json

{
  "method": "tools/list"
}
```

**Example:**
```bash
curl -X POST "https://youtube-mcp-server.anis-ayari-perso.workers.dev/mcp" \
  -H "Content-Type: application/json" \
  -d '{"method": "tools/list"}'
```

#### 2. Call a Tool
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

**Example - YouTube Search:**
```bash
curl -X POST "https://youtube-mcp-server.anis-ayari-perso.workers.dev/mcp" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "search_youtube_videos",
      "arguments": {
        "query": "typescript tutorial",
        "maxResults": 3
      }
    }
  }'
```

**Example - OpenAI Completion:**
```bash
curl -X POST "https://youtube-mcp-server.anis-ayari-perso.workers.dev/mcp" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "openai_completion",
      "arguments": {
        "prompt": "Write a haiku about programming",
        "model": "gpt-4o-mini",
        "maxTokens": 100
      }
    }
  }'
```

## 💻 Usage Examples

### JavaScript/Node.js
```javascript
// YouTube Search
const searchResponse = await fetch('https://youtube-mcp-server.anis-ayari-perso.workers.dev/youtube/search?query=react&maxResults=5');
const videos = await searchResponse.json();

// OpenAI Completion
const completionResponse = await fetch('https://youtube-mcp-server.anis-ayari-perso.workers.dev/openai/completion', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Explain REST APIs',
    maxTokens: 500
  })
});
const { completion } = await completionResponse.json();

// MCP Tool Call
const mcpResponse = await fetch('https://youtube-mcp-server.anis-ayari-perso.workers.dev/mcp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    method: 'tools/call',
    params: {
      name: 'search_youtube_videos',
      arguments: { query: 'vue.js', maxResults: 10 }
    }
  })
});
const result = await mcpResponse.json();
```

### Python
```python
import requests

# YouTube Search
response = requests.get('https://youtube-mcp-server.anis-ayari-perso.workers.dev/youtube/search', 
                       params={'query': 'python tutorial', 'maxResults': 5})
videos = response.json()

# OpenAI Completion
response = requests.post('https://youtube-mcp-server.anis-ayari-perso.workers.dev/openai/completion',
                        json={'prompt': 'What is machine learning?', 'maxTokens': 300})
completion = response.json()

# MCP Tool Call
response = requests.post('https://youtube-mcp-server.anis-ayari-perso.workers.dev/mcp',
                        json={
                            'method': 'tools/call',
                            'params': {
                                'name': 'openai_completion',
                                'arguments': {
                                    'prompt': 'Generate a README template',
                                    'maxTokens': 500
                                }
                            }
                        })
result = response.json()
```

### Using with MCP Clients

This server is compatible with any MCP client. Configure your client to connect to:
```
https://youtube-mcp-server.anis-ayari-perso.workers.dev/mcp
```

## 🧪 Testing

Test scripts are included in the repository:

```bash
# JavaScript test
node test-mcp-server.js

# Python test
python3 test-mcp-server.py
```

## 🏗️ Development

### Local Development
```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Deploy to Cloudflare
npm run deploy
```

### Environment Variables
- `YOUTUBE_API_KEY`: YouTube Data API v3 key
- `OPENAI_API_KEY`: OpenAI API key

## 📝 Response Formats

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
      },
      {
        "language": "es",
        "text": "Transcripción completa..."
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

### MCP Tool Response
```json
{
  "content": [
    {
      "type": "text",
      "text": "Tool execution result..."
    }
  ]
}
```

## 🔒 Security

- API keys are stored securely as Cloudflare Worker secrets
- CORS is enabled for browser-based applications
- Rate limiting is handled by Cloudflare Workers

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues and questions, please open an issue on the [GitHub repository](https://github.com/anisayari/MCP-youtube-server).