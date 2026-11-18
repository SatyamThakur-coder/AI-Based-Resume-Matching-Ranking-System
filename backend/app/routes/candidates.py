import shutil
import json
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.models import Candidate, MatchResult
from app.schemas import CandidateOut
from app.services.resume_extractor import parse_resume_document

router = APIRouter(prefix="/candidates", tags=["Candidates"])

@router.get("", response_model=List[CandidateOut])
def list_candidates(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Candidate)
    if search:
        query = query.filter(
            (Candidate.name.ilike(f"%{search}%")) |
            (Candidate.skills_json.ilike(f"%{search}%")) |
            (Candidate.education_level.ilike(f"%{search}%"))
        )
    candidates = query.order_by(Candidate.created_at.desc()).offset(skip).limit(limit).all()
    
    result = []
    for c in candidates:
        result.append(CandidateOut(
            id=c.id,
            name=c.name,
            email=c.email,
            phone=c.phone,
            location=c.location,
            total_experience_years=c.total_experience_years,
            education_level=c.education_level,
            education_details=c.education_details,
            skills=c.skills,
            projects=c.projects,
            experiences=c.experiences,
            certifications=c.certifications,
            resume_file_path=c.resume_file_path,
            created_at=c.created_at,
            updated_at=c.updated_at
        ))
    return result

@router.get("/{candidate_id}", response_model=CandidateOut)
def get_candidate(candidate_id: int, db: Session = Depends(get_db)):
    c = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    return CandidateOut(
        id=c.id,
        name=c.name,
        email=c.email,
        phone=c.phone,
        location=c.location,
        total_experience_years=c.total_experience_years,
        education_level=c.education_level,
        education_details=c.education_details,
        skills=c.skills,
        projects=c.projects,
        experiences=c.experiences,
        certifications=c.certifications,
        resume_file_path=c.resume_file_path,
        created_at=c.created_at,
        updated_at=c.updated_at
    )

