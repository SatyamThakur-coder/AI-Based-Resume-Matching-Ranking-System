from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class CandidateBase(BaseModel):
    name: str = "Unknown Candidate"
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    total_experience_years: float = 0.0
    education_level: str = "Bachelor's"
    education_details: str = ""
    skills: List[str] = []
    projects: List[Dict[str, Any]] = []
    experiences: List[Dict[str, Any]] = []
    certifications: List[str] = []

class CandidateCreate(CandidateBase):
    raw_text: Optional[str] = ""

class CandidateOut(CandidateBase):
    id: int
    resume_file_path: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class JobBase(BaseModel):
    title: str
    department: str = "Engineering"
    location: str = "Remote"
    experience_level: str = "Mid-Level"
    min_experience_years: float = 2.0
    education_required: str = "Bachelor's in Computer Science or related"
    description: str
    required_skills: List[str] = []
    preferred_skills: List[str] = []

class JobCreate(JobBase):
    pass

class JobUpdate(BaseModel):
    title: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    experience_level: Optional[str] = None
    min_experience_years: Optional[float] = None
    education_required: Optional[str] = None
    description: Optional[str] = None
    required_skills: Optional[List[str]] = None
    preferred_skills: Optional[List[str]] = None
    is_active: Optional[bool] = None

class JobOut(JobBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class WeightSettingsSchema(BaseModel):
    semantic_weight: float = 35.0
    skill_weight: float = 30.0
    experience_weight: float = 15.0
    education_weight: float = 10.0
    project_weight: float = 10.0

class MatchExplanation(BaseModel):
    summary: str
    strengths: List[str]
    improvement_areas: List[str]
    matched_skills_highlight: List[str]
    missing_skills_highlight: List[str]
    experience_assessment: str
    education_assessment: str

class MatchResultOut(BaseModel):
    id: int
    job_id: int
    candidate_id: int
    candidate_name: str
    candidate_email: Optional[str] = None
    candidate_experience_years: float
    candidate_education: str
    overall_score: float
    semantic_score: float
    skill_score: float
    experience_score: float
    education_score: float
    project_score: float
    matched_skills: List[str]
    missing_skills: List[str]
    explanation: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True

class MatchRunRequest(BaseModel):
    job_id: int
    candidate_ids: Optional[List[int]] = None # None means match all candidates

class DashboardStats(BaseModel):
    total_resumes: int
    total_jobs: int
    total_candidates_analyzed: int
    average_matching_score: float
    top_candidates: List[MatchResultOut]
    recent_activity: List[Dict[str, Any]]
    top_skills_in_demand: List[Dict[str, Any]]
    candidate_score_distribution: List[Dict[str, Any]]

class CandidateComparison(BaseModel):
    job: JobOut
    candidates: List[Dict[str, Any]]

