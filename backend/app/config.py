import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI TalentMatch – Intelligent Resume Matching & Ranking System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    BASE_DIR: Path = BASE_DIR
    
    # Storage
    UPLOAD_DIR: Path = BASE_DIR / "data" / "resumes"
    REPORTS_DIR: Path = BASE_DIR / "data" / "reports"
    DB_PATH: Path = BASE_DIR / "data" / "talentmatch.db"
    
    # Model configuration
    SENTENCE_MODEL_NAME: str = "all-MiniLM-L6-v2"
    DEVICE: str = "cpu"
    
    # Default matching weights (percentage, must sum to 100)
    DEFAULT_WEIGHTS: dict = {
        "semantic": 35.0,
        "skill": 30.0,
        "experience": 15.0,
        "education": 10.0,
        "project": 10.0
    }
    
    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]

    class Config:
        case_sensitive = True

settings = Settings()

# Ensure directories exist
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.REPORTS_DIR.mkdir(parents=True, exist_ok=True)
settings.DB_PATH.parent.mkdir(parents=True, exist_ok=True)
