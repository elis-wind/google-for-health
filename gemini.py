import os
from typing import Optional
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

GEMINI_MODEL = "gemini-2.5-flash"

# Prompts
SYSTEM = "You are a helpful medical assistant."
PROMPT = "How do you differentiate bacterial from viral pneumonia?"

def call_gemini(
    prompt: str = f"{SYSTEM} {PROMPT}",
    max_tokens: int = 4096,
    temperature: float = 0.0,
    system_prompt: Optional[str] = None
    ):
    # Use custom system prompt if provided, otherwise use default
    if system_prompt:
        effective_system = system_prompt
    else:
        effective_system = SYSTEM
    
    # Combine system prompt with user prompt
    full_prompt = f"{effective_system}\n\n{prompt}"
    client = genai.Client(
        vertexai=True,
        project=os.getenv("GOOGLE_CLOUD_PROJECT"),
        location="global",
    )

    contents = [
        types.Content(
        role="user",
        parts=[
            types.Part.from_text(text=full_prompt)
        ]
        )
    ]

    gemini_config = types.GenerateContentConfig(
        temperature=temperature,
        max_output_tokens=max_tokens,
        safety_settings = [types.SafetySetting(
            category="HARM_CATEGORY_HATE_SPEECH",
            threshold="OFF"
        ),types.SafetySetting(
            category="HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold="OFF"
        ),types.SafetySetting(
            category="HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold="OFF"
        ),types.SafetySetting(
            category="HARM_CATEGORY_HARASSMENT",
            threshold="OFF"
        )],
            thinking_config=types.ThinkingConfig(
            thinking_budget=-1,
        ),
    )

    full_response = ""
    for chunk in client.models.generate_content_stream(
        model=GEMINI_MODEL,
        contents=contents,
        config=gemini_config,
    ):
        if chunk.text:
            full_response += chunk.text

    return full_response.strip()


if __name__ == "__main__":
    response = call_gemini()
    print(response)