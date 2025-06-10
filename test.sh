#!/bin/bash

echo "Testing YouTube Search endpoint..."
curl -X GET "http://localhost:8787/youtube/search?query=javascript&maxResults=2"

echo -e "\n\nTesting MCP tools/list endpoint..."
curl -X POST "http://localhost:8787/mcp" \
  -H "Content-Type: application/json" \
  -d '{"method": "tools/list"}'

echo -e "\n\nTesting MCP tools/call endpoint..."
curl -X POST "http://localhost:8787/mcp" \
  -H "Content-Type: application/json" \
  -d '{"method": "tools/call", "params": {"name": "search_youtube_videos", "arguments": {"query": "typescript tutorial", "maxResults": 1}}}'