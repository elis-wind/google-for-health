from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Any, Dict
from agent import step_agent
import uvicorn

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

class ChatResponse(BaseModel):
    ai_message: str
    state: Dict[str, Any]

@app.get("/")
def read_root():
    return {"message": "API is running"}

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(chat_request: ChatRequest):
    result = step_agent(chat_request.state, chat_request.message)
    return ChatResponse(ai_message=result["ai_message"], state=result["state"])

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)