// Exemple d'intégration Firestore pour éviter les URLs longues

// ❌ MAUVAIS - Ce que vous avez actuellement
// GET /doc?data=%7B%22title%22%3A%22The+Fascinating+World...
// (URL avec toutes les données encodées)

// ✅ BON - Ce que vous devriez avoir
// GET /doc?id=BBFKFZn0RszISzy9Pwbn
// (URL avec seulement l'ID Firestore)

// Backend - Sauvegarder le script complet
async function saveScriptToFirestore(scriptData) {
  const docRef = await db.collection('scripts').add({
    title: scriptData.title,
    storyline_structure: scriptData.storyline_structure,
    script: scriptData.script,
    prompt: scriptData.prompt,
    targetDuration: scriptData.targetDuration,
    mcpServer: scriptData.mcpServer,
    searchEnabled: scriptData.searchEnabled,
    youtubeContext: scriptData.youtubeContext,
    agentThinking: scriptData.agentThinking, // NOUVEAU - Ajouter le processus de réflexion
    sources: scriptData.sources,             // NOUVEAU - Sources YouTube trouvées
    seoKeywords: scriptData.seoKeywords,    // NOUVEAU - Mots-clés SEO extraits
    createdAt: new Date(),
    sessionId: scriptData.sessionId
  });
  
  return docRef.id;
}

// Backend - Récupérer depuis Firestore
async function getScriptFromFirestore(scriptId) {
  const doc = await db.collection('scripts').doc(scriptId).get();
  
  if (!doc.exists) {
    throw new Error('Script not found');
  }
  
  return {
    id: doc.id,
    ...doc.data()
  };
}

// API endpoint pour créer un script
app.post('/api/scripts/create', async (req, res) => {
  try {
    const scriptData = req.body;
    
    // Sauvegarder dans Firestore
    const scriptId = await saveScriptToFirestore(scriptData);
    
    // Retourner seulement l'ID
    res.json({ 
      success: true, 
      scriptId: scriptId,
      redirectUrl: `/doc?id=${scriptId}` // URL courte avec juste l'ID
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API endpoint pour récupérer un script
app.get('/api/scripts/:id', async (req, res) => {
  try {
    const scriptData = await getScriptFromFirestore(req.params.id);
    res.json(scriptData);
  } catch (error) {
    res.status(404).json({ error: 'Script not found' });
  }
});

// Frontend - Page /doc
async function DocPage({ searchParams }) {
  const scriptId = searchParams.id;
  
  if (!scriptId) {
    return <div>No script ID provided</div>;
  }
  
  // Récupérer les données depuis Firestore via l'API
  const response = await fetch(`/api/scripts/${scriptId}`);
  const scriptData = await response.json();
  
  return (
    <div>
      <h1>{scriptData.title}</h1>
      
      {/* Afficher le processus de réflexion de l'agent */}
      {scriptData.agentThinking && (
        <AgentThinkingDisplay thinking={scriptData.agentThinking} />
      )}
      
      {/* Afficher les sources YouTube */}
      {scriptData.sources && (
        <YouTubeSourcesDisplay sources={scriptData.sources} />
      )}
      
      {/* Afficher la structure du script */}
      <StorylineDisplay structure={scriptData.storyline_structure} />
      
      {/* Afficher le script complet */}
      <ScriptDisplay script={scriptData.script} />
    </div>
  );
}

// Composant pour afficher le processus de réflexion
function AgentThinkingDisplay({ thinking }) {
  return (
    <div className="agent-thinking">
      <h2>🤖 Processus de Réflexion de l'Agent</h2>
      <div className="thinking-steps">
        {thinking.map((step, index) => (
          <div key={index} className="thinking-step">
            <h3>{step.phase}</h3>
            <p>{step.reasoning}</p>
            {step.data && (
              <pre>{JSON.stringify(step.data, null, 2)}</pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Structure de données pour le processus de réflexion
const agentThinkingExample = [
  {
    phase: "Analyse du Paysage Vidéo",
    reasoning: "J'ai analysé 10 vidéos existantes sur les humanoïdes. Les principales lacunes identifiées sont...",
    data: {
      videosAnalyzed: 10,
      gaps: ["Applications pratiques", "Éthique", "Comparaisons techniques"],
      avgViews: 125000
    }
  },
  {
    phase: "Extraction SEO",
    reasoning: "Les mots-clés les plus performants sont 'humanoid robots', 'AI robotics', 'future technology'...",
    data: {
      topKeywords: ["humanoid", "robots", "AI", "technology"],
      titleFormulas: ["What are X", "The Future of Y", "X Explained"]
    }
  },
  {
    phase: "Génération du Script",
    reasoning: "Basé sur l'analyse, je vais créer un script de 25 minutes qui couvre...",
    data: {
      duration: "25 minutes",
      sections: 6,
      style: "educational"
    }
  }
];