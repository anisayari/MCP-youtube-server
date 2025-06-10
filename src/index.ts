import { YouTubeAPI } from './youtube.js';

export interface Env {
  YOUTUBE_API_KEY: string;
  OPENAI_API_KEY: string;
  CACHE: KVNamespace;
}

async function callOpenAI(apiKey: string, prompt: string, model: string, maxTokens: number): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
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
  return data.choices[0].message.content;
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

        console.log(`[YouTube Search] Query: "${query}", MaxResults: ${maxResults}`);

        if (!query) {
          console.error('[YouTube Search] Missing query parameter');
          return new Response(JSON.stringify({ error: 'Query parameter is required' }), {
            status: 400,
            headers,
          });
        }

        // Check cache first
        const cacheKey = `youtube:${query}:${maxResults}`;
        const cached = await env.CACHE.get(cacheKey, 'json');
        if (cached) {
          console.log(`[YouTube Search] Cache hit for query: "${query}"`);
          return new Response(JSON.stringify(cached), { headers });
        }

        console.log(`[YouTube Search] Cache miss, fetching from YouTube API...`);
        const youtubeAPI = new YouTubeAPI(env.YOUTUBE_API_KEY);
        const videos = await youtubeAPI.searchVideos(query, maxResults);

        console.log(`[YouTube Search] Found ${videos.length} videos for query: "${query}"`);

        // Cache for 1 hour
        await env.CACHE.put(cacheKey, JSON.stringify(videos), { expirationTtl: 3600 });

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

      // Text enhancement endpoints
      if (url.pathname === '/text/rewrite' && request.method === 'POST') {
        const body = await request.json() as any;
        const { text, style = 'professional' } = body;

        if (!text) {
          return new Response(JSON.stringify({ error: 'Text is required' }), {
            status: 400,
            headers,
          });
        }

        const prompt = `Rewrite the following text in a ${style} style, maintaining the original meaning but improving clarity and flow:\n\n${text}`;
        const result = await callOpenAI(env.OPENAI_API_KEY, prompt, 'gpt-4o-mini', 1000);
        return new Response(JSON.stringify({ result }), { headers });
      }

      if (url.pathname === '/text/summarize' && request.method === 'POST') {
        const body = await request.json() as any;
        const { text, length = 'medium' } = body;

        if (!text) {
          return new Response(JSON.stringify({ error: 'Text is required' }), {
            status: 400,
            headers,
          });
        }

        const lengthGuide = length === 'short' ? '2-3 sentences' : length === 'long' ? '2-3 paragraphs' : '1 paragraph';
        const prompt = `Summarize the following text in ${lengthGuide}, capturing the key points:\n\n${text}`;
        const result = await callOpenAI(env.OPENAI_API_KEY, prompt, 'gpt-4o-mini', 500);
        return new Response(JSON.stringify({ result }), { headers });
      }

      if (url.pathname === '/text/expand' && request.method === 'POST') {
        const body = await request.json() as any;
        const { text, targetLength = 'double' } = body;

        if (!text) {
          return new Response(JSON.stringify({ error: 'Text is required' }), {
            status: 400,
            headers,
          });
        }

        const prompt = `Expand the following text to approximately ${targetLength} its current length by adding relevant details, examples, and explanations while maintaining the core message:\n\n${text}`;
        const result = await callOpenAI(env.OPENAI_API_KEY, prompt, 'gpt-4o-mini', 2000);
        return new Response(JSON.stringify({ result }), { headers });
      }

      if (url.pathname === '/text/fix-grammar' && request.method === 'POST') {
        const body = await request.json() as any;
        const { text } = body;

        if (!text) {
          return new Response(JSON.stringify({ error: 'Text is required' }), {
            status: 400,
            headers,
          });
        }

        const prompt = `Fix all grammar, spelling, and punctuation errors in the following text. Return only the corrected text without explanations:\n\n${text}`;
        const result = await callOpenAI(env.OPENAI_API_KEY, prompt, 'gpt-4o-mini', 1000);
        return new Response(JSON.stringify({ result }), { headers });
      }

      if (url.pathname === '/text/translate' && request.method === 'POST') {
        const body = await request.json() as any;
        const { text, targetLanguage = 'Spanish' } = body;

        if (!text) {
          return new Response(JSON.stringify({ error: 'Text is required' }), {
            status: 400,
            headers,
          });
        }

        const prompt = `Translate the following text to ${targetLanguage}. Maintain the tone and style of the original:\n\n${text}`;
        const result = await callOpenAI(env.OPENAI_API_KEY, prompt, 'gpt-4o-mini', 1500);
        return new Response(JSON.stringify({ result }), { headers });
      }

      if (url.pathname === '/text/simplify' && request.method === 'POST') {
        const body = await request.json() as any;
        const { text, readingLevel = 'general' } = body;

        if (!text) {
          return new Response(JSON.stringify({ error: 'Text is required' }), {
            status: 400,
            headers,
          });
        }

        const levelGuide = readingLevel === 'elementary' ? '5th grade' : readingLevel === 'high-school' ? 'high school' : 'general audience';
        const prompt = `Simplify the following text for a ${levelGuide} reading level. Use simpler words and shorter sentences while keeping the main ideas:\n\n${text}`;
        const result = await callOpenAI(env.OPENAI_API_KEY, prompt, 'gpt-4o-mini', 1000);
        return new Response(JSON.stringify({ result }), { headers });
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
              {
                name: 'rewrite_text',
                description: 'Rewrite text in a specific style',
                inputSchema: {
                  type: 'object',
                  properties: {
                    text: { type: 'string', description: 'Text to rewrite' },
                    style: { type: 'string', description: 'Style for rewriting', default: 'professional', enum: ['professional', 'casual', 'formal', 'creative'] },
                  },
                  required: ['text'],
                },
              },
              {
                name: 'summarize_text',
                description: 'Summarize text to a specific length',
                inputSchema: {
                  type: 'object',
                  properties: {
                    text: { type: 'string', description: 'Text to summarize' },
                    length: { type: 'string', description: 'Summary length', default: 'medium', enum: ['short', 'medium', 'long'] },
                  },
                  required: ['text'],
                },
              },
              {
                name: 'expand_text',
                description: 'Expand text with more details',
                inputSchema: {
                  type: 'object',
                  properties: {
                    text: { type: 'string', description: 'Text to expand' },
                    targetLength: { type: 'string', description: 'Target length', default: 'double' },
                  },
                  required: ['text'],
                },
              },
              {
                name: 'fix_grammar',
                description: 'Fix grammar and spelling errors',
                inputSchema: {
                  type: 'object',
                  properties: {
                    text: { type: 'string', description: 'Text to fix' },
                  },
                  required: ['text'],
                },
              },
              {
                name: 'translate_text',
                description: 'Translate text to another language',
                inputSchema: {
                  type: 'object',
                  properties: {
                    text: { type: 'string', description: 'Text to translate' },
                    targetLanguage: { type: 'string', description: 'Target language', default: 'Spanish' },
                  },
                  required: ['text'],
                },
              },
              {
                name: 'simplify_text',
                description: 'Simplify text for easier reading',
                inputSchema: {
                  type: 'object',
                  properties: {
                    text: { type: 'string', description: 'Text to simplify' },
                    readingLevel: { type: 'string', description: 'Target reading level', default: 'general', enum: ['elementary', 'high-school', 'general'] },
                  },
                  required: ['text'],
                },
              },
              {
                name: 'analyze_video_landscape',
                description: 'Analyze existing videos on a topic and suggest unique angles for new content',
                inputSchema: {
                  type: 'object',
                  properties: {
                    query: { type: 'string', description: 'Topic to analyze' },
                    maxVideos: { type: 'number', description: 'Number of videos to analyze', default: 10 },
                  },
                  required: ['query'],
                },
              },
              {
                name: 'analyze_video_comments',
                description: 'Analyze comments sentiment and themes for a video',
                inputSchema: {
                  type: 'object',
                  properties: {
                    videoId: { type: 'string', description: 'YouTube video ID' },
                    maxComments: { type: 'number', description: 'Maximum comments to analyze', default: 100 },
                  },
                  required: ['videoId'],
                },
              },
              {
                name: 'generate_video_script',
                description: 'Generate a complete YouTube video script with hooks, content, and CTAs',
                inputSchema: {
                  type: 'object',
                  properties: {
                    topic: { type: 'string', description: 'Video topic' },
                    duration: { type: 'string', description: 'Target duration', enum: ['short', 'medium', 'long'], default: 'medium' },
                    style: { type: 'string', description: 'Video style', enum: ['educational', 'entertainment', 'tutorial', 'vlog'], default: 'educational' },
                    targetAudience: { type: 'string', description: 'Target audience' },
                  },
                  required: ['topic'],
                },
              },
              {
                name: 'extract_youtube_seo',
                description: 'Extract SEO keywords and tags from successful videos',
                inputSchema: {
                  type: 'object',
                  properties: {
                    query: { type: 'string', description: 'Topic to analyze for SEO' },
                    competitors: { type: 'number', description: 'Number of competitor videos to analyze', default: 10 },
                  },
                  required: ['query'],
                },
              },
              {
                name: 'compare_videos',
                description: 'Compare performance metrics of multiple videos',
                inputSchema: {
                  type: 'object',
                  properties: {
                    videoIds: { type: 'array', items: { type: 'string' }, description: 'Video IDs to compare' },
                  },
                  required: ['videoIds'],
                },
              },
            ],
          }), { headers });
        }

        if (body.method === 'tools/call') {
          const { name, arguments: args } = body.params;

          if (name === 'search_youtube_videos') {
            console.log(`[MCP] search_youtube_videos called with query: "${args.query}", maxResults: ${args.maxResults}`);
            
            const maxResults = args.maxResults || 20;
            
            // Check cache first
            const cacheKey = `youtube:${args.query}:${maxResults}`;
            const cached = await env.CACHE.get(cacheKey, 'json');
            if (cached) {
              console.log(`[MCP] Cache hit for search_youtube_videos`);
              return new Response(JSON.stringify({
                content: [{ type: 'text', text: JSON.stringify(cached, null, 2) }],
              }), { headers });
            }
            
            console.log(`[MCP] Cache miss, calling YouTube API...`);
            try {
              const youtubeAPI = new YouTubeAPI(env.YOUTUBE_API_KEY);
              const videos = await youtubeAPI.searchVideos(args.query, maxResults);
              
              console.log(`[MCP] YouTube API returned ${videos.length} videos`);
              
              // Cache for 1 hour
              await env.CACHE.put(cacheKey, JSON.stringify(videos), { expirationTtl: 3600 });
              
              return new Response(JSON.stringify({
                content: [{ type: 'text', text: JSON.stringify(videos, null, 2) }],
              }), { headers });
            } catch (error: any) {
              console.error(`[MCP] Error in search_youtube_videos:`, error);
              return new Response(JSON.stringify({
                error: error.message,
                content: [{ type: 'text', text: `Error: ${error.message}` }],
              }), { headers, status: 500 });
            }
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

          if (name === 'rewrite_text') {
            const prompt = `Rewrite the following text in a ${args.style || 'professional'} style, maintaining the original meaning but improving clarity and flow:\n\n${args.text}`;
            const result = await callOpenAI(env.OPENAI_API_KEY, prompt, 'gpt-4o-mini', 1000);
            return new Response(JSON.stringify({
              content: [{ type: 'text', text: result }],
            }), { headers });
          }

          if (name === 'summarize_text') {
            const length = args.length || 'medium';
            const lengthGuide = length === 'short' ? '2-3 sentences' : length === 'long' ? '2-3 paragraphs' : '1 paragraph';
            const prompt = `Summarize the following text in ${lengthGuide}, capturing the key points:\n\n${args.text}`;
            const result = await callOpenAI(env.OPENAI_API_KEY, prompt, 'gpt-4o-mini', 500);
            return new Response(JSON.stringify({
              content: [{ type: 'text', text: result }],
            }), { headers });
          }

          if (name === 'expand_text') {
            const prompt = `Expand the following text to approximately ${args.targetLength || 'double'} its current length by adding relevant details, examples, and explanations while maintaining the core message:\n\n${args.text}`;
            const result = await callOpenAI(env.OPENAI_API_KEY, prompt, 'gpt-4o-mini', 2000);
            return new Response(JSON.stringify({
              content: [{ type: 'text', text: result }],
            }), { headers });
          }

          if (name === 'fix_grammar') {
            const prompt = `Fix all grammar, spelling, and punctuation errors in the following text. Return only the corrected text without explanations:\n\n${args.text}`;
            const result = await callOpenAI(env.OPENAI_API_KEY, prompt, 'gpt-4o-mini', 1000);
            return new Response(JSON.stringify({
              content: [{ type: 'text', text: result }],
            }), { headers });
          }

          if (name === 'translate_text') {
            const prompt = `Translate the following text to ${args.targetLanguage || 'Spanish'}. Maintain the tone and style of the original:\n\n${args.text}`;
            const result = await callOpenAI(env.OPENAI_API_KEY, prompt, 'gpt-4o-mini', 1500);
            return new Response(JSON.stringify({
              content: [{ type: 'text', text: result }],
            }), { headers });
          }

          if (name === 'simplify_text') {
            const level = args.readingLevel || 'general';
            const levelGuide = level === 'elementary' ? '5th grade' : level === 'high-school' ? 'high school' : 'general audience';
            const prompt = `Simplify the following text for a ${levelGuide} reading level. Use simpler words and shorter sentences while keeping the main ideas:\n\n${args.text}`;
            const result = await callOpenAI(env.OPENAI_API_KEY, prompt, 'gpt-4o-mini', 1000);
            return new Response(JSON.stringify({
              content: [{ type: 'text', text: result }],
            }), { headers });
          }

          if (name === 'analyze_video_landscape') {
            const youtubeAPI = new YouTubeAPI(env.YOUTUBE_API_KEY);
            const videos = await youtubeAPI.searchVideos(args.query, args.maxVideos || 10);
            
            // Create analysis prompt with video data
            const videoSummary = videos.map(v => ({
              title: v.title,
              channelTitle: v.channelTitle,
              viewCount: v.viewCount,
              publishedAt: v.publishedAt,
              duration: v.duration,
              description: v.description.substring(0, 200) + '...',
              url: v.url,
              thumbnail: v.thumbnail.medium
            }));
            
            const prompt = `Analyze these existing YouTube videos about "${args.query}" and suggest unique angles for new content.

Existing videos:
${JSON.stringify(videoSummary, null, 2)}

Based on this analysis, please provide:
1. Common themes and approaches in existing videos
2. Gaps or underserved aspects of the topic
3. 5 unique video ideas that would stand out
4. Recommended video length and style for each idea
5. Target audience for each suggestion

Format your response with clear sections and include specific details about how each suggestion differs from existing content.`;

            const analysis = await callOpenAI(env.OPENAI_API_KEY, prompt, 'gpt-4o-mini', 2000);
            
            return new Response(JSON.stringify({
              content: [
                {
                  type: 'text',
                  text: `# Video Landscape Analysis for: ${args.query}\n\n## Analyzed ${videos.length} existing videos\n\n${analysis}\n\n## Existing Videos Analyzed:\n${videos.map(v => `- [${v.title}](${v.url}) - ${v.channelTitle} (${v.viewCount} views)`).join('\n')}`
                }
              ],
              metadata: {
                videosAnalyzed: videos.length,
                videos: videoSummary
              }
            }), { headers });
          }

          if (name === 'analyze_video_comments') {
            const youtubeAPI = new YouTubeAPI(env.YOUTUBE_API_KEY);
            const comments = await youtubeAPI.fetchVideoComments(args.videoId, args.maxComments || 100);
            
            if (comments.length === 0) {
              return new Response(JSON.stringify({
                content: [{ type: 'text', text: 'No comments found for this video or comments are disabled.' }],
              }), { headers });
            }
            
            const commentSummary = comments.slice(0, 50).map(c => ({
              text: c.text.substring(0, 200),
              likes: c.likeCount,
              author: c.author
            }));
            
            const prompt = `Analyze these YouTube comments to identify sentiment, themes, and viewer feedback.

Comments (showing most relevant):
${JSON.stringify(commentSummary, null, 2)}

Please provide:
1. Overall sentiment analysis (positive/negative/neutral breakdown)
2. Top 5 recurring themes or topics mentioned
3. Main complaints or issues raised by viewers
4. Most praised aspects of the video
5. Suggestions for improvement based on viewer feedback
6. Engagement insights (what drives most discussion)

Format your response with clear sections and actionable insights.`;

            const analysis = await callOpenAI(env.OPENAI_API_KEY, prompt, 'gpt-4o-mini', 1500);
            
            return new Response(JSON.stringify({
              content: [
                {
                  type: 'text',
                  text: `# Comment Analysis for Video: ${args.videoId}\n\n## Analyzed ${comments.length} comments\n\n${analysis}`
                }
              ],
              metadata: {
                totalComments: comments.length,
                topComments: comments.slice(0, 5)
              }
            }), { headers });
          }

          if (name === 'generate_video_script') {
            const durationMap = {
              'short': '60-90 seconds (YouTube Shorts)',
              'medium': '5-10 minutes',
              'long': '15-20 minutes'
            };
            
            const prompt = `Generate a complete YouTube video script for the following:

Topic: ${args.topic}
Duration: ${durationMap[args.duration || 'medium']}
Style: ${args.style || 'educational'}
Target Audience: ${args.targetAudience || 'General audience'}

Please include:
1. Hook (first 5-10 seconds to grab attention)
2. Introduction (brief overview of what will be covered)
3. Main content (organized into clear sections)
4. Transitions between sections
5. Call-to-action (subscribe, like, comment prompts)
6. Outro (summary and next video teaser)

Additional requirements:
- Include timestamps for each section
- Add visual/B-roll suggestions in [brackets]
- Include engagement prompts throughout
- Make it conversational and engaging
- Include relevant examples and analogies

Format the script with clear sections and speaking notes.`;

            const script = await callOpenAI(env.OPENAI_API_KEY, prompt, 'gpt-4o-mini', 2500);
            
            return new Response(JSON.stringify({
              content: [
                {
                  type: 'text',
                  text: `# YouTube Video Script: ${args.topic}\n\n**Duration:** ${durationMap[args.duration || 'medium']}\n**Style:** ${args.style || 'educational'}\n**Target Audience:** ${args.targetAudience || 'General audience'}\n\n${script}`
                }
              ]
            }), { headers });
          }

          if (name === 'extract_youtube_seo') {
            const youtubeAPI = new YouTubeAPI(env.YOUTUBE_API_KEY);
            const videos = await youtubeAPI.searchVideos(args.query, args.competitors || 10);
            
            const videoData = videos.map(v => ({
              title: v.title,
              description: v.description.substring(0, 500),
              viewCount: v.viewCount,
              channelTitle: v.channelTitle
            }));
            
            const prompt = `Analyze these successful YouTube videos about "${args.query}" to extract SEO insights.

Videos:
${JSON.stringify(videoData, null, 2)}

Please provide:
1. Top 15-20 keywords that appear frequently in titles
2. Common title formulas and patterns
3. Description optimization techniques used
4. Recommended tags (20-30 tags)
5. Best performing title structures
6. Thumbnail text suggestions
7. SEO score factors that seem to drive views

Format as actionable SEO recommendations with specific examples.`;

            const seoAnalysis = await callOpenAI(env.OPENAI_API_KEY, prompt, 'gpt-4o-mini', 2000);
            
            return new Response(JSON.stringify({
              content: [
                {
                  type: 'text',
                  text: `# YouTube SEO Analysis: ${args.query}\n\n## Analyzed ${videos.length} top-performing videos\n\n${seoAnalysis}`
                }
              ],
              metadata: {
                videosAnalyzed: videos.length,
                avgViewCount: Math.round(videos.reduce((sum, v) => sum + parseInt(v.viewCount || '0'), 0) / videos.length)
              }
            }), { headers });
          }

          if (name === 'compare_videos') {
            const youtubeAPI = new YouTubeAPI(env.YOUTUBE_API_KEY);
            const videoData = [];
            
            // Fetch data for each video
            for (const videoId of args.videoIds) {
              try {
                const videos = await youtubeAPI.searchVideos(videoId, 1);
                if (videos.length > 0) {
                  videoData.push(videos[0]);
                }
              } catch (error) {
                console.error(`Failed to fetch video ${videoId}:`, error);
              }
            }
            
            if (videoData.length === 0) {
              return new Response(JSON.stringify({
                content: [{ type: 'text', text: 'No valid videos found for comparison.' }],
              }), { headers });
            }
            
            const comparisonData = videoData.map(v => ({
              videoId: v.videoId,
              title: v.title,
              channelTitle: v.channelTitle,
              viewCount: parseInt(v.viewCount || '0'),
              publishedAt: v.publishedAt,
              duration: v.duration,
              url: v.url
            }));
            
            const prompt = `Compare these YouTube videos and provide performance insights:

Videos:
${JSON.stringify(comparisonData, null, 2)}

Please analyze:
1. View count comparison and performance ranking
2. Title effectiveness comparison
3. Publishing timing analysis
4. Duration optimization insights
5. Channel size impact on views
6. Key success factors for top performer
7. Recommendations for underperforming videos

Provide specific, actionable insights for content creators.`;

            const comparison = await callOpenAI(env.OPENAI_API_KEY, prompt, 'gpt-4o-mini', 1500);
            
            return new Response(JSON.stringify({
              content: [
                {
                  type: 'text',
                  text: `# Video Performance Comparison\n\n## Comparing ${videoData.length} videos\n\n${comparison}\n\n## Videos Analyzed:\n${videoData.map(v => `- [${v.title}](${v.url}) - ${v.viewCount} views`).join('\n')}`
                }
              ],
              metadata: {
                videosCompared: videoData.length,
                videos: comparisonData
              }
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