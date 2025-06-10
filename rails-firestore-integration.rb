# Rails Controller pour intégration Firestore correcte

class ScriptsController < ApplicationController
  before_action :initialize_firestore
  
  # POST /api/scripts/generate
  def generate
    # 1. Analyser le sujet avec MCP
    agent_data = analyze_with_mcp(params[:prompt])
    
    # 2. Sauvegarder TOUT dans Firestore (pas dans l'URL!)
    script_id = save_to_firestore(agent_data)
    
    # 3. Retourner seulement l'ID
    render json: {
      success: true,
      scriptId: script_id,
      redirectUrl: "/doc?id=#{script_id}"  # URL courte avec juste l'ID
    }
  end
  
  # GET /api/scripts/:id
  def show
    script_data = @firestore.col('scripts').doc(params[:id]).get
    
    if script_data.exists?
      render json: format_script_data(script_data)
    else
      render json: { error: 'Script not found' }, status: 404
    end
  end
  
  private
  
  def analyze_with_mcp(prompt)
    mcp_client = MCPClient.new(ENV['YOUTUBE_MCP_SERVER_URL'])
    
    # Structure complète des données à sauvegarder
    {
      # Métadonnées de base
      prompt: prompt,
      createdAt: Time.now,
      sessionId: params[:sessionId],
      
      # Processus de réflexion de l'agent (NOUVEAU)
      agentThinking: [
        {
          step: 1,
          phase: "Analyse du paysage vidéo",
          timestamp: Time.now,
          action: "analyze_video_landscape",
          reasoning: "Je commence par analyser les vidéos existantes sur ce sujet...",
          result: mcp_client.analyze_video_landscape(query: prompt, maxVideos: 10)
        },
        {
          step: 2,
          phase: "Extraction SEO",
          timestamp: Time.now,
          action: "extract_youtube_seo",
          reasoning: "J'extrais les mots-clés et tags des vidéos performantes...",
          result: mcp_client.extract_youtube_seo(query: prompt, competitors: 15)
        },
        {
          step: 3,
          phase: "Analyse des commentaires",
          timestamp: Time.now,
          action: "analyze_video_comments",
          reasoning: "J'analyse les commentaires pour comprendre les besoins de l'audience...",
          result: analyze_top_video_comments(prompt)
        },
        {
          step: 4,
          phase: "Génération du script",
          timestamp: Time.now,
          action: "generate_video_script",
          reasoning: "Basé sur toutes ces données, je génère un script optimisé...",
          result: generate_optimized_script(prompt)
        }
      ],
      
      # Données YouTube trouvées
      youtubeContext: {
        videosAnalyzed: @videos_analyzed,
        sources: @youtube_sources,
        topCompetitors: @top_competitors,
        averageViews: @avg_views,
        commonThemes: @common_themes
      },
      
      # SEO et mots-clés
      seoData: {
        keywords: @extracted_keywords,
        tags: @recommended_tags,
        titleFormulas: @title_patterns,
        optimalLength: @optimal_duration
      },
      
      # Script final généré
      script: @generated_script,
      storylineStructure: @storyline_structure,
      title: @optimized_title,
      
      # Métadonnées supplémentaires
      performance: {
        predictedViews: @predicted_views,
        engagementScore: @engagement_score,
        qualityScore: @quality_score
      }
    }
  end
  
  def save_to_firestore(data)
    # Sauvegarder TOUTES les données dans Firestore
    doc_ref = @firestore.col('scripts').add(data)
    
    # Logger pour debug
    Rails.logger.info "Script saved to Firestore with ID: #{doc_ref.document_id}"
    Rails.logger.info "Data size: #{data.to_json.length} bytes"
    
    doc_ref.document_id
  end
  
  def format_script_data(firestore_doc)
    data = firestore_doc.data
    
    {
      id: firestore_doc.document_id,
      title: data[:title],
      prompt: data[:prompt],
      createdAt: data[:createdAt],
      
      # Formater le processus de réflexion pour l'affichage
      agentThinking: data[:agentThinking]&.map do |step|
        {
          step: step[:step],
          phase: step[:phase],
          reasoning: step[:reasoning],
          timestamp: step[:timestamp],
          # Résumer les résultats pour l'affichage
          summary: summarize_step_result(step[:result])
        }
      end,
      
      # Sources YouTube formatées
      youtubeSources: format_youtube_sources(data[:youtubeContext]),
      
      # SEO formaté
      seoInsights: format_seo_data(data[:seoData]),
      
      # Script et structure
      script: data[:script],
      storylineStructure: data[:storylineStructure],
      
      # Performances prédites
      predictions: data[:performance]
    }
  end
  
  def summarize_step_result(result)
    # Extraire les points clés du résultat pour l'affichage
    case result
    when Hash
      if result[:content]
        # Résultat MCP
        text = result[:content].first[:text]
        # Prendre les 200 premiers caractères
        text.length > 200 ? "#{text[0..200]}..." : text
      else
        # Autre format
        result.slice(:videosAnalyzed, :gaps, :keywords, :topResults)
      end
    else
      result.to_s[0..200]
    end
  end
  
  def format_youtube_sources(context)
    return nil unless context
    
    {
      totalVideos: context[:videosAnalyzed],
      sources: context[:sources]&.map do |source|
        {
          title: source[:title],
          url: source[:url],
          thumbnail: source[:thumbnail][:medium],
          views: source[:viewCount],
          channel: source[:channelTitle]
        }
      end,
      insights: {
        averageViews: context[:averageViews],
        commonThemes: context[:commonThemes]
      }
    }
  end
end

# Vue/React Component Example
# components/DocPage.jsx
function DocPage() {
  const { id } = useParams();
  const [scriptData, setScriptData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Récupérer les données avec juste l'ID
    fetch(`/api/scripts/${id}`)
      .then(res => res.json())
      .then(data => {
        setScriptData(data);
        setLoading(false);
      });
  }, [id]);
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div className="doc-page">
      <h1>{scriptData.title}</h1>
      
      {/* Afficher le processus de réflexion de l'agent */}
      <AgentThinkingProcess steps={scriptData.agentThinking} />
      
      {/* Afficher les sources YouTube */}
      <YouTubeSources data={scriptData.youtubeSources} />
      
      {/* Afficher les insights SEO */}
      <SEOInsights data={scriptData.seoInsights} />
      
      {/* Afficher le script */}
      <ScriptDisplay 
        structure={scriptData.storylineStructure}
        script={scriptData.script}
      />
    </div>
  );
}