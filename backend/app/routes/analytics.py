from collections import Counter
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import Candidate, JobDescription, MatchResult
from app.schemas import MatchResultOut

router = APIRouter(prefix="/analytics", tags=["Analytics & Dashboard"])

@router.get("/dashboard")
def get_dashboard_analytics(db: Session = Depends(get_db)):
    total_resumes = db.query(Candidate).count()
    total_jobs = db.query(JobDescription).count()
    total_candidates_analyzed = db.query(MatchResult.candidate_id).distinct().count()
    
    avg_score_res = db.query(func.avg(MatchResult.overall_score)).scalar()
    avg_score = round(float(avg_score_res), 1) if avg_score_res else 0.0

    # Top-ranked candidates overall across latest evaluations
    top_matches = db.query(MatchResult, Candidate).join(
        Candidate, MatchResult.candidate_id == Candidate.id
    ).order_by(MatchResult.overall_score.desc()).limit(5).all()

    top_candidates = []
    for mr, cand in top_matches:
        top_candidates.append({
            "id": mr.id,
            "job_id": mr.job_id,
            "candidate_id": cand.id,
            "candidate_name": cand.name,
            "candidate_email": cand.email,
            "candidate_experience_years": cand.total_experience_years,
            "candidate_education": cand.education_level,
            "overall_score": mr.overall_score,
            "semantic_score": mr.semantic_score,
            "skill_score": mr.skill_score,
            "experience_score": mr.experience_score,
            "matched_skills": mr.matched_skills,
            "tier": mr.explanation.get("tier", "Qualified")
        })

    # Skill distribution from candidate database
    all_candidates = db.query(Candidate).all()
    skill_counter = Counter()
    for c in all_candidates:
        for s in c.skills:
            skill_counter[s] += 1

    top_skills_data = [
        {"skill": skill, "count": count}
        for skill, count in skill_counter.most_common(10)
    ]

    # Required skills from all job descriptions
    all_jobs = db.query(JobDescription).all()
    job_skill_counter = Counter()
    for j in all_jobs:
        for s in j.required_skills:
            job_skill_counter[s] += 1
            
    top_job_skills_data = [
        {"skill": skill, "demand_count": count}
        for skill, count in job_skill_counter.most_common(10)
    ]

    # Score Bracket Distribution
    all_scores = [r[0] for r in db.query(MatchResult.overall_score).all()]
    brackets = {
        "90-100%": 0,
        "80-89%": 0,
        "70-79%": 0,
        "60-69%": 0,
        "< 60%": 0
    }
    for sc in all_scores:
        if sc >= 90:
            brackets["90-100%"] += 1
        elif sc >= 80:
            brackets["80-89%"] += 1
        elif sc >= 70:
            brackets["70-79%"] += 1
        elif sc >= 60:
            brackets["60-69%"] += 1
        else:
            brackets["< 60%"] += 1

    score_distribution = [{"range": k, "count": v} for k, v in brackets.items()]

    # Recent activity
    recent_candidates = db.query(Candidate).order_by(Candidate.created_at.desc()).limit(5).all()
    recent_activity = [
        {
            "id": c.id,
            "type": "resume_upload",
            "title": f"Resume uploaded: {c.name}",
            "subtitle": f"{c.education_level} • {c.total_experience_years:.1f} yrs exp",
            "time": c.created_at.strftime("%b %d, %H:%M")
        }
        for c in recent_candidates
    ]

    return {
        "total_resumes": total_resumes,
        "total_jobs": total_jobs,
        "total_candidates_analyzed": total_candidates_analyzed,
        "average_matching_score": avg_score,
        "top_candidates": top_candidates,
        "top_skills_distribution": top_skills_data,
        "top_in_demand_skills": top_job_skills_data,
        "candidate_score_distribution": score_distribution,
        "recent_activity": recent_activity
    }

