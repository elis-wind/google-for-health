import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

GEMINI_MODEL = "gemini-2.5-flash"

# Prompts
SYSTEM = "You are a helpful medical assistant."
PROMPT = "How do you differentiate bacterial from viral pneumonia?"

def call_gemini():
    client = genai.Client(
        vertexai=True,
        project=os.getenv("GOOGLE_CLOUD_PROJECT"),
        location="global",
    )

    contents = [
        types.Content(
        role="user",
        parts=[
            types.Part.from_text(text=PROMPT)
        ]
        )
    ]

    generate_content_config = types.GenerateContentConfig(
        temperature = 0,
        top_p = 1,
        seed = 0,
        max_output_tokens = 65535,
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

    for chunk in client.models.generate_content_stream(
        model = GEMINI_MODEL,
        contents = contents,
        config = generate_content_config,
        ):
        print(chunk.text, end="")


if __name__ == "__main__":
    call_gemini()