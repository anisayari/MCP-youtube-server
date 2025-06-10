# Guide pour Visualiser les Logs du Worker

## 🎯 Workers Logs est maintenant activé !

Avec un taux d'échantillonnage de 100%, vous capturez TOUS les logs.

## 📊 Comment voir les logs

### 1. Dashboard Cloudflare (Interface Web)

1. Allez sur https://dash.cloudflare.com
2. Workers & Pages → `youtube-mcp-server`
3. Onglet **"Logs"**
4. Vous verrez :
   - **Live logs** : Logs en temps réel
   - **Historical logs** : Logs historiques

### 2. Wrangler CLI (Temps Réel)

```bash
# Voir tous les logs en temps réel
npx wrangler tail

# Filtrer par statut
npx wrangler tail --status error
npx wrangler tail --status ok

# Filtrer par IP
npx wrangler tail --ip YOUR_IP

# Filtrer par méthode
npx wrangler tail --method POST
```

### 3. Filtres Utiles pour Déboguer

```bash
# Voir uniquement les recherches YouTube
npx wrangler tail | grep -E "(YouTube Search|YouTubeAPI|MCP.*search)"

# Voir uniquement les erreurs
npx wrangler tail | grep -E "(Error|error|failed|Failed)"

# Voir les appels MCP
npx wrangler tail | grep "MCP"

# Voir le cache
npx wrangler tail | grep -E "(Cache hit|Cache miss)"
```

## 🔍 Ce que vous devriez voir dans les logs

### Cas de succès :
```
[YouTube Search] Query: "javascript tutorial", MaxResults: 20
[YouTube Search] Cache miss, fetching from YouTube API...
[YouTubeAPI] Searching for: "javascript tutorial" with maxResults: 20
[YouTubeAPI] Request URL: https://www.googleapis.com/youtube/v3/search?part=snippet&q=javascript+tutorial...
[YouTubeAPI] Response status: 200
[YouTubeAPI] Found 20 items
[YouTubeAPI] Video IDs for stats: VIDEO_ID1,VIDEO_ID2,...
[YouTubeAPI] Fetching stats...
[YouTubeAPI] Stats response status: 200
[YouTubeAPI] Got stats for 20 videos
[YouTube Search] Found 20 videos for query: "javascript tutorial"
```

### Cas d'erreur - API Key :
```
[YouTubeAPI] Response status: 403
[YouTubeAPI] Error response: {
  "error": {
    "code": 403,
    "message": "The request is missing a valid API key."
  }
}
```

### Cas d'erreur - Quota dépassé :
```
[YouTubeAPI] Response status: 403
[YouTubeAPI] Error response: {
  "error": {
    "code": 403,
    "message": "The request cannot be completed because you have exceeded your quota."
  }
}
```

### Cas d'erreur - Query vide :
```
[YouTube Search] Query: "", MaxResults: 20
[YouTube Search] Missing query parameter
```

## 📝 Structure des Logs

Chaque requête génère :

1. **Request Log** (automatique) :
   ```json
   {
     "timestamp": "2024-06-10T14:30:00Z",
     "method": "POST",
     "url": "/mcp",
     "cf": {
       "country": "US",
       "city": "San Francisco"
     }
   }
   ```

2. **Console Logs** (vos `console.log`) :
   ```
   [MCP] search_youtube_videos called with query: "react hooks", maxResults: 10
   [YouTubeAPI] Searching for: "react hooks" with maxResults: 10
   ```

3. **Response Log** (automatique) :
   ```json
   {
     "status": 200,
     "duration": 245.3
   }
   ```

## 🚨 Déboguer "Found 0 relevant sources"

Dans les logs, cherchez :

1. **L'agent appelle-t-il votre serveur ?**
   - ✅ Si vous voyez `[MCP] search_youtube_videos called`
   - ❌ Si vous ne voyez aucun log

2. **La query est-elle correcte ?**
   - ✅ `Query: "votre recherche"`
   - ❌ `Query: ""` ou `Query: undefined`

3. **YouTube répond-il ?**
   - ✅ `[YouTubeAPI] Found X items`
   - ❌ `[YouTubeAPI] Error response`

4. **Le cache fonctionne-t-il ?**
   - Premier appel : `Cache miss`
   - Appels suivants : `Cache hit`

## 🛠️ Commandes de Debug Avancées

```bash
# Export des logs (dernières 24h)
npx wrangler tail --format json > logs.json

# Analyser les patterns d'erreur
npx wrangler tail | grep -A 5 -B 5 "Error"

# Compter les requêtes par endpoint
npx wrangler tail --format json | jq '.url' | sort | uniq -c

# Voir la performance moyenne
npx wrangler tail --format json | jq '.duration' | awk '{sum+=$1; count++} END {print "Avg:", sum/count, "ms"}'
```

## 💡 Tips

1. **Gardez la fenêtre de logs ouverte** pendant que vous testez
2. **Utilisez des marqueurs uniques** dans vos logs :
   ```javascript
   console.log(`[DEBUG-${Date.now()}] Starting search for: ${query}`);
   ```
3. **Testez avec des queries simples** comme "test" pour isoler les problèmes

## 🔗 Liens Utiles

- [Workers Logs Documentation](https://developers.cloudflare.com/workers/observability/logs/)
- [Wrangler tail Documentation](https://developers.cloudflare.com/workers/wrangler/commands/#tail)
- [Log Filtering Guide](https://developers.cloudflare.com/workers/observability/logs/tail/)

Maintenant, lancez `npx wrangler tail` et déclenchez une recherche depuis votre agent pour voir exactement ce qui se passe !