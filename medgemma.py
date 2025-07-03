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

instances = [
    {
        "prompt": f"{SYSTEM} {PROMPT}",
        "max_tokens": 1048,
        "temperature": 0,
        "raw_response": True,
    },
]

def call_medgemma():
    response = endpoint.predict(
        instances=instances,
        use_dedicated_endpoint=USE_DEDICATED_ENDPOINT
    )
    prediction = response.predictions[0]
    print(prediction)


if __name__ == "__main__":
    call_medgemma()