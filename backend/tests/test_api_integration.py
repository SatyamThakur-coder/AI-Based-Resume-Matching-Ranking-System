import pytest
from app.database import SessionLocal, Base, engine
from app.routes.candidates import list_candidates, seed_demo_candidates, get_candidate
from app.routes.jobs import list_jobs, seed_demo_jobs, create_job, get_job
from app.routes.matching import run_matching, get_job_rankings, compare_candidates, get_candidate_job_match
from app.routes.analytics import get_dashboard_analytics
from app.routes.reports import export_rankings_csv, export_rankings_pdf
from app.routes.settings import get_weights, update_weights
from app.schemas import MatchRunRequest, JobCreate, WeightSettingsSchema

@pytest.fixture(scope="module")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def test_seed_demo_data(db_session):
    res_cand = seed_demo_candidates(db=db_session)
    assert res_cand["count"] >= 5 or "loaded" in res_cand["message"]
    
    res_jobs = seed_demo_jobs(db=db_session)
    assert res_jobs["count"] >= 3 or "loaded" in res_jobs["message"]

def test_list_candidates_and_jobs(db_session):
    candidates = list_candidates(db=db_session)
    assert len(candidates) >= 5
    first_c = candidates[0]
    assert first_c.name is not None
    assert len(first_c.skills) > 0

    jobs = list_jobs(db=db_session)
    assert len(jobs) >= 3
    first_j = jobs[0]
    assert first_j.title is not None
    assert len(first_j.required_skills) > 0

def test_matching_flow(db_session):
    jobs = list_jobs(db=db_session)
    target_job = jobs[0]

    # Run matching
    req = MatchRunRequest(job_id=target_job.id)
    matches = run_matching(payload=req, db=db_session)
    assert len(matches) >= 5

    # Top match inspection
    top_cand = matches[0]
    assert top_cand.overall_score > 40.0
    assert len(top_cand.matched_skills) > 0
    assert "summary" in top_cand.explanation
    assert "strengths" in top_cand.explanation

def test_job_rankings_retrieval(db_session):
    jobs = list_jobs(db=db_session)
    target_job = jobs[0]

    rankings = get_job_rankings(job_id=target_job.id, min_score=20.0, db=db_session)
    assert len(rankings) > 0
    # Ensure descending order
    scores = [r.overall_score for r in rankings]
    assert scores == sorted(scores, reverse=True)

def test_compare_candidates(db_session):
    jobs = list_jobs(db=db_session)
    target_job = jobs[0]
    candidates = list_candidates(db=db_session)
    c_ids = [c.id for c in candidates[:3]]

    comp = compare_candidates(payload={"job_id": target_job.id, "candidate_ids": c_ids}, db=db_session)
    assert "job" in comp
    assert len(comp["candidates"]) == 3
    assert comp["candidates"][0]["overall_score"] is not None

def test_dashboard_analytics(db_session):
    stats = get_dashboard_analytics(db=db_session)
    assert stats["total_resumes"] >= 5
    assert stats["total_jobs"] >= 3
    assert stats["total_candidates_analyzed"] >= 1
    assert stats["average_matching_score"] > 0
    assert len(stats["top_skills_distribution"]) > 0

def test_export_csv_and_pdf(db_session):
    jobs = list_jobs(db=db_session)
    target_job = jobs[0]

    csv_response = export_rankings_csv(job_id=target_job.id, db=db_session)
    assert csv_response.media_type == "text/csv"
    assert b"Candidate Name" in csv_response.body

    pdf_response = export_rankings_pdf(job_id=target_job.id, db=db_session)
    assert pdf_response.media_type == "application/pdf"
    assert len(pdf_response.path) > 0

def test_weights_settings(db_session):
    w = get_weights(db=db_session)
    assert w.semantic_weight > 0

    new_w = WeightSettingsSchema(
        semantic_weight=30.0,
        skill_weight=35.0,
        experience_weight=15.0,
        education_weight=10.0,
        project_weight=10.0
    )
    updated = update_weights(payload=new_w, db=db_session)
    assert updated.skill_weight == 35.0
