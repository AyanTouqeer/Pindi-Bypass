import vertexai
from vertexai.generative_models import GenerativeModel
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Initialize Vertex AI 
# Update "your-gcp-project-id" to your actual Google Cloud Project ID.
vertexai.init(project="your-gcp-project-id", location="us-central1")

# Vertex AI uses the exact same model names
model = GenerativeModel('gemini-1.5-flash') 

app = FastAPI(title="Pindi Bypass - Game Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PlayerAction(BaseModel):
    current_node: str
    player_input: str
    inventory: list[str] = []

class GameResponse(BaseModel):
    narrative: str
    new_node: str

@app.post("/api/action", response_model=GameResponse)
async def process_action(action: PlayerAction):
    try:
        system_prompt = f"""
        You are the game master for a 2D text-adventure horror game called 'Pindi Bypass'.
        The setting is a dark, gritty version of Rawalpindi and Islamabad. 
        The player is currently at: {action.current_node}.
        Respond to their action: "{action.player_input}" with a short, suspenseful narrative consequence (2 sentences max). 
        Do not break character. Incorporate local urban legends subtly.
        """

        response = model.generate_content(system_prompt)
        
        return GameResponse(
            narrative=response.text.strip(),
            new_node=action.current_node 
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)