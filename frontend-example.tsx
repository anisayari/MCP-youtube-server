// Frontend React/Next.js pour afficher correctement les données

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

interface AgentThinkingStep {
  step: number;
  timestamp: string;
  phase: string;
  action: string;
  reasoning: string;
  results: any;
}

interface ScriptData {
  id: string;
  title: string;
  prompt: string;
  createdAt: string;
  agentThinking: AgentThinkingStep[];
  youtubeSources: any[];
  seoData: any;
  storylineStructure: Record<string, string>;
  script: any[];
  performance: any;
}

// Page principale qui affiche le document
export default function DocPage() {
  const searchParams = useSearchParams();
  const scriptId = searchParams.get('id');
  const [scriptData, setScriptData] = useState<ScriptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!scriptId) {
      setError('No script ID provided');
      setLoading(false);
      return;
    }

    // Récupérer les données depuis votre serveur MCP
    fetch(`/api/scripts/${scriptId}`)
      .then(res => {
        if (!res.ok) throw new Error('Script not found');
        return res.json();
      })
      .then(data => {
        setScriptData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [scriptId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !scriptData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">Error: {error || 'Script not found'}</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{scriptData.title}</h1>
        <p className="text-gray-600">Prompt: {scriptData.prompt}</p>
        <p className="text-sm text-gray-500">
          Created: {new Date(scriptData.createdAt).toLocaleString()}
        </p>
      </div>

      {/* Agent Thinking Process */}
      <AgentThinkingDisplay steps={scriptData.agentThinking} />

      {/* YouTube Sources */}
      <YouTubeSourcesDisplay sources={scriptData.youtubeSources} />

      {/* SEO Insights */}
      <SEOInsightsDisplay data={scriptData.seoData} />

      {/* Script Structure */}
      <StorylineStructureDisplay structure={scriptData.storylineStructure} />

      {/* Full Script */}
      <ScriptDisplay script={scriptData.script} />

      {/* Performance Predictions */}
      <PerformanceDisplay performance={scriptData.performance} />
    </div>
  );
}

// Composant pour afficher le processus de réflexion
function AgentThinkingDisplay({ steps }: { steps: AgentThinkingStep[] }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-blue-50 rounded-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold flex items-center">
          <span className="mr-2">🤖</span>
          Processus de Réflexion de l'Agent
        </h2>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-blue-600 hover:text-blue-800"
        >
          {expanded ? 'Réduire' : 'Développer'}
        </button>
      </div>

      {expanded && (
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div
              key={index}
              className="bg-white rounded-lg p-4 border-l-4 border-blue-500"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="inline-block bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded">
                    Étape {step.step}
                  </span>
                  <h3 className="font-semibold mt-1">{step.phase}</h3>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(step.timestamp).toLocaleTimeString()}
                </span>
              </div>
              
              <p className="text-gray-700 italic mb-3">{step.reasoning}</p>
              
              {step.results && (
                <div className="bg-gray-50 rounded p-3">
                  <details>
                    <summary className="cursor-pointer text-sm font-medium">
                      Voir les résultats
                    </summary>
                    <pre className="mt-2 text-xs overflow-x-auto">
                      {JSON.stringify(step.results, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Composant pour afficher les sources YouTube
function YouTubeSourcesDisplay({ sources }: { sources: any[] }) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold mb-4 flex items-center">
        <span className="mr-2">📺</span>
        Sources YouTube Analysées
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sources.map((source, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
            <img
              src={source.thumbnail}
              alt={source.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                {source.title}
              </h3>
              <p className="text-gray-600 text-sm mb-2">
                {source.channel} • {source.views} vues
              </p>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Voir la vidéo →
              </a>
              
              {source.keyInsights && source.keyInsights.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {source.keyInsights.map((insight: string, i: number) => (
                    <span
                      key={i}
                      className="text-xs bg-gray-100 px-2 py-1 rounded"
                    >
                      {insight}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Composant pour afficher les insights SEO
function SEOInsightsDisplay({ data }: { data: any }) {
  if (!data) return null;

  return (
    <div className="bg-green-50 rounded-lg p-6 mb-8">
      <h2 className="text-2xl font-semibold mb-4 flex items-center">
        <span className="mr-2">🎯</span>
        Insights SEO
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-2">Mots-clés principaux</h3>
          <div className="flex flex-wrap gap-2">
            {data.keywords?.map((keyword: string, i: number) => (
              <span
                key={i}
                className="bg-green-200 text-green-800 px-3 py-1 rounded-full text-sm"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
        
        <div>
          <h3 className="font-semibold mb-2">Tags recommandés</h3>
          <div className="flex flex-wrap gap-2">
            {data.tags?.map((tag: string, i: number) => (
              <span
                key={i}
                className="bg-blue-200 text-blue-800 px-3 py-1 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
      
      {data.optimalLength && (
        <div className="mt-4">
          <p className="text-sm">
            <strong>Durée optimale:</strong> {data.optimalLength}
          </p>
        </div>
      )}
    </div>
  );
}

// Composant pour afficher la structure
function StorylineStructureDisplay({ structure }: { structure: Record<string, string> }) {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold mb-4">📋 Structure du Script</h2>
      
      <div className="bg-gray-50 rounded-lg p-6">
        {Object.entries(structure).map(([section, description], index) => (
          <div
            key={index}
            className="flex items-start mb-4 last:mb-0"
          >
            <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mr-4">
              {index + 1}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{section}</h3>
              <p className="text-gray-600">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Composant pour afficher le script
function ScriptDisplay({ script }: { script: any[] }) {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold mb-4">📝 Script Complet</h2>
      
      <div className="space-y-6">
        {script.map((section, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">{section.section}</h3>
              <span className="bg-gray-100 px-3 py-1 rounded text-sm">
                {section.time}
              </span>
            </div>
            
            <p className="text-gray-800 mb-4">{section.content}</p>
            
            {section.visualSuggestions && (
              <div className="bg-yellow-50 p-3 rounded">
                <p className="text-sm">
                  <strong>💡 Suggestions visuelles:</strong>{' '}
                  {section.visualSuggestions.join(', ')}
                </p>
              </div>
            )}
            
            {section.engagementHook && (
              <div className="bg-blue-50 p-3 rounded mt-2">
                <p className="text-sm">
                  <strong>🎣 Hook:</strong> {section.engagementHook}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Composant pour afficher les prédictions de performance
function PerformanceDisplay({ performance }: { performance: any }) {
  if (!performance) return null;

  return (
    <div className="bg-purple-50 rounded-lg p-6">
      <h2 className="text-2xl font-semibold mb-4">📊 Prédictions de Performance</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-3xl font-bold text-purple-600">
            {performance.predictedViews?.toLocaleString() || 'N/A'}
          </p>
          <p className="text-gray-600">Vues prédites</p>
        </div>
        
        <div className="text-center">
          <p className="text-3xl font-bold text-purple-600">
            {performance.engagementRate || 'N/A'}%
          </p>
          <p className="text-gray-600">Taux d'engagement</p>
        </div>
        
        <div className="text-center">
          <p className="text-3xl font-bold text-purple-600">
            {performance.qualityScore || 'N/A'}/10
          </p>
          <p className="text-gray-600">Score de qualité</p>
        </div>
      </div>
    </div>
  );
}