#!/usr/bin/env python3
"""
Test script to demonstrate custom system prompt functionality
"""

import requests
import json

def test_custom_system_prompt():
    """Test the custom system prompt feature"""
    
    # API endpoint
    url = "http://localhost:8000/chat/test"
    
    # Test cases with different system prompts
    test_cases = [
        {
            "system_prompt": "You are a helpful medical assistant.",
            "message": "What are the symptoms of pneumonia?",
            "description": "Default medical assistant"
        },
        {
            "system_prompt": "You are a pediatric specialist. Always consider age-appropriate treatments and explain things in simple terms.",
            "message": "What are the symptoms of pneumonia?",
            "description": "Pediatric specialist"
        },
        {
            "system_prompt": "You are an emergency medicine physician. Focus on urgent symptoms and immediate actions.",
            "message": "What are the symptoms of pneumonia?",
            "description": "Emergency medicine focus"
        },
        {
            "system_prompt": "You are a medical educator. Explain concepts with detailed reasoning and include differential diagnosis.",
            "message": "What are the symptoms of pneumonia?",
            "description": "Medical educator"
        }
    ]
    
    print("Testing Custom System Prompt API\n")
    print("=" * 50)
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\nTest {i}: {test_case['description']}")
        print("-" * 30)
        print(f"System Prompt: {test_case['system_prompt']}")
        print(f"Message: {test_case['message']}")
        
        payload = {
            "message": test_case["message"],
            "system_prompt": test_case["system_prompt"],
            "state": {}
        }
        
        try:
            response = requests.post(url, json=payload)
            if response.status_code == 200:
                result = response.json()
                print(f"\nResponse: {result['ai_message']}")
            else:
                print(f"\nError: HTTP {response.status_code}")
                print(response.text)
        except requests.exceptions.ConnectionError:
            print("\nError: Could not connect to API. Make sure the server is running on localhost:8000")
        except Exception as e:
            print(f"\nError: {e}")
        
        print("\n" + "=" * 50)

if __name__ == "__main__":
    test_custom_system_prompt()