@router.post("/upload")
async def upload_resumes(
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload one or multiple resumes (.pdf, .docx, .txt).
    Automatically parses text, skills, experience, education, and metadata.
    """
    processed = []
    errors = []

    for file in files:
        ext = Path(file.filename).suffix.lower()
        if ext not in [".pdf", ".docx", ".doc", ".txt"]:
            errors.append({"filename": file.filename, "error": f"Unsupported format '{ext}'. Must be PDF, DOCX, or TXT."})
            continue

        safe_filename = f"{Path(file.filename).stem}_{Path(file.filename).suffix}"
        target_path = settings.UPLOAD_DIR / safe_filename
        
        # Save file
        try:
            with open(target_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        except Exception as e:
            errors.append({"filename": file.filename, "error": f"File save failure: {str(e)}"})
            continue

        # Parse file
        try:
            parsed = parse_resume_document(target_path)
            
            # Create DB Record
            cand = Candidate(
                name=parsed["name"],
                email=parsed["email"],
                phone=parsed["phone"],
                location=parsed["location"],
                total_experience_years=parsed["total_experience_years"],
                education_level=parsed["education_level"],
                education_details=parsed["education_details"],
                skills_json=json.dumps(parsed["skills"]),
                projects_json=json.dumps(parsed["projects"]),
                experience_json=json.dumps(parsed["experiences"]),
                certifications_json=json.dumps(parsed["certifications"]),
                raw_text=parsed["raw_text"],
                resume_file_path=str(target_path)
            )
            db.add(cand)
            db.commit()
            db.refresh(cand)

            processed.append({
                "id": cand.id,
                "name": cand.name,
                "email": cand.email,
                "skills_count": len(parsed["skills"]),
                "skills": parsed["skills"],
                "experience_years": cand.total_experience_years,
                "education": cand.education_level
            })
        except Exception as e:
            errors.append({"filename": file.filename, "error": f"Parsing error: {str(e)}"})

    return {
        "success": True,
        "uploaded_count": len(processed),
        "failed_count": len(errors),
        "candidates": processed,
        "errors": errors
    }

@router.delete("/{candidate_id}")
def delete_candidate(candidate_id: int, db: Session = Depends(get_db)):
    cand = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    db.delete(cand)
    db.commit()
    return {"message": f"Candidate {candidate_id} removed successfully."}

@router.post("/seed-demo")
def seed_demo_candidates(db: Session = Depends(get_db)):
    """Loads realistic, high-quality demo candidates with varied profiles for testing."""
    sample_candidates = [
        {
            "name": "Alex Rivera",
            "email": "alex.rivera.dev@gmail.com",
            "phone": "+1 (555) 234-5678",
            "location": "San Francisco, CA",
            "total_experience_years": 6.5,
            "education_level": "Master's Degree",
            "education_details": "M.S. in Computer Science, Stanford University",
            "skills": ["Python", "FastAPI", "React", "PostgreSQL", "Docker", "AWS", "Machine Learning", "PyTorch", "Git", "REST API"],
            "projects": [
                {"title": "AI Search Engine", "description": "Engineered real-time semantic document search using FastAPI, PyTorch Sentence Transformers, and vector databases."},
                {"title": "Cloud Analytics Platform", "description": "Constructed multi-tenant SaaS analytics dashboard in React with automated CI/CD deployed on AWS ECS."}
            ],
            "experiences": [
                {"company": "NeuralCore Tech", "title": "Senior AI Software Engineer", "description": "Architected high-throughput inference APIs with FastAPI and Docker. Managed AWS cloud infrastructure."},
                {"company": "Apex Labs", "title": "Full Stack Developer", "description": "Developed React frontends and Python microservices integrated with PostgreSQL databases."}
            ],
            "certifications": ["AWS Certified Solutions Architect", "Deep Learning Specialization - Coursera"],
            "raw_text": "Alex Rivera\nSenior AI Software Engineer\nEmail: alex.rivera.dev@gmail.com\nPhone: +1 555-234-5678\nStanford University, M.S. Computer Science\nSkills: Python, FastAPI, React, PostgreSQL, Docker, AWS, Machine Learning, PyTorch, Git, REST API\nExperience: 2018 - Present NeuralCore Tech, Senior AI Engineer. Developed deep learning microservices.\nProjects: AI Semantic Search with Sentence Transformers and FastAPI."
        },
        {
            "name": "Sarah Chen",
            "email": "sarah.chen@techmail.io",
            "phone": "+1 (555) 876-5432",
            "location": "Seattle, WA",
            "total_experience_years": 4.0,
            "education_level": "Bachelor's Degree",
            "education_details": "B.S. in Software Engineering, University of Washington",
            "skills": ["React", "TypeScript", "JavaScript", "Tailwind CSS", "Node.js", "Express.js", "Vite", "GraphQL", "Git", "Unit Testing"],
            "projects": [
                {"title": "E-Commerce Design System", "description": "Created scalable reusable component library using React, TypeScript, and Tailwind CSS."},
                {"title": "Collaborative Whiteboard App", "description": "Real-time canvas tool powered by Node.js, WebSockets, and React."}
            ],
            "experiences": [
                {"company": "Horizon Cloud", "title": "Frontend Engineer", "description": "Designed responsive web interfaces with React, TypeScript, and Tailwind CSS. Wrote automated Jest unit tests."}
            ],
            "certifications": ["Meta Certified Front-End Developer"],
            "raw_text": "Sarah Chen\nFrontend Engineer\nEmail: sarah.chen@techmail.io\nUniversity of Washington, B.S. in Software Engineering\nSkills: React, TypeScript, JavaScript, Tailwind CSS, Node.js, Express.js, Vite, GraphQL, Git, Unit Testing\nExperience: 2020 - Present at Horizon Cloud as Frontend Engineer building design systems."
        },
        {
            "name": "Marcus Johnson",
            "email": "marcus.j.ml@outlook.com",
            "phone": "+1 (555) 432-1098",
            "location": "Boston, MA",
            "total_experience_years": 8.0,
            "education_level": "Doctorate",
            "education_details": "Ph.D. in Artificial Intelligence, MIT",
            "skills": ["Python", "Machine Learning", "Deep Learning", "PyTorch", "TensorFlow", "Scikit-learn", "Sentence Transformers", "Large Language Models", "NLP", "Pandas", "NumPy", "Docker"],
            "projects": [
                {"title": "Biomedical NER & Relation Extraction", "description": "Trained transformer models using PyTorch and Hugging Face for clinical note extraction."},
                {"title": "Enterprise RAG Pipeline", "description": "Built production RAG system leveraging sentence-transformers, FAISS vector index, and FastAPI."}
            ],
            "experiences": [
                {"company": "Synapse Health AI", "title": "Principal ML Research Engineer", "description": "Led NLP research group designing state-of-the-art transformer architectures and MLOps pipelines."}
            ],
            "certifications": ["TensorFlow Developer Certificate", "NVIDIA Deep Learning Institute"],
            "raw_text": "Marcus Johnson, Ph.D.\nPrincipal ML Research Engineer\nEmail: marcus.j.ml@outlook.com\nMIT, Ph.D. in Artificial Intelligence\nSkills: Python, Machine Learning, Deep Learning, PyTorch, TensorFlow, Scikit-learn, Sentence Transformers, Large Language Models, NLP, Pandas, NumPy, Docker\nExperience: 8 years in NLP and deep learning research."
        },
        {
            "name": "Elena Rostova",
            "email": "elena.rostova@devhub.net",
            "phone": "+1 (555) 901-2345",
            "location": "Austin, TX",
            "total_experience_years": 3.0,
            "education_level": "Bachelor's Degree",
            "education_details": "B.Tech in Information Technology, UT Austin",
            "skills": ["Python", "Django", "Flask", "PostgreSQL", "Docker", "AWS", "Git", "REST API", "Linux"],
            "projects": [
                {"title": "Automated Billing Gateway", "description": "Secure payment and invoicing webhook microservice built with Python Django and PostgreSQL."}
            ],
            "experiences": [
                {"company": "FinEdge Solutions", "title": "Backend Developer", "description": "Created scalable backend REST services with Python, Django, and PostgreSQL."}
            ],
            "certifications": ["AWS Certified Cloud Practitioner"],
            "raw_text": "Elena Rostova\nBackend Developer\nEmail: elena.rostova@devhub.net\nUT Austin, B.Tech Information Technology\nSkills: Python, Django, Flask, PostgreSQL, Docker, AWS, Git, REST API, Linux\n3 years experience building backend services."
        },
        {
            "name": "Devin Patel",
            "email": "devin.patel@codesmith.org",
            "phone": "+1 (555) 678-9012",
            "location": "New York, NY",
            "total_experience_years": 1.5,
            "education_level": "Bachelor's Degree",
            "education_details": "B.S. in Computer Science, NYU",
            "skills": ["JavaScript", "HTML", "CSS", "React", "Python", "Git", "SQLite"],
            "projects": [
                {"title": "Student Task Tracker", "description": "Simple Kanban task management web application created with React and SQLite backend."}
            ],
            "experiences": [
                {"company": "SprintWorks Inc.", "title": "Junior Software Engineer", "description": "Assisted with web application bug fixes and user interface components using React."}
            ],
            "certifications": [],
            "raw_text": "Devin Patel\nJunior Software Engineer\nEmail: devin.patel@codesmith.org\nNYU, B.S. in Computer Science\nSkills: JavaScript, HTML, CSS, React, Python, Git, SQLite\nExperience: 2023 - Present at SprintWorks Inc. building React components."
        }
    ]

    added_count = 0
    for s in sample_candidates:
        existing = db.query(Candidate).filter(Candidate.email == s["email"]).first()
        if not existing:
            c = Candidate(
                name=s["name"],
                email=s["email"],
                phone=s["phone"],
                location=s["location"],
                total_experience_years=s["total_experience_years"],
                education_level=s["education_level"],
                education_details=s["education_details"],
                skills_json=json.dumps(s["skills"]),
                projects_json=json.dumps(s["projects"]),
                experience_json=json.dumps(s["experiences"]),
                certifications_json=json.dumps(s["certifications"]),
                raw_text=s["raw_text"],
                resume_file_path=None
            )
            db.add(c)
            added_count += 1
            
    db.commit()
    return {"message": f"Successfully loaded {added_count} demo candidates.", "count": added_count}

