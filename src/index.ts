import { YouTubeAPI } from './youtube.js';

export interface Env {
  YOUTUBE_API_KEY: string;
  OPENAI_API_KEY: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    };

    try {
      if (url.pathname === '/youtube/search' && request.method === 'GET') {
        const query = url.searchParams.get('query');
        const maxResults = parseInt(url.searchParams.get('maxResults') || '20');

        if (!query) {
          return new Response(JSON.stringify({ error: 'Query parameter is required' }), {
            status: 400,
            headers,
          });
        }

        const youtubeAPI = new YouTubeAPI(env.YOUTUBE_API_KEY);
        const videos = await youtubeAPI.searchVideos(query, maxResults);

        return new Response(JSON.stringify(videos), { headers });
      }

      if (url.pathname === '/openai/completion' && request.method === 'POST') {
        const body = await request.json() as any;
        const { prompt, model = 'gpt-4o-mini', maxTokens = 1000 } = body;

        if (!prompt) {
          return new Response(JSON.stringify({ error: 'Prompt is required' }), {
            status: 400,
            headers,
          });
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: maxTokens,
          }),
        });

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json() as any;
        const completion = data.choices[0].message.content;

        return new Response(JSON.stringify({ completion }), { headers });
      }

      if (url.pathname === '/mcp' && request.method === 'POST') {
        const body = await request.json() as any;
        
        if (body.method === 'tools/list') {
          return new Response(JSON.stringify({
            tools: [
              {
                name: 'search_youtube_videos',
                description: 'Search YouTube videos and retrieve their captions/transcripts',
                inputSchema: {
                  type: 'object',
                  properties: {
                    query: { type: 'string', description: 'Search query for YouTube videos' },
                    maxResults: { type: 'number', description: 'Maximum number of results', default: 20 },
                  },
                  required: ['query'],
                },
              },
              {
                name: 'openai_completion',
                description: 'Generate text completion using OpenAI',
                inputSchema: {
                  type: 'object',
                  properties: {
                    prompt: { type: 'string', description: 'Prompt for OpenAI completion' },
                    model: { type: 'string', description: 'OpenAI model to use', default: 'gpt-4o-mini' },
                    maxTokens: { type: 'number', description: 'Maximum tokens', default: 1000 },
                  },
                  required: ['prompt'],
                },
              },
            ],
          }), { headers });
        }

        if (body.method === 'tools/call') {
          const { name, arguments: args } = body.params;

          if (name === 'search_youtube_videos') {
            const youtubeAPI = new YouTubeAPI(env.YOUTUBE_API_KEY);
            const videos = await youtubeAPI.searchVideos(args.query, args.maxResults || 20);
            return new Response(JSON.stringify({
              content: [{ type: 'text', text: JSON.stringify(videos, null, 2) }],
            }), { headers });
          }

          if (name === 'openai_completion') {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
              },
              body: JSON.stringify({
                model: args.model || 'gpt-4o-mini',
                messages: [{ role: 'user', content: args.prompt }],
                max_tokens: args.maxTokens || 1000,
              }),
            });

            const data = await response.json() as any;
            return new Response(JSON.stringify({
              content: [{ type: 'text', text: data.choices[0].message.content }],
            }), { headers });
          }

          return new Response(JSON.stringify({ error: `Unknown tool: ${name}` }), {
            status: 400,
            headers,
          });
        }
      }

      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers,
      });
    } catch (error: any) {
      console.error('Error:', error);
      return new Response(JSON.stringify({ 
        error: error.message || 'Unknown error',
        stack: error.stack 
      }), {
        status: 500,
        headers,
      });
    }
  },
};