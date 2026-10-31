import os
import uvicorn
import vertexai
from vertexai.generative_models import GenerativeModel
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

# Initialize Vertex AI
vertexai.init(project="pindi-bypass", location="us-central1")

# Initialize the Gemini model
model = GenerativeModel("gemini-1.5-flash")

app = FastAPI(title="Pindi Bypass - Game Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define both Pydantic models BEFORE the route that uses them
class PlayerAction(BaseModel):
    current_node: str
    player_input: str
    entity_scanned: Optional[str] = None
    inventory: list[str] = []

class GameResponse(BaseModel):
    narrative: str
    new_node: str

@app.get("/")
async def health_check():
    return {"status": "online", "service": "Pindi Bypass Backend"}

@app.post("/api/action", response_model=GameResponse)
async def process_action(action: PlayerAction):
    try:
        # Dynamically inject the ghost data if the player steps on one
        entity_context = (
            f"SCANNED ENTITY: {action.entity_scanned}"
            if action.entity_scanned
            else "STATUS: Clear. No immediate spectral entities detected."
        )

        system_prompt = f"""
        You are a highly advanced, tactical AI companion (similar to Jarvis) integrated into the suit of a Ghost Hunter operating in Rawalpindi and Islamabad.
        The hunter is currently at coordinate: {action.current_node}.
        {entity_context}
        Hunter's telemetry/input: "{action.player_input}"
        
        Analyze this input and the scanned entity (if any). Provide rapid, tactical spectral advice, a weakness to exploit, or a witty observation about the local paranormal activity in 2 short sentences max. 
        Address the hunter directly. Keep it gritty and cyber-aesthetic.
        """

        response = model.generate_content(system_prompt)

        return GameResponse(
            narrative=response.text.strip(),
            new_node=action.current_node,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    # Cloud Run injects the PORT environment variable; fallback to 8080 for local testing
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)