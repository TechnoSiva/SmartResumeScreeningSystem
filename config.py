"""
Smart Resume Screening System — Central Configuration
"""
import os
from pathlib import Path

# ── Paths ───────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
DATA_DIR = BASE_DIR / "data"
DB_PATH = BASE_DIR / "resume_screening.db"

UPLOAD_DIR.mkdir(exist_ok=True)
DATA_DIR.mkdir(exist_ok=True)
(DATA_DIR / "sample_resumes").mkdir(exist_ok=True)

# ── Database ────────────────────────────────────────────────────────────
DATABASE_URL = f"sqlite:///{DB_PATH}"

# ── NLP ─────────────────────────────────────────────────────────────────
SPACY_MODEL = "en_core_web_sm"

# ── Scoring Weights (must sum to 1.0) ───────────────────────────────────
SCORING_WEIGHTS = {
    "skills":     0.40,
    "experience": 0.30,
    "education":  0.15,
    "keyword":    0.15,
}

# ── Recommendation Thresholds ───────────────────────────────────────────
RECOMMENDATION_THRESHOLDS = {
    "Strong Fit":   80,
    "Good Fit":     60,
    "Moderate Fit": 40,
    # anything below 40 → "Weak Fit"
}

# ── Allowed Upload Extensions ───────────────────────────────────────────
ALLOWED_EXTENSIONS = {".pdf", ".docx"}

# ── API ─────────────────────────────────────────────────────────────────
API_HOST = os.getenv("API_HOST", "127.0.0.1")
API_PORT = int(os.getenv("API_PORT", "8000"))
STREAMLIT_PORT = int(os.getenv("STREAMLIT_PORT", "8501"))
