#!/usr/bin/env node

const API_URL = 'https://youtube-mcp-server.anis-ayari-perso.workers.dev';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

async function testEndpoint(name, method, url, body = null) {
  console.log(`\n${colors.blue}Testing: ${name}${colors.reset}`);
  console.log(`${colors.yellow}${method} ${url}${colors.reset}`);
  
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
      console.log(`Body: ${JSON.stringify(body, null, 2)}`);
    }
    
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`${colors.green}✓ Success (${response.status})${colors.reset}`);
      console.log(`Response: ${JSON.stringify(data, null, 2).substring(0, 500)}...`);
    } else {
      console.log(`${colors.red}✗ Failed (${response.status})${colors.reset}`);
      console.log(`Error: ${JSON.stringify(data, null, 2)}`);
    }
    
    return { success: response.ok, data };
  } catch (error) {
    console.log(`${colors.red}✗ Error: ${error.message}${colors.reset}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log(`${colors.magenta}=== MCP Server Test Suite ===${colors.reset}`);
  console.log(`Testing server at: ${API_URL}\n`);
  
  const tests = [
    // Test 1: YouTube Search REST endpoint
    {
      name: 'YouTube Search (REST)',
      method: 'GET',
      url: `${API_URL}/youtube/search?query=javascript%20tutorial&maxResults=2`
    },
    
    // Test 2: OpenAI Completion REST endpoint
    {
      name: 'OpenAI Completion (REST)',
      method: 'POST',
      url: `${API_URL}/openai/completion`,
      body: {
        prompt: 'What is 2+2? Answer in one word.',
        maxTokens: 10
      }
    },
    
    // Test 3: MCP Tools List
    {
      name: 'MCP Tools List',
      method: 'POST',
      url: `${API_URL}/mcp`,
      body: {
        method: 'tools/list'
      }
    },
    
    // Test 4: MCP YouTube Search Tool
    {
      name: 'MCP YouTube Search Tool',
      method: 'POST',
      url: `${API_URL}/mcp`,
      body: {
        method: 'tools/call',
        params: {
          name: 'search_youtube_videos',
          arguments: {
            query: 'typescript tutorial',
            maxResults: 1
          }
        }
      }
    },
    
    // Test 5: MCP OpenAI Completion Tool
    {
      name: 'MCP OpenAI Completion Tool',
      method: 'POST',
      url: `${API_URL}/mcp`,
      body: {
        method: 'tools/call',
        params: {
          name: 'openai_completion',
          arguments: {
            prompt: 'Write a haiku about coding',
            model: 'gpt-4o-mini',
            maxTokens: 100
          }
        }
      }
    },
    
    // Test 6: Error handling - Invalid endpoint
    {
      name: 'Error Handling - Invalid Endpoint',
      method: 'GET',
      url: `${API_URL}/invalid-endpoint`
    },
    
    // Test 7: Error handling - Missing parameters
    {
      name: 'Error Handling - Missing Query Parameter',
      method: 'GET',
      url: `${API_URL}/youtube/search`
    },
    
    // Test 8: Error handling - Invalid MCP tool
    {
      name: 'Error Handling - Invalid MCP Tool',
      method: 'POST',
      url: `${API_URL}/mcp`,
      body: {
        method: 'tools/call',
        params: {
          name: 'invalid_tool',
          arguments: {}
        }
      }
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const result = await testEndpoint(test.name, test.method, test.url, test.body);
    if (result.success || (test.name.includes('Error Handling') && !result.success)) {
      passed++;
    } else {
      failed++;
    }
  }
  
  console.log(`\n${colors.magenta}=== Test Summary ===${colors.reset}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`Total: ${passed + failed}`);
  
  if (failed === 0) {
    console.log(`\n${colors.green}✓ All tests passed!${colors.reset}`);
  } else {
    console.log(`\n${colors.red}✗ Some tests failed${colors.reset}`);
  }
}

// Run tests
runTests().catch(console.error);