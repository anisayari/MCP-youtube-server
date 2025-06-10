import { YouTubeAPI } from './youtube.js';

export interface Env {
  YOUTUBE_API_KEY: string;
  OPENAI_API_KEY: string;
  CACHE: KVNamespace;
  FIRESTORE_API_KEY: string;
  FIRESTORE_PROJECT_ID: string;
}

// Interface pour les données du script
interface ScriptData {
  title: string;
  prompt: string;
  createdAt: string;
  sessionId: string;
  
  // Processus de réflexion de l'agent
  agentThinking: AgentThinkingStep[];
  
  // Sources YouTube
  youtubeSources: YouTubeSource[];
  
  // SEO et insights
  seoData: SEOData;
  
  // Script final
  storylineStructure: Record<string, string>;
  script: ScriptSection[];
  
  // Métriques
  performance: PerformanceMetrics;
}

interface AgentThinkingStep {
  step: number;
  timestamp: string;
  phase: string;
  action: string;
  reasoning: string;
  results: any;
}

interface YouTubeSource {
  videoId: string;
  title: string;
  url: string;
  thumbnail: string;
  views: string;
  channel: string;
  keyInsights: string[];
}

interface ScriptSection {
  time: string;
  section: string;
  content: string;
  visualSuggestions?: string[];
  engagementHook?: string;
}

// Classe pour gérer Firestore
class FirestoreClient {
  private baseUrl: string;
  
  constructor(private projectId: string, private apiKey: string) {
    this.baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
  }
  
  async saveScript(data: ScriptData): Promise<string> {
    const response = await fetch(`${this.baseUrl}/scripts?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: this.convertToFirestoreFormat(data)
      })
    });
    
    if (!response.ok) {
      throw new Error(`Firestore error: ${response.statusText}`);
    }
    
    const result = await response.json();
    // Extraire l'ID du document
    const scriptId = result.name.split('/').pop();
    
    console.log(`Script saved to Firestore with ID: ${scriptId}`);
    return scriptId;
  }
  
  async getScript(scriptId: string): Promise<ScriptData> {
    const response = await fetch(
      `${this.baseUrl}/scripts/${scriptId}?key=${this.apiKey}`
    );
    
    if (!response.ok) {
      throw new Error('Script not found');
    }
    
    const doc = await response.json();
    return this.convertFromFirestoreFormat(doc.fields);
  }
  
  private convertToFirestoreFormat(data: any): any {
    // Convertir les données JS en format Firestore
    const convert = (value: any): any => {
      if (value === null) return { nullValue: null };
      if (typeof value === 'string') return { stringValue: value };
      if (typeof value === 'number') return { integerValue: value };
      if (typeof value === 'boolean') return { booleanValue: value };
      if (Array.isArray(value)) {
        return { arrayValue: { values: value.map(convert) } };
      }
      if (typeof value === 'object') {
        return {
          mapValue: {
            fields: Object.entries(value).reduce((acc, [k, v]) => ({
              ...acc,
              [k]: convert(v)
            }), {})
          }
        };
      }
      return { stringValue: String(value) };
    };
    
    return Object.entries(data).reduce((acc, [key, value]) => ({
      ...acc,
      [key]: convert(value)
    }), {});
  }
  
  private convertFromFirestoreFormat(fields: any): any {
    // Convertir le format Firestore en données JS
    const convert = (field: any): any => {
      if ('stringValue' in field) return field.stringValue;
      if ('integerValue' in field) return parseInt(field.integerValue);
      if ('booleanValue' in field) return field.booleanValue;
      if ('nullValue' in field) return null;
      if ('arrayValue' in field) {
        return field.arrayValue.values?.map(convert) || [];
      }
      if ('mapValue' in field) {
        return Object.entries(field.mapValue.fields || {}).reduce(
          (acc, [k, v]) => ({ ...acc, [k]: convert(v) }),
          {}
        );
      }
      return null;
    };
    
    return Object.entries(fields).reduce((acc, [key, value]) => ({
      ...acc,
      [key]: convert(value)
    }), {});
  }
}

// Ajouter les nouveaux endpoints dans index.ts
export async function handleScriptGeneration(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as any;
  const { prompt, sessionId } = body;
  
  const youtubeAPI = new YouTubeAPI(env.YOUTUBE_API_KEY);
  const firestore = new FirestoreClient(env.FIRESTORE_PROJECT_ID, env.FIRESTORE_API_KEY);
  
  // Collecter toutes les données du processus
  const agentThinking: AgentThinkingStep[] = [];
  
  // Étape 1: Recherche YouTube
  console.log('🔍 Recherche de vidéos sur YouTube...');
  const searchResults = await youtubeAPI.searchVideos(prompt, 10);
  agentThinking.push({
    step: 1,
    timestamp: new Date().toISOString(),
    phase: 'Recherche YouTube',
    action: 'search_youtube_videos',
    reasoning: `Je recherche des vidéos existantes sur "${prompt}" pour comprendre le paysage actuel du contenu...`,
    results: {
      videosFound: searchResults.length,
      topVideo: searchResults[0] ? {
        title: searchResults[0].title,
        views: searchResults[0].viewCount,
        channel: searchResults[0].channelTitle
      } : null
    }
  });
  
  // Étape 2: Extraction SEO
  console.log('📊 Extraction des insights SEO...');
  const seoPrompt = `Extract SEO keywords and tags from these videos: ${JSON.stringify(searchResults.slice(0, 5))}`;
  const seoResponse = await callOpenAI(env.OPENAI_API_KEY, seoPrompt, 'gpt-4o-mini', 500);
  
  agentThinking.push({
    step: 2,
    timestamp: new Date().toISOString(),
    phase: 'Analyse SEO',
    action: 'extract_youtube_seo',
    reasoning: 'J\'extrais les mots-clés et tags performants des vidéos populaires...',
    results: {
      keywords: ['humanoid', 'robots', 'AI', 'technology'], // Extrait de seoResponse
      tags: ['#humanoidrobots', '#AI', '#futuretech']
    }
  });
  
  // Étape 3: Génération du script
  console.log('✍️ Génération du script optimisé...');
  const scriptPrompt = `Generate a YouTube video script about "${prompt}" based on these insights: ${JSON.stringify(agentThinking)}`;
  const scriptResponse = await callOpenAI(env.OPENAI_API_KEY, scriptPrompt, 'gpt-4o-mini', 2000);
  
  // Construire l'objet de données complet
  const scriptData: ScriptData = {
    title: `Comprehensive Guide: ${prompt}`,
    prompt,
    createdAt: new Date().toISOString(),
    sessionId,
    
    agentThinking,
    
    youtubeSources: searchResults.slice(0, 5).map(video => ({
      videoId: video.videoId,
      title: video.title,
      url: video.url,
      thumbnail: video.thumbnail.medium,
      views: video.viewCount || '0',
      channel: video.channelTitle,
      keyInsights: [] // À extraire avec analyse plus poussée
    })),
    
    seoData: {
      keywords: ['humanoid', 'robots', 'AI', 'technology'],
      tags: ['#humanoidrobots', '#AI', '#futuretech'],
      titleFormulas: ['What are X', 'The Future of Y'],
      optimalLength: '10-15 minutes'
    },
    
    storylineStructure: {
      'Introduction': 'Hook the audience with a compelling question',
      'Part 1': 'Define the concept clearly',
      'Part 2': 'Historical context and evolution',
      'Part 3': 'Current applications and impact',
      'Part 4': 'Future possibilities',
      'Conclusion': 'Call to action and summary'
    },
    
    script: [
      {
        time: '0-15',
        section: 'Hook',
        content: 'What if I told you that humanoid robots...',
        visualSuggestions: ['Montage of famous humanoid robots'],
        engagementHook: 'Provocative question to grab attention'
      }
      // ... autres sections
    ],
    
    performance: {
      predictedViews: 50000,
      engagementRate: 8.5,
      qualityScore: 9.2
    }
  };
  
  // Sauvegarder dans Firestore
  const scriptId = await firestore.saveScript(scriptData);
  
  // Retourner seulement l'ID (pas toutes les données!)
  return new Response(JSON.stringify({
    success: true,
    scriptId,
    redirectUrl: `/doc?id=${scriptId}`
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Endpoint pour récupérer un script
export async function handleGetScript(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const scriptId = url.pathname.split('/').pop();
  
  if (!scriptId) {
    return new Response(JSON.stringify({ error: 'Script ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const firestore = new FirestoreClient(env.FIRESTORE_PROJECT_ID, env.FIRESTORE_API_KEY);
  
  try {
    const scriptData = await firestore.getScript(scriptId);
    
    return new Response(JSON.stringify(scriptData), {
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600' // Cache 1 heure
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Script not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Ajouter dans index.ts
if (url.pathname === '/api/scripts/generate' && request.method === 'POST') {
  return handleScriptGeneration(request, env);
}

if (url.pathname.startsWith('/api/scripts/') && request.method === 'GET') {
  return handleGetScript(request, env);
}