#!/usr/bin/env node

// Script de debug pour tester la recherche YouTube

const API_URL = 'https://youtube-mcp-server.anis-ayari-perso.workers.dev';

async function testYouTubeSearch() {
  console.log('🔍 Testing YouTube Search...\n');

  // Test 1: Direct REST endpoint
  console.log('1. Testing REST endpoint /youtube/search');
  try {
    const response = await fetch(`${API_URL}/youtube/search?query=javascript&maxResults=2`);
    console.log(`   Status: ${response.status}`);
    const data = await response.json();
    console.log(`   Response: ${JSON.stringify(data, null, 2).substring(0, 500)}...`);
  } catch (error) {
    console.error(`   Error: ${error.message}`);
  }

  console.log('\n2. Testing MCP endpoint search_youtube_videos');
  try {
    const response = await fetch(`${API_URL}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'tools/call',
        params: {
          name: 'search_youtube_videos',
          arguments: {
            query: 'python tutorial',
            maxResults: 2
          }
        }
      })
    });
    console.log(`   Status: ${response.status}`);
    const data = await response.json();
    
    if (data.error) {
      console.error(`   Error: ${data.error}`);
    } else {
      console.log(`   Success: Found results`);
      // Parse the content to check number of videos
      try {
        const content = JSON.parse(data.content[0].text);
        console.log(`   Videos found: ${content.length}`);
        if (content.length > 0) {
          console.log(`   First video: ${content[0].title}`);
        }
      } catch (e) {
        console.log(`   Raw response: ${JSON.stringify(data).substring(0, 200)}...`);
      }
    }
  } catch (error) {
    console.error(`   Error: ${error.message}`);
  }

  console.log('\n3. Testing with empty query (should fail)');
  try {
    const response = await fetch(`${API_URL}/youtube/search?query=&maxResults=2`);
    console.log(`   Status: ${response.status}`);
    const data = await response.json();
    console.log(`   Response: ${JSON.stringify(data)}`);
  } catch (error) {
    console.error(`   Error: ${error.message}`);
  }

  console.log('\n4. Testing cache (second identical request)');
  const startTime = Date.now();
  try {
    const response = await fetch(`${API_URL}/youtube/search?query=javascript&maxResults=2`);
    const elapsed = Date.now() - startTime;
    console.log(`   Status: ${response.status}`);
    console.log(`   Time: ${elapsed}ms (should be faster if cached)`);
    const data = await response.json();
    console.log(`   Videos returned: ${data.length}`);
  } catch (error) {
    console.error(`   Error: ${error.message}`);
  }
}

// Run the tests
testYouTubeSearch().catch(console.error);