import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import JobDescription
from app.schemas import JobCreate, JobUpdate, JobOut
from app.services.skill_extractor import extract_skills

router = APIRouter(prefix="/jobs", tags=["Job Descriptions"])

@router.get("", response_model=List[JobOut])
def list_jobs(db: Session = Depends(get_db)):
    jobs = db.query(JobDescription).order_by(JobDescription.created_at.desc()).all()
    results = []
    for j in jobs:
        results.append(JobOut(
            id=j.id,
            title=j.title,
            department=j.department,
            location=j.location,
            experience_level=j.experience_level,
            min_experience_years=j.min_experience_years,
            education_required=j.education_required,
            description=j.description,
            required_skills=j.required_skills,
            preferred_skills=j.preferred_skills,
            is_active=j.is_active,
            created_at=j.created_at,
            updated_at=j.updated_at
        ))
    return results

@router.get("/{job_id}", response_model=JobOut)
def get_job(job_id: int, db: Session = Depends(get_db)):
    j = db.query(JobDescription).filter(JobDescription.id == job_id).first()
    if not j:
        raise HTTPException(status_code=404, detail="Job description not found")
        
    return JobOut(
        id=j.id,
        title=j.title,
        department=j.department,
        location=j.location,
        experience_level=j.experience_level,
        min_experience_years=j.min_experience_years,
        education_required=j.education_required,
        description=j.description,
        required_skills=j.required_skills,
        preferred_skills=j.preferred_skills,
        is_active=j.is_active,
        created_at=j.created_at,
        updated_at=j.updated_at
    )

