#!/usr/bin/env node

const API_URL = 'https://youtube-mcp-server.anis-ayari-perso.workers.dev';

async function testTextTool(toolName, args) {
  console.log(`\n🔧 Testing: ${toolName}`);
  console.log('Arguments:', args);
  
  try {
    const response = await fetch(`${API_URL}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: args
        }
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Success!');
      console.log('Result:', data.content[0].text.substring(0, 300) + '...');
    } else {
      console.log('❌ Failed:', data.error);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

async function testVideoLandscapeAnalysis() {
  console.log('\n🎥 Testing Video Landscape Analysis');
  
  try {
    const response = await fetch(`${API_URL}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'tools/call',
        params: {
          name: 'analyze_video_landscape',
          arguments: {
            query: 'JavaScript tutorial for beginners',
            maxVideos: 5
          }
        }
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Success!');
      console.log('\nAnalysis Preview:');
      console.log(data.content[0].text.substring(0, 500) + '...');
      
      if (data.metadata && data.metadata.videos) {
        console.log('\n📊 Videos Analyzed:');
        data.metadata.videos.forEach(v => {
          console.log(`- ${v.title}`);
          console.log(`  Channel: ${v.channelTitle}`);
          console.log(`  Views: ${v.viewCount}`);
          console.log(`  Thumbnail: ${v.thumbnail}`);
          console.log(`  URL: ${v.url}`);
          console.log('');
        });
      }
    } else {
      console.log('❌ Failed:', data.error);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

async function runTests() {
  console.log('🧪 Testing Text Enhancement Tools\n');
  
  const sampleText = "JavaScript is a programming language. It is used for web development. Many developers use it.";
  
  // Test all text tools
  await testTextTool('rewrite_text', {
    text: sampleText,
    style: 'professional'
  });
  
  await testTextTool('summarize_text', {
    text: sampleText,
    length: 'short'
  });
  
  await testTextTool('expand_text', {
    text: sampleText,
    targetLength: 'double'
  });
  
  await testTextTool('fix_grammar', {
    text: "javascript are a programing langauge"
  });
  
  await testTextTool('translate_text', {
    text: sampleText,
    targetLanguage: 'French'
  });
  
  await testTextTool('simplify_text', {
    text: "JavaScript utilizes asynchronous programming paradigms to facilitate non-blocking operations.",
    readingLevel: 'elementary'
  });
  
  // Test video landscape analysis
  await testVideoLandscapeAnalysis();
}

runTests().catch(console.error);