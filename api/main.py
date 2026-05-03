"""
FastAPI application entry point.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from api.routes import router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Initializing Database tables...")
    init_db()
    
    # Load NLP models at startup to avoid delay on first request
    from nlp_engine.resume_parser import _get_nlp
    print("Loading spaCy model...")
    _get_nlp()
    
    yield
    # Shutdown
    print("Shutting down...")


app = FastAPI(
    title="Smart Resume Screening API",
    description="Backend API for parsing resumes, extracting skills, and screening against job descriptions.",
    version="1.0.0",
    lifespan=lifespan,
)

# Allow Streamlit frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.get("/")
def health_check():
    return {"status": "ok", "message": "Smart Resume Screening API is running"}