@router.post("", response_model=JobOut)
def create_job(payload: JobCreate, db: Session = Depends(get_db)):
    # Automatically extract skills from description if none provided
    req_skills = payload.required_skills
    if not req_skills:
        extracted = extract_skills(payload.description)
        # First 70% as required, remaining as preferred
        split_idx = max(1, int(len(extracted) * 0.7))
        req_skills = extracted[:split_idx]
        if not payload.preferred_skills:
            payload.preferred_skills = extracted[split_idx:]

    job = JobDescription(
        title=payload.title,
        department=payload.department,
        location=payload.location,
        experience_level=payload.experience_level,
        min_experience_years=payload.min_experience_years,
        education_required=payload.education_required,
        description=payload.description,
        required_skills_json=json.dumps(req_skills),
        preferred_skills_json=json.dumps(payload.preferred_skills),
        raw_text=f"{payload.title} {payload.description} {' '.join(req_skills)}",
        is_active=True
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    return JobOut(
        id=job.id,
        title=job.title,
        department=job.department,
        location=job.location,
        experience_level=job.experience_level,
        min_experience_years=job.min_experience_years,
        education_required=job.education_required,
        description=job.description,
        required_skills=job.required_skills,
        preferred_skills=job.preferred_skills,
        is_active=job.is_active,
        created_at=job.created_at,
        updated_at=job.updated_at
    )

@router.put("/{job_id}", response_model=JobOut)
def update_job(job_id: int, payload: JobUpdate, db: Session = Depends(get_db)):
    job = db.query(JobDescription).filter(JobDescription.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job description not found")

    if payload.title is not None:
        job.title = payload.title
    if payload.department is not None:
        job.department = payload.department
    if payload.location is not None:
        job.location = payload.location
    if payload.experience_level is not None:
        job.experience_level = payload.experience_level
    if payload.min_experience_years is not None:
        job.min_experience_years = payload.min_experience_years
    if payload.education_required is not None:
        job.education_required = payload.education_required
    if payload.description is not None:
        job.description = payload.description
    if payload.required_skills is not None:
        job.required_skills_json = json.dumps(payload.required_skills)
    if payload.preferred_skills is not None:
        job.preferred_skills_json = json.dumps(payload.preferred_skills)
    if payload.is_active is not None:
        job.is_active = payload.is_active

    db.commit()
    db.refresh(job)

    return JobOut(
        id=job.id,
        title=job.title,
        department=job.department,
        location=job.location,
        experience_level=job.experience_level,
        min_experience_years=job.min_experience_years,
        education_required=job.education_required,
        description=job.description,
        required_skills=job.required_skills,
        preferred_skills=job.preferred_skills,
        is_active=job.is_active,
        created_at=job.created_at,
        updated_at=job.updated_at
    )

@router.delete("/{job_id}")
def delete_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(JobDescription).filter(JobDescription.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job description not found")

    db.delete(job)
    db.commit()
    return {"message": f"Job {job_id} deleted successfully."}

@router.post("/seed-demo")
def seed_demo_jobs(db: Session = Depends(get_db)):
    """Seeds standard demo job positions."""
    demo_jobs = [
        {
            "title": "Senior AI / Machine Learning Engineer",
            "department": "Artificial Intelligence",
            "location": "Remote / San Francisco",
            "experience_level": "Senior",
            "min_experience_years": 5.0,
            "education_required": "Master's or Ph.D. in Computer Science or AI",
            "description": "We are seeking a seasoned AI / ML Engineer to lead our NLP and intelligent retrieval initiatives. You will design, train, and deploy transformer-based models and semantic search pipelines. Must have deep experience with PyTorch, Sentence Transformers, FastAPI, Docker, and Vector Databases. Experience deploying microservices on AWS is a huge plus.",
            "required_skills": ["Python", "Machine Learning", "PyTorch", "FastAPI", "Sentence Transformers", "Docker"],
            "preferred_skills": ["AWS", "Large Language Models", "PostgreSQL", "NLP", "Scikit-learn"]
        },
        {
            "title": "Lead Full Stack Software Engineer",
            "department": "Engineering",
            "location": "New York, NY (Hybrid)",
            "experience_level": "Lead / Staff",
            "min_experience_years": 4.0,
            "education_required": "Bachelor's in Computer Science or Software Engineering",
            "description": "Join our product engineering squad building customer-facing web applications. You will be responsible for creating snappy, responsive UIs in React and TypeScript with Tailwind CSS, backed by robust RESTful APIs built with Python and PostgreSQL. Strong unit testing, Git workflows, and cloud experience are required.",
            "required_skills": ["React", "TypeScript", "Python", "PostgreSQL", "REST API", "Git"],
            "preferred_skills": ["Tailwind CSS", "Docker", "AWS", "FastAPI", "Unit Testing"]
        },
        {
            "title": "Junior Frontend Web Developer",
            "department": "Frontend Engineering",
            "location": "Remote",
            "experience_level": "Entry / Junior",
            "min_experience_years": 1.0,
            "education_required": "Bachelor's Degree or Equivalent Experience",
            "description": "Looking for an energetic Junior Frontend Developer passionate about modern web technologies. You will assist senior developers in implementing interactive React components, integrating REST APIs, and styling with modern CSS and Tailwind. Knowledge of Git, HTML5, and JavaScript is essential.",
            "required_skills": ["JavaScript", "React", "HTML", "CSS", "Git"],
            "preferred_skills": ["TypeScript", "Tailwind CSS", "Vite", "REST API"]
        }
    ]

    added = 0
    for j in demo_jobs:
        existing = db.query(JobDescription).filter(JobDescription.title == j["title"]).first()
        if not existing:
            job = JobDescription(
                title=j["title"],
                department=j["department"],
                location=j["location"],
                experience_level=j["experience_level"],
                min_experience_years=j["min_experience_years"],
                education_required=j["education_required"],
                description=j["description"],
                required_skills_json=json.dumps(j["required_skills"]),
                preferred_skills_json=json.dumps(j["preferred_skills"]),
                raw_text=f"{j['title']} {j['description']}",
                is_active=True
            )
            db.add(job)
            added += 1
            
    db.commit()
    return {"message": f"Successfully loaded {added} demo jobs.", "count": added}

