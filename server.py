from fastapi import FastAPI
from fastapi import BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Any, Dict
from agent import step_agent
from agent import generate_and_store_report_and_patient
import uvicorn
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Allow CORS for local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    state: Dict[str, Any] = Field(default_factory=dict)
    system_prompt: str = Field(default="You are a helpful medical assistant.", description="Custom system prompt for the AI")

class ChatResponse(BaseModel):
    ai_message: str
    state: Dict[str, Any]

@app.get("/")
def read_root():
    logger.info("=== ROOT ENDPOINT ACCESSED ===")
    return {"message": "API is running"}

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(chat_request: ChatRequest, background_tasks: BackgroundTasks):
    logger.info("=== CHAT REQUEST ===")
    logger.info(f"Message: {chat_request.message}")
    logger.info(f"System Prompt: {chat_request.system_prompt}")
    logger.info(f"State: {chat_request.state}")
    
    result = step_agent(chat_request.state, chat_request.message, chat_request.system_prompt)
    
    logger.info("=== CHAT RESPONSE ===")
    logger.info(f"AI Message: {result['ai_message']}")
    logger.info(f"Updated State: {result['state']}")

    if result["state"].get("phase") == "outputs":
        background_tasks.add_task(generate_and_store_report_and_patient, result["state"])
    
    return ChatResponse(ai_message=result["ai_message"], state=result["state"])

@app.post("/chat/simple", response_model=ChatResponse)
async def simple_chat_endpoint(chat_request: ChatRequest):
    """
    Simple chat endpoint that bypasses the complex agent workflow and just uses Gemini directly.
    Perfect for clean conversations with custom system prompts.
    """
    from gemini import call_gemini
    
    logger.info("=== SIMPLE CHAT REQUEST ===")
    logger.info(f"Message: {chat_request.message}")
    logger.info(f"System Prompt: {chat_request.system_prompt}")
    logger.info(f"State: {chat_request.state}")
    
    # Use Gemini directly with the custom system prompt
    response = call_gemini(
        prompt=chat_request.message,
        system_prompt=chat_request.system_prompt
    )
    
    logger.info("=== SIMPLE CHAT RESPONSE ===")
    logger.info(f"AI Message: {response}")
    
    return ChatResponse(
        ai_message=response, 
        state=chat_request.state
    )

@app.post("/chat/test", response_model=ChatResponse)
async def test_custom_system_prompt(chat_request: ChatRequest):
    """
    Test endpoint to demonstrate custom system prompt functionality.
    This endpoint bypasses the complex agent workflow and directly calls Gemini.
    """
    from gemini import call_gemini
    
    logger.info("=== TEST CHAT REQUEST ===")
    logger.info(f"Message: {chat_request.message}")
    logger.info(f"System Prompt: {chat_request.system_prompt}")
    logger.info(f"State: {chat_request.state}")
    
    # Simple test response using custom system prompt
    response = call_gemini(
        prompt=chat_request.message,
        system_prompt=chat_request.system_prompt
    )
    
    logger.info("=== TEST CHAT RESPONSE ===")
    logger.info(f"AI Message: {response}")
    
    return ChatResponse(
        ai_message=response, 
        state=chat_request.state
    )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)