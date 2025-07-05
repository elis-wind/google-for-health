import os
import fitz
from fastapi import FastAPI
from fastapi import BackgroundTasks
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional
from agent import step_agent
from agent import generate_and_store_report_and_patient
import uvicorn
import logging
from io import BytesIO
from fastapi import HTTPException

from prompts.system_tutor import SYTEM_TUTOR_PROMPT

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

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    state: Dict[str, Any] = Field(default_factory=dict)
    system_prompt: str = Field(default="You are a helpful medical assistant.", description="Custom system prompt for the AI")
    history: Optional[List[Message]] = Field(default=None, description="Conversation history")

class ChatResponse(BaseModel):
    ai_message: str
    state: Dict[str, Any]

@app.get("/")
def read_root():
    logger.info("=== ROOT ENDPOINT ACCESSED ===")
    return {"message": "API is running"}

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(chat_request: ChatRequest, background_tasks: BackgroundTasks):
    #chat_request.system_prompt = SYTEM_TUTOR_PROMPT
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
    from models.gemini import call_gemini_with_history
    
    logger.info("=== SIMPLE CHAT REQUEST ===")
    logger.info(f"Message: {chat_request.message}")
    logger.info(f"System Prompt: {chat_request.system_prompt}")
    logger.info(f"State: {chat_request.state}")
    logger.info(f"History: {chat_request.history}")
    
    # Use Gemini with conversation history
    response = call_gemini_with_history(
        prompt=chat_request.message,
        system_prompt=chat_request.system_prompt,
        history=chat_request.history or []
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
    from models.gemini import call_gemini
    
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

@app.get("/handouts/dyspnee-image")
def get_dyspnee_image():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    pdf_path = os.path.abspath(os.path.join(base_dir, "..", "data", "handouts", "ITEM-R2C_DYSPNEE_AIGUE_ET_CHRONIQUE.pdf"))
    doc = fitz.open(pdf_path)
    page = doc.load_page(0)
    pix = page.get_pixmap(dpi=150)
    img_bytes = BytesIO(pix.tobytes("jpeg"))
    return StreamingResponse(img_bytes, media_type="image/jpeg")

@app.get("/handouts/dyspnee")
def get_dyspnee_pdf():
    """Serve the PDF file directly"""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    pdf_path = os.path.abspath(os.path.join(base_dir, "..", "data", "handouts", "ITEM-R2C_DYSPNEE_AIGUE_ET_CHRONIQUE.pdf"))
    
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="PDF file not found")
    
    with open(pdf_path, "rb") as f:
        pdf_content = f.read()
    
    return StreamingResponse(
        BytesIO(pdf_content), 
        media_type="application/pdf",
        headers={"Content-Disposition": "inline; filename=ITEM-R2C_DYSPNEE_AIGUE_ET_CHRONIQUE.pdf"}
    )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)