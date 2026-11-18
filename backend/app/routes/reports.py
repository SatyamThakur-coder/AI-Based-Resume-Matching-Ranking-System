from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import JobDescription, MatchResult, Candidate
from app.services.report_generator import generate_csv_report, generate_pdf_report

router = APIRouter(prefix="/reports", tags=["Reports & Export"])

@router.get("/export/csv/{job_id}")
def export_rankings_csv(job_id: int, db: Session = Depends(get_db)):
    job = db.query(JobDescription).filter(JobDescription.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job description not found")

    matches = db.query(MatchResult, Candidate).join(
        Candidate, MatchResult.candidate_id == Candidate.id
    ).filter(MatchResult.job_id == job_id).order_by(MatchResult.overall_score.desc()).all()

    if not matches:
        raise HTTPException(status_code=400, detail="No matching results found for this job. Run matching first.")

    results_data = []
    for mr, cand in matches:
        results_data.append({
            "candidate_name": cand.name,
            "candidate_email": cand.email,
            "overall_score": mr.overall_score,
            "semantic_score": mr.semantic_score,
            "skill_score": mr.skill_score,
            "experience_score": mr.experience_score,
            "education_score": mr.education_score,
            "project_score": mr.project_score,
            "candidate_experience_years": cand.total_experience_years,
            "matched_skills": mr.matched_skills,
            "missing_skills": mr.missing_skills,
            "explanation": mr.explanation
        })

    csv_content = generate_csv_report(job.title, results_data)
    filename = f"rankings_job_{job_id}_{job.title.replace(' ', '_')[:20]}.csv"

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/export/pdf/{job_id}")
def export_rankings_pdf(job_id: int, db: Session = Depends(get_db)):
    job = db.query(JobDescription).filter(JobDescription.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job description not found")

    matches = db.query(MatchResult, Candidate).join(
        Candidate, MatchResult.candidate_id == Candidate.id
    ).filter(MatchResult.job_id == job_id).order_by(MatchResult.overall_score.desc()).all()

    if not matches:
        raise HTTPException(status_code=400, detail="No matching results found for this job. Run matching first.")

    results_data = []
    for mr, cand in matches:
        results_data.append({
            "candidate_name": cand.name,
            "candidate_email": cand.email,
            "overall_score": mr.overall_score,
            "semantic_score": mr.semantic_score,
            "skill_score": mr.skill_score,
            "experience_score": mr.experience_score,
            "education_score": mr.education_score,
            "project_score": mr.project_score,
            "candidate_experience_years": cand.total_experience_years,
            "matched_skills": mr.matched_skills,
            "missing_skills": mr.missing_skills,
            "explanation": mr.explanation
        })

    job_dict = {
        "id": job.id,
        "title": job.title,
        "department": job.department,
        "min_experience_years": job.min_experience_years,
        "experience_level": job.experience_level
    }

    try:
        pdf_path = generate_pdf_report(job_dict, results_data)
        return FileResponse(
            path=str(pdf_path),
            filename=pdf_path.name,
            media_type="application/pdf"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF report: {str(e)}")

