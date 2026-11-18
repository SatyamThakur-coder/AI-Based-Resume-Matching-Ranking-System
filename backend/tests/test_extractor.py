import pytest
from app.services.nlp_parser import clean_text, remove_stopwords, segment_sections
from app.services.resume_extractor import (
    extract_candidate_contact,
    calculate_experience_years,
    extract_education
)

def test_nlp_cleaning():
    raw = "  Software Engineer with 5+ years of experience! In Python & C++...  "
    cleaned = clean_text(raw)
    assert "software engineer" in cleaned
    assert "python" in cleaned
    assert "c++" in cleaned

def test_contact_extraction():
    sample = "John Doe\nEmail: john.doe@example.com\nPhone: (555) 123-4567\nLocation: Seattle, WA"
    contact = extract_candidate_contact(sample)
    assert contact["email"] == "john.doe@example.com"
    assert "555" in contact["phone"]
    assert "Seattle" in contact["location"]

def test_experience_years_extraction():
    text = "Work History:\nGoogle (2018 - 2023): Senior Developer\nAmazon (2023 - Present): Lead Architect"
    years = calculate_experience_years(text)
    assert years >= 5.0

def test_education_extraction():
    edu_text = "Master of Science in Artificial Intelligence, Carnegie Mellon University"
    res = extract_education(edu_text, edu_text)
    assert res["level"] == "Master's Degree"

