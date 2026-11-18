import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Candidate, JobDescription, MatchResult, WeightSetting
from app.schemas import MatchRunRequest, MatchResultOut, CandidateComparison, JobOut
from app.services.matching_engine import calculate_match

router = APIRouter(prefix="/matching", tags=["Matching Engine"])

def get_current_weights(db: Session) -> dict:
    w = db.query(WeightSetting).first()
    if not w:
        return {
            "semantic": 35.0,
            "skill": 30.0,
            "experience": 15.0,
            "education": 10.0,
            "project": 10.0
        }
    return {
        "semantic": w.semantic_weight,
        "skill": w.skill_weight,
        "experience": w.experience_weight,
        "education": w.education_weight,
        "project": w.project_weight
    }

@router.post("/run", response_model=List[MatchResultOut])
def run_matching(payload: MatchRunRequest, db: Session = Depends(get_db)):
    job = db.query(JobDescription).filter(JobDescription.id == payload.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Target Job Description not found")

    candidates_query = db.query(Candidate)
    if payload.candidate_ids:
        candidates_query = candidates_query.filter(Candidate.id.in_(payload.candidate_ids))
    candidates = candidates_query.all()

    if not candidates:
        raise HTTPException(status_code=400, detail="No candidates available to match against.")

    weights = get_current_weights(db)
    results = []

    for cand in candidates:
        match_data = calculate_match(
            resume_text=cand.raw_text or f"{cand.name} {' '.join(cand.skills)} {cand.education_details}",
            candidate_skills=cand.skills,
            candidate_years=cand.total_experience_years,
            candidate_edu=cand.education_level,
            candidate_projects=cand.projects,
            candidate_certs=cand.certifications,
            job_text=f"{job.title} {job.description}",
            job_required_skills=job.required_skills,
            job_preferred_skills=job.preferred_skills,
            job_min_years=job.min_experience_years,
            job_education_required=job.education_required,
            candidate_name=cand.name,
            weights=weights
        )

        # Upsert match result in DB
        res_record = db.query(MatchResult).filter(
            MatchResult.job_id == job.id,
            MatchResult.candidate_id == cand.id
        ).first()

        if not res_record:
            res_record = MatchResult(
                job_id=job.id,
                candidate_id=cand.id
            )
            db.add(res_record)

        res_record.overall_score = match_data["overall_score"]
        res_record.semantic_score = match_data["semantic_score"]
        res_record.skill_score = match_data["skill_score"]
        res_record.experience_score = match_data["experience_score"]
        res_record.education_score = match_data["education_score"]
        res_record.project_score = match_data["project_score"]
        res_record.matched_skills_json = json.dumps(match_data["matched_skills"])
        res_record.missing_skills_json = json.dumps(match_data["missing_skills"])
        res_record.explanation_json = json.dumps(match_data["explanation"])

        db.commit()
        db.refresh(res_record)

        results.append(MatchResultOut(
            id=res_record.id,
            job_id=job.id,
            candidate_id=cand.id,
            candidate_name=cand.name,
            candidate_email=cand.email,
            candidate_experience_years=cand.total_experience_years,
            candidate_education=cand.education_level,
            overall_score=res_record.overall_score,
            semantic_score=res_record.semantic_score,
            skill_score=res_record.skill_score,
            experience_score=res_record.experience_score,
            education_score=res_record.education_score,
            project_score=res_record.project_score,
            matched_skills=res_record.matched_skills,
            missing_skills=res_record.missing_skills,
            explanation=res_record.explanation,
            created_at=res_record.created_at
        ))

    # Sort descending by overall matching score
    results.sort(key=lambda r: r.overall_score, reverse=True)
    return results

@router.get("/results/{job_id}", response_model=List[MatchResultOut])
def get_job_rankings(
    job_id: int,
    min_score: float = Query(0.0, ge=0.0, le=100.0),
    min_exp: float = Query(0.0, ge=0.0),
    search: Optional[str] = None,
    sort_by: str = Query("overall_score"), # overall_score, skill_score, semantic_score, experience_score
    sort_order: str = Query("desc"), # desc, asc
    db: Session = Depends(get_db)
):
    min_score_val = float(min_score.default if hasattr(min_score, "default") else min_score)
    min_exp_val = float(min_exp.default if hasattr(min_exp, "default") else min_exp)
    sort_by_val = str(sort_by.default if hasattr(sort_by, "default") else sort_by)
    sort_order_val = str(sort_order.default if hasattr(sort_order, "default") else sort_order)

    query = db.query(MatchResult, Candidate).join(Candidate, MatchResult.candidate_id == Candidate.id).filter(
        MatchResult.job_id == job_id,
        MatchResult.overall_score >= min_score_val,
        Candidate.total_experience_years >= min_exp_val
    )

    if search:
        query = query.filter(
            (Candidate.name.ilike(f"%{search}%")) |
            (Candidate.email.ilike(f"%{search}%")) |
            (MatchResult.matched_skills_json.ilike(f"%{search}%"))
        )

    # Sort
    col_map = {
        "overall_score": MatchResult.overall_score,
        "skill_score": MatchResult.skill_score,
        "semantic_score": MatchResult.semantic_score,
        "experience_score": MatchResult.experience_score,
        "experience_years": Candidate.total_experience_years
    }
    target_col = col_map.get(sort_by_val, MatchResult.overall_score)
    if sort_order_val.lower() == "asc":
        query = query.order_by(target_col.asc())
    else:
        query = query.order_by(target_col.desc())

    records = query.all()
    results = []
    for mr, cand in records:
        results.append(MatchResultOut(
            id=mr.id,
            job_id=mr.job_id,
            candidate_id=cand.id,
            candidate_name=cand.name,
            candidate_email=cand.email,
            candidate_experience_years=cand.total_experience_years,
            candidate_education=cand.education_level,
            overall_score=mr.overall_score,
            semantic_score=mr.semantic_score,
            skill_score=mr.skill_score,
            experience_score=mr.experience_score,
            education_score=mr.education_score,
            project_score=mr.project_score,
            matched_skills=mr.matched_skills,
            missing_skills=mr.missing_skills,
            explanation=mr.explanation,
            created_at=mr.created_at
        ))

    return results

@router.get("/candidate/{candidate_id}/job/{job_id}", response_model=MatchResultOut)
def get_candidate_job_match(candidate_id: int, job_id: int, db: Session = Depends(get_db)):
    record = db.query(MatchResult, Candidate).join(Candidate, MatchResult.candidate_id == Candidate.id).filter(
        MatchResult.job_id == job_id,
        MatchResult.candidate_id == candidate_id
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="Match result not found for this candidate and job. Run matching first.")

    mr, cand = record
    return MatchResultOut(
        id=mr.id,
        job_id=mr.job_id,
        candidate_id=cand.id,
        candidate_name=cand.name,
        candidate_email=cand.email,
        candidate_experience_years=cand.total_experience_years,
        candidate_education=cand.education_level,
        overall_score=mr.overall_score,
        semantic_score=mr.semantic_score,
        skill_score=mr.skill_score,
        experience_score=mr.experience_score,
        education_score=mr.education_score,
        project_score=mr.project_score,
        matched_skills=mr.matched_skills,
        missing_skills=mr.missing_skills,
        explanation=mr.explanation,
        created_at=mr.created_at
    )

@router.post("/compare")
def compare_candidates(payload: dict, db: Session = Depends(get_db)):
    """Compare multiple candidates side-by-side for a specific job."""
    job_id = payload.get("job_id")
    candidate_ids = payload.get("candidate_ids", [])

    if not job_id or not candidate_ids:
        raise HTTPException(status_code=400, detail="job_id and candidate_ids are required.")

    job = db.query(JobDescription).filter(JobDescription.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    comparison_data = []
    for cid in candidate_ids:
        cand = db.query(Candidate).filter(Candidate.id == cid).first()
        mr = db.query(MatchResult).filter(MatchResult.job_id == job_id, MatchResult.candidate_id == cid).first()
        if cand:
            comparison_data.append({
                "candidate_id": cand.id,
                "name": cand.name,
                "email": cand.email,
                "experience_years": cand.total_experience_years,
                "education_level": cand.education_level,
                "education_details": cand.education_details,
                "skills": cand.skills,
                "overall_score": mr.overall_score if mr else None,
                "semantic_score": mr.semantic_score if mr else None,
                "skill_score": mr.skill_score if mr else None,
                "experience_score": mr.experience_score if mr else None,
                "education_score": mr.education_score if mr else None,
                "project_score": mr.project_score if mr else None,
                "matched_skills": mr.matched_skills if mr else [],
                "missing_skills": mr.missing_skills if mr else [],
                "explanation": mr.explanation if mr else {}
            })

    return {
        "job": {
            "id": job.id,
            "title": job.title,
            "min_experience_years": job.min_experience_years,
            "education_required": job.education_required,
            "required_skills": job.required_skills,
            "preferred_skills": job.preferred_skills
        },
        "candidates": comparison_data
    }
