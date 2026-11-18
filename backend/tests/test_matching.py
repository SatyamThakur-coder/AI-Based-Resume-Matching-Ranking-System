import pytest
from app.services.matching_engine import (
    compute_tfidf_similarity,
    compute_skill_match,
    compute_experience_match,
    compute_education_match,
    compute_project_score,
    calculate_match
)
from app.services.skill_extractor import extract_skills

def test_extract_skills():
    text = "Candidate has 5 years of experience with Python, React, FastAPI, Docker, and PostgreSQL on AWS."
    skills = extract_skills(text)
    assert "Python" in skills
    assert "React" in skills
    assert "FastAPI" in skills
    assert "Docker" in skills
    assert "PostgreSQL" in skills
    assert "AWS" in skills

def test_tfidf_similarity():
    text1 = "Senior Machine Learning Engineer with Python PyTorch and natural language processing."
    text2 = "Looking for a Machine Learning Engineer skilled in Python and deep learning NLP."
    sim = compute_tfidf_similarity(text1, text2)
    assert sim > 0.2
    assert sim <= 1.0

def test_skill_match():
    cand_skills = ["Python", "FastAPI", "Docker", "Git"]
    req_skills = ["Python", "FastAPI", "PostgreSQL"]
    pref_skills = ["Docker", "AWS"]
    
    score, matched, missing = compute_skill_match(cand_skills, req_skills, pref_skills)
    assert "Python" in matched
    assert "FastAPI" in matched
    assert "Docker" in matched
    assert "PostgreSQL" in missing
    assert 50.0 <= score <= 90.0

def test_experience_match():
    # Meets or exceeds requirement
    assert compute_experience_match(5.0, 3.0) == 100.0
    # Junior candidate
    junior_score = compute_experience_match(1.5, 3.0)
    assert 40.0 <= junior_score <= 60.0

def test_education_match():
    assert compute_education_match("Master's Degree", "Bachelor's") == 100.0
    assert compute_education_match("Bachelor's Degree", "Master's") == 80.0

def test_full_calculate_match():
    resume = "Alex Rivera is a Senior AI Engineer specializing in Python, PyTorch, FastAPI, and Docker with 6 years experience."
    job = "Senior AI Engineer required to build microservices using Python, PyTorch, and FastAPI. 5+ years experience required."
    
    result = calculate_match(
        resume_text=resume,
        candidate_skills=["Python", "PyTorch", "FastAPI", "Docker"],
        candidate_years=6.0,
        candidate_edu="Master's Degree",
        candidate_projects=[{"title": "AI Platform", "description": "Built PyTorch inference APIs with FastAPI"}],
        candidate_certs=["AWS Certified"],
        job_text=job,
        job_required_skills=["Python", "PyTorch", "FastAPI"],
        job_preferred_skills=["Docker", "AWS"],
        job_min_years=5.0,
        job_education_required="Bachelor's",
        candidate_name="Alex Rivera"
    )
    
    assert result["overall_score"] >= 75.0
    assert "explanation" in result
    assert "strengths" in result["explanation"]
    assert len(result["matched_skills"]) >= 3

