import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { YouTubeAPI } from './youtube.js';

const SearchVideosArgsSchema = z.object({
  query: z.string().describe('Search query for YouTube videos'),
  maxResults: z.number().optional().default(20).describe('Maximum number of results to return'),
});

const OpenAIArgsSchema = z.object({
  prompt: z.string().describe('Prompt for OpenAI completion'),
  model: z.string().optional().default('gpt-4o-mini').describe('OpenAI model to use'),
  maxTokens: z.number().optional().default(1000).describe('Maximum tokens in response'),
});

export class YouTubeMCPServer {
  private server: Server;
  private youtubeAPI: YouTubeAPI;
  private openaiApiKey: string;

  constructor(youtubeApiKey: string, openaiApiKey: string) {
    this.server = new Server(
      {
        name: 'youtube-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    
    this.youtubeAPI = new YouTubeAPI(youtubeApiKey);
    this.openaiApiKey = openaiApiKey;

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'search_youtube_videos',
          description: 'Search YouTube videos and retrieve their captions/transcripts',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query for YouTube videos',
              },
              maxResults: {
                type: 'number',
                description: 'Maximum number of results to return',
                default: 20,
              },
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
              prompt: {
                type: 'string',
                description: 'Prompt for OpenAI completion',
              },
              model: {
                type: 'string',
                description: 'OpenAI model to use',
                default: 'gpt-4o-mini',
              },
              maxTokens: {
                type: 'number',
                description: 'Maximum tokens in response',
                default: 1000,
              },
            },
            required: ['prompt'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'search_youtube_videos': {
          const validatedArgs = SearchVideosArgsSchema.parse(args);
          const videos = await this.youtubeAPI.searchVideos(
            validatedArgs.query,
            validatedArgs.maxResults
          );
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(videos, null, 2),
              },
            ],
          };
        }

        case 'openai_completion': {
          const validatedArgs = OpenAIArgsSchema.parse(args);
          const response = await this.callOpenAI(
            validatedArgs.prompt,
            validatedArgs.model,
            validatedArgs.maxTokens
          );
          
          return {
            content: [
              {
                type: 'text',
                text: response,
              },
            ],
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  private async callOpenAI(prompt: string, model: string, maxTokens: number): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openaiApiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}