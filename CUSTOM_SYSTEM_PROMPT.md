# Custom System Prompt API Documentation

## Overview

The API now supports custom system prompts, allowing you to customize the behavior and personality of the AI assistant for different use cases.

## API Endpoints

### POST /chat/test
A simplified endpoint that directly uses your custom system prompt without the complex medical tutoring workflow.

**Request Body:**
```json
{
  "message": "Your question or message",
  "system_prompt": "Your custom system prompt (optional)",
  "state": {}
}
```

**Response:**
```json
{
  "ai_message": "AI response based on your system prompt",
  "state": {}
}
```

### POST /chat
The main chat endpoint that integrates custom system prompts into the medical tutoring workflow.

**Request Body:**
```json
{
  "message": "Your question or message", 
  "system_prompt": "Your custom system prompt (optional)",
  "state": {
    "checklist": {...},
    "phase": "summary",
    "history": [...],
    "report": "",
    "virtual_patient": ""
  }
}
```

## Custom System Prompt Examples

### 1. Default Medical Assistant
```
"You are a helpful medical assistant."
```

### 2. Pediatric Specialist
```
"You are a pediatric specialist. Always consider age-appropriate treatments and explain things in simple terms suitable for children and their parents."
```

### 3. Emergency Medicine Physician
```
"You are an emergency medicine physician. Focus on urgent symptoms, immediate actions, and triage decisions. Always prioritize life-threatening conditions."
```

### 4. Medical Educator
```
"You are a medical educator. Explain concepts with detailed reasoning, include differential diagnosis considerations, and help students understand the 'why' behind medical decisions."
```

### 5. Preventive Care Specialist
```
"You are a preventive care specialist. Focus on prevention strategies, lifestyle modifications, and early detection of diseases."
```

## Usage Examples

### Python Example
```python
import requests

# Test endpoint example
url = "http://localhost:8000/chat/test"
payload = {
    "message": "What are the symptoms of pneumonia?",
    "system_prompt": "You are a pediatric specialist. Always consider age-appropriate treatments.",
    "state": {}
}

response = requests.post(url, json=payload)
result = response.json()
print(result["ai_message"])
```

### cURL Example
```bash
curl -X POST "http://localhost:8000/chat/test" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are the symptoms of pneumonia?",
    "system_prompt": "You are an emergency medicine physician. Focus on urgent symptoms.",
    "state": {}
  }'
```

### JavaScript/Fetch Example
```javascript
const response = await fetch('http://localhost:8000/chat/test', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: "What are the symptoms of pneumonia?",
    system_prompt: "You are a medical educator. Explain with detailed reasoning.",
    state: {}
  })
});

const result = await response.json();
console.log(result.ai_message);
```

## Default Behavior

If no `system_prompt` is provided, the API will use the default system prompt:
```
"You are a helpful medical assistant."
```

## Best Practices

1. **Be Specific**: Include relevant medical specialty, context, or target audience in your system prompt.

2. **Set Expectations**: Clearly define the role and behavior you want from the AI.

3. **Include Constraints**: Mention any limitations or specific focus areas.

4. **Consider the Audience**: Tailor the language complexity to your intended users.

## Running the Test Script

To test the custom system prompt functionality:

1. Start the server:
   ```bash
   python server.py
   ```

2. Run the test script:
   ```bash
   python test_custom_prompt.py
   ```

This will demonstrate how different system prompts change the AI's responses to the same medical question.
