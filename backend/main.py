import logging

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from routes import router

# Load environment variables
load_dotenv()
app = FastAPI()
logging.basicConfig(level=logging.INFO)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # React app's default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the database
init_db()

# Include the router
app.include_router(router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)