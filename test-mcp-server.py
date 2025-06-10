#!/usr/bin/env python3

import requests
import json
import sys
from typing import Dict, Any, Optional

# ANSI color codes
class Colors:
    RESET = '\033[0m'
    GREEN = '\033[32m'
    RED = '\033[31m'
    YELLOW = '\033[33m'
    BLUE = '\033[34m'
    MAGENTA = '\033[35m'

API_URL = 'https://youtube-mcp-server.anis-ayari-perso.workers.dev'

def test_endpoint(name: str, method: str, url: str, body: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Test a single endpoint and print results."""
    print(f"\n{Colors.BLUE}Testing: {name}{Colors.RESET}")
    print(f"{Colors.YELLOW}{method} {url}{Colors.RESET}")
    
    try:
        if body:
            print(f"Body: {json.dumps(body, indent=2)}")
        
        if method == 'GET':
            response = requests.get(url)
        elif method == 'POST':
            response = requests.post(url, json=body, headers={'Content-Type': 'application/json'})
        
        data = response.json()
        
        if response.status_code == 200:
            print(f"{Colors.GREEN}✓ Success ({response.status_code}){Colors.RESET}")
            response_str = json.dumps(data, indent=2)
            if len(response_str) > 500:
                response_str = response_str[:500] + "..."
            print(f"Response: {response_str}")
        else:
            print(f"{Colors.RED}✗ Failed ({response.status_code}){Colors.RESET}")
            print(f"Error: {json.dumps(data, indent=2)}")
        
        return {'success': response.status_code == 200, 'data': data}
    
    except Exception as e:
        print(f"{Colors.RED}✗ Error: {str(e)}{Colors.RESET}")
        return {'success': False, 'error': str(e)}

def run_tests():
    """Run all tests against the MCP server."""
    print(f"{Colors.MAGENTA}=== MCP Server Test Suite ==={Colors.RESET}")
    print(f"Testing server at: {API_URL}\n")
    
    tests = [
        # Test 1: YouTube Search REST endpoint
        {
            'name': 'YouTube Search (REST)',
            'method': 'GET',
            'url': f'{API_URL}/youtube/search?query=javascript%20tutorial&maxResults=2'
        },
        
        # Test 2: OpenAI Completion REST endpoint
        {
            'name': 'OpenAI Completion (REST)',
            'method': 'POST',
            'url': f'{API_URL}/openai/completion',
            'body': {
                'prompt': 'What is 2+2? Answer in one word.',
                'maxTokens': 10
            }
        },
        
        # Test 3: MCP Tools List
        {
            'name': 'MCP Tools List',
            'method': 'POST',
            'url': f'{API_URL}/mcp',
            'body': {
                'method': 'tools/list'
            }
        },
        
        # Test 4: MCP YouTube Search Tool
        {
            'name': 'MCP YouTube Search Tool',
            'method': 'POST',
            'url': f'{API_URL}/mcp',
            'body': {
                'method': 'tools/call',
                'params': {
                    'name': 'search_youtube_videos',
                    'arguments': {
                        'query': 'typescript tutorial',
                        'maxResults': 1
                    }
                }
            }
        },
        
        # Test 5: MCP OpenAI Completion Tool
        {
            'name': 'MCP OpenAI Completion Tool',
            'method': 'POST',
            'url': f'{API_URL}/mcp',
            'body': {
                'method': 'tools/call',
                'params': {
                    'name': 'openai_completion',
                    'arguments': {
                        'prompt': 'Write a haiku about coding',
                        'model': 'gpt-4o-mini',
                        'maxTokens': 100
                    }
                }
            }
        },
        
        # Test 6: Error handling - Invalid endpoint
        {
            'name': 'Error Handling - Invalid Endpoint',
            'method': 'GET',
            'url': f'{API_URL}/invalid-endpoint'
        },
        
        # Test 7: Error handling - Missing parameters
        {
            'name': 'Error Handling - Missing Query Parameter',
            'method': 'GET',
            'url': f'{API_URL}/youtube/search'
        },
        
        # Test 8: Error handling - Invalid MCP tool
        {
            'name': 'Error Handling - Invalid MCP Tool',
            'method': 'POST',
            'url': f'{API_URL}/mcp',
            'body': {
                'method': 'tools/call',
                'params': {
                    'name': 'invalid_tool',
                    'arguments': {}
                }
            }
        }
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        result = test_endpoint(
            test['name'], 
            test['method'], 
            test['url'], 
            test.get('body')
        )
        
        # Error handling tests should fail
        if 'Error Handling' in test['name']:
            if not result['success']:
                passed += 1
            else:
                failed += 1
        else:
            if result['success']:
                passed += 1
            else:
                failed += 1
    
    print(f"\n{Colors.MAGENTA}=== Test Summary ==={Colors.RESET}")
    print(f"{Colors.GREEN}Passed: {passed}{Colors.RESET}")
    print(f"{Colors.RED}Failed: {failed}{Colors.RESET}")
    print(f"Total: {passed + failed}")
    
    if failed == 0:
        print(f"\n{Colors.GREEN}✓ All tests passed!{Colors.RESET}")
    else:
        print(f"\n{Colors.RED}✗ Some tests failed{Colors.RESET}")
    
    return failed == 0

if __name__ == '__main__':
    success = run_tests()
    sys.exit(0 if success else 1)