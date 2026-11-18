import json
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, default="Unknown Candidate")
    email = Column(String(255), nullable=True, index=True)
    phone = Column(String(50), nullable=True)
    location = Column(String(255), nullable=True)
    total_experience_years = Column(Float, default=0.0)
    education_level = Column(String(100), default="Bachelor's")
    education_details = Column(Text, default="")
    
    # JSON-encoded string fields for flexibility & portability
    skills_json = Column(Text, default="[]")
    projects_json = Column(Text, default="[]")
    experience_json = Column(Text, default="[]")
    certifications_json = Column(Text, default="[]")
    
    raw_text = Column(Text, default="")
    resume_file_path = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    match_results = relationship("MatchResult", back_populates="candidate", cascade="all, delete-orphan")

    @property
    def skills(self):
        try:
            return json.loads(self.skills_json) if self.skills_json else []
        except Exception:
            return []

    @skills.setter
    def skills(self, val):
        self.skills_json = json.dumps(val)

    @property
    def projects(self):
        try:
            return json.loads(self.projects_json) if self.projects_json else []
        except Exception:
            return []

    @projects.setter
    def projects(self, val):
        self.projects_json = json.dumps(val)

    @property
    def experiences(self):
        try:
            return json.loads(self.experience_json) if self.experience_json else []
        except Exception:
            return []

    @experiences.setter
    def experiences(self, val):
        self.experience_json = json.dumps(val)

    @property
    def certifications(self):
        try:
            return json.loads(self.certifications_json) if self.certifications_json else []
        except Exception:
            return []

    @certifications.setter
    def certifications(self, val):
        self.certifications_json = json.dumps(val)


class JobDescription(Base):
    __tablename__ = "job_descriptions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    department = Column(String(100), default="Engineering")
    location = Column(String(100), default="Remote")
    experience_level = Column(String(50), default="Mid-Level")
    min_experience_years = Column(Float, default=2.0)
    education_required = Column(String(100), default="Bachelor's in Computer Science or related")
    description = Column(Text, nullable=False)
    
    required_skills_json = Column(Text, default="[]")
    preferred_skills_json = Column(Text, default="[]")
    raw_text = Column(Text, default="")
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    match_results = relationship("MatchResult", back_populates="job", cascade="all, delete-orphan")

    @property
    def required_skills(self):
        try:
            return json.loads(self.required_skills_json) if self.required_skills_json else []
        except Exception:
            return []

    @required_skills.setter
    def required_skills(self, val):
        self.required_skills_json = json.dumps(val)

    @property
    def preferred_skills(self):
        try:
            return json.loads(self.preferred_skills_json) if self.preferred_skills_json else []
        except Exception:
            return []

    @preferred_skills.setter
    def preferred_skills(self, val):
        self.preferred_skills_json = json.dumps(val)


class MatchResult(Base):
    __tablename__ = "match_results"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("job_descriptions.id"), nullable=False)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    
    overall_score = Column(Float, default=0.0)
    semantic_score = Column(Float, default=0.0)
    skill_score = Column(Float, default=0.0)
    experience_score = Column(Float, default=0.0)
    education_score = Column(Float, default=0.0)
    project_score = Column(Float, default=0.0)
    
    matched_skills_json = Column(Text, default="[]")
    missing_skills_json = Column(Text, default="[]")
    explanation_json = Column(Text, default="{}")
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    job = relationship("JobDescription", back_populates="match_results")
    candidate = relationship("Candidate", back_populates="match_results")

    @property
    def matched_skills(self):
        try:
            return json.loads(self.matched_skills_json) if self.matched_skills_json else []
        except Exception:
            return []

    @matched_skills.setter
    def matched_skills(self, val):
        self.matched_skills_json = json.dumps(val)

    @property
    def missing_skills(self):
        try:
            return json.loads(self.missing_skills_json) if self.missing_skills_json else []
        except Exception:
            return []

    @missing_skills.setter
    def missing_skills(self, val):
        self.missing_skills_json = json.dumps(val)

    @property
    def explanation(self):
        try:
            return json.loads(self.explanation_json) if self.explanation_json else {}
        except Exception:
            return {}

    @explanation.setter
    def explanation(self, val):
        self.explanation_json = json.dumps(val)


class WeightSetting(Base):
    __tablename__ = "weight_settings"

    id = Column(Integer, primary_key=True, index=True)
    semantic_weight = Column(Float, default=35.0)
    skill_weight = Column(Float, default=30.0)
    experience_weight = Column(Float, default=15.0)
    education_weight = Column(Float, default=10.0)
    project_weight = Column(Float, default=10.0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

