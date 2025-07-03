import os
from dotenv import load_dotenv
from google.cloud import aiplatform

load_dotenv()

# Endpoint setup
USE_DEDICATED_ENDPOINT = True

# Prompts
SYSTEM = "You are a helpful medical assistant."
PROMPT = "How do you differentiate bacterial from viral pneumonia?"

endpoint = aiplatform.Endpoint(
    endpoint_name=os.getenv("MEDGEMMA_ENDPOINT_ID"),
    project=os.getenv("GOOGLE_CLOUD_PROJECT"),
    location=os.getenv("GOOGLE_CLOUD_LOCATION"),
)

def call_medgemma(prompt: str = f"{SYSTEM} {PROMPT}"):
    instances = [
        {
            "prompt": prompt,
            "max_tokens": 1048,
            "temperature": 0,
            "raw_response": True,
        },
    ]

    response = endpoint.predict(
        instances=instances,
        use_dedicated_endpoint=USE_DEDICATED_ENDPOINT
    )
    prediction = response.predictions[0]
    
    return prediction


if __name__ == "__main__":
    response = call_medgemma()
    print(response)