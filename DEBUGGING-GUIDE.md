# Guide de Débogage - YouTube MCP Server

## 🔍 Le Problème: "Found 0 relevant sources"

Si votre agent affiche "Research completed. Found 0 relevant sources", voici comment déboguer :

## 1. Vérifier les Logs du Worker

### Option A: Dashboard Cloudflare
1. Allez sur https://dash.cloudflare.com
2. Workers & Pages → Votre worker
3. Onglet "Logs" → "Begin log stream"

### Option B: Wrangler CLI (Recommandé)
```bash
npx wrangler tail
```

Cela affichera les logs en temps réel comme :
```
[YouTube Search] Query: "javascript", MaxResults: 20
[YouTube Search] Cache miss, fetching from YouTube API...
[YouTubeAPI] Searching for: "javascript" with maxResults: 20
[YouTubeAPI] Response status: 200
[YouTubeAPI] Found 20 items
[YouTube Search] Found 20 videos for query: "javascript"
```

## 2. Points de Vérification

### A. L'agent appelle-t-il le bon endpoint ?

Vérifiez dans les logs si vous voyez :
- `[MCP] search_youtube_videos called with query: "..."`
- Ou `[YouTube Search] Query: "..."`

Si vous ne voyez rien, l'agent n'appelle pas votre serveur.

### B. Y a-t-il des erreurs d'API key ?

Cherchez dans les logs :
- `[YouTubeAPI] WARNING: No API key provided!`
- `YouTube search failed: 403 Forbidden`
- `quotaExceeded`

### C. La requête est-elle vide ?

Vérifiez si :
- `[YouTube Search] Missing query parameter`
- Query est vide ou undefined

## 3. Tests Manuels

### Test Direct de l'API
```bash
# Test REST endpoint
curl "https://youtube-mcp-server.anis-ayari-perso.workers.dev/youtube/search?query=test&maxResults=5"

# Test MCP endpoint
curl -X POST "https://youtube-mcp-server.anis-ayari-perso.workers.dev/mcp" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "search_youtube_videos",
      "arguments": {"query": "python", "maxResults": 5}
    }
  }'
```

### Script de Debug Complet
```bash
node debug-youtube-search.js
```

## 4. Problèmes Courants et Solutions

### Problème 1: API Key YouTube invalide
**Symptômes:** 
- Status 403 dans les logs
- Message "The request cannot be completed because you have exceeded your quota"

**Solution:**
```bash
# Vérifier la clé actuelle
npx wrangler secret list

# Mettre à jour la clé
npx wrangler secret put YOUTUBE_API_KEY
```

### Problème 2: Cache corrompu
**Symptômes:**
- Retourne toujours 0 résultats même après fix

**Solution:**
```bash
# Vider le cache KV
npx wrangler kv:key delete --namespace-id=YOUR_KV_ID "youtube:QUERY:MAXRESULTS"
```

### Problème 3: L'agent n'utilise pas le bon tool name
**Symptômes:**
- Logs montrent d'autres tools mais pas search_youtube_videos

**Solution:**
Vérifier que l'agent utilise exactement `search_youtube_videos` et non :
- ❌ `youtube_search`
- ❌ `searchYoutubeVideos`
- ✅ `search_youtube_videos`

## 5. Format de Réponse Attendu

L'agent devrait recevoir :
```json
{
  "content": [{
    "type": "text",
    "text": "[{\"videoId\":\"...\",\"title\":\"...\",\"url\":\"...\"}]"
  }]
}
```

Si le format est différent, l'agent pourrait ne pas parser correctement.

## 6. Vérifier l'Intégration Frontend

Dans votre code frontend, assurez-vous que :

```javascript
// L'agent appelle bien l'outil
const results = await mcp.callTool('search_youtube_videos', {
  query: userQuery,  // Vérifier que userQuery n'est pas vide
  maxResults: 10
});

// Parse correctement la réponse
const videos = JSON.parse(results.content[0].text);
console.log(`Found ${videos.length} videos`);
```

## 7. Mode Debug Avancé

Ajoutez temporairement dans votre frontend :

```javascript
// Avant l'appel MCP
console.log('[Debug] Calling MCP with query:', query);

// Après l'appel MCP
console.log('[Debug] MCP response:', response);
console.log('[Debug] Parsed videos:', videos);
```

## 8. Commandes Utiles

```bash
# Voir tous les logs
npx wrangler tail

# Voir les erreurs seulement
npx wrangler tail --status error

# Voir les logs d'un tool spécifique
npx wrangler tail | grep "search_youtube_videos"

# Tester la santé du worker
curl https://youtube-mcp-server.anis-ayari-perso.workers.dev/mcp \
  -X POST -H "Content-Type: application/json" \
  -d '{"method": "tools/list"}'
```

## 9. Si Tout Échoue

1. Redéployez avec logs maximaux
2. Testez avec une query simple comme "test"
3. Vérifiez le quota YouTube API : https://console.cloud.google.com/apis/api/youtube.googleapis.com/quotas
4. Créez une nouvelle API key YouTube si nécessaire

Le problème "0 sources" est généralement dû à :
- L'agent qui n'appelle pas le bon endpoint
- Une query vide ou mal formatée
- Un problème de parsing de la réponse côté frontend