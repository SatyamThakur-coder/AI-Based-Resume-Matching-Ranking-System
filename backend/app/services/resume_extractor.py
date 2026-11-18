import os
import re
from pathlib import Path
from typing import Dict, Any, List, Optional
import fitz  # PyMuPDF
from docx import Document
from app.services.skill_extractor import extract_skills
from app.services.nlp_parser import segment_sections, clean_text

EMAIL_REGEX = r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'
PHONE_REGEX = r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
YEAR_RANGE_REGEX = r'\b(19\d\d|20\d\d)\s*(?:-|–|to)\s*(19\d\d|20\d\d|present|current)\b'

EDUCATION_KEYWORDS = [
    ("Ph.D", "Doctorate", 5),
    ("Doctor of Philosophy", "Doctorate", 5),
    ("Master", "Master's Degree", 4),
    ("M.S.", "Master's Degree", 4),
    ("M.Tech", "Master's Degree", 4),
    ("MBA", "Master's Degree", 4),
    ("Bachelor", "Bachelor's Degree", 3),
    ("B.S.", "Bachelor's Degree", 3),
    ("B.Tech", "Bachelor's Degree", 3),
    ("B.E.", "Bachelor's Degree", 3),
    ("B.A.", "Bachelor's Degree", 3),
    ("Associate", "Associate Degree", 2),
    ("Diploma", "Diploma / Certificate", 1),
    ("High School", "High School", 1),
]

def extract_text_from_pdf(file_path: Path) -> str:
    """Extracts raw text from a PDF file using PyMuPDF."""
    text = ""
    try:
        with fitz.open(str(file_path)) as doc:
            for page in doc:
                text += page.get_text() + "\n"
    except Exception as e:
        raise ValueError(f"Failed to read PDF document: {str(e)}")
    return text

def extract_text_from_docx(file_path: Path) -> str:
    """Extracts raw text from a DOCX file using python-docx."""
    text = ""
    try:
        doc = Document(str(file_path))
        for para in doc.paragraphs:
            if para.text:
                text += para.text + "\n"
        for table in doc.tables:
            for row in table.rows:
                row_text = " | ".join([cell.text.strip() for cell in row.cells if cell.text.strip()])
                if row_text:
                    text += row_text + "\n"
    except Exception as e:
        raise ValueError(f"Failed to read DOCX document: {str(e)}")
    return text

def extract_candidate_name(text: str, lines: List[str]) -> str:
    """
    Heuristically extracts candidate name from header lines.
    Looks for a line that isn't a header label, email, or URL.
    """
    for line in lines[:8]:
        clean = line.strip()
        if not clean:
            continue
        # Skip labels and contacts
        if any(w in clean.lower() for w in ["resume", "curriculum vitae", "cv", "page", "phone", "email", "github", "linkedin", "http", "@"]):
            continue
        # Words must be alphabetic mostly
        words = clean.split()
        if 2 <= len(words) <= 4 and all(re.match(r'^[A-Z][a-zA-Z\.\'-]*$', w) for w in words):
            return clean
        if 1 <= len(words) <= 3 and len(clean) <= 40 and re.match(r'^[A-Za-z\s\.\'-]+$', clean):
            return clean.title()
    return "Candidate Name"

def extract_candidate_contact(text: str) -> Dict[str, Optional[str]]:
    email_match = re.search(EMAIL_REGEX, text)
    email = email_match.group(0) if email_match else None
    
    phone_match = re.search(PHONE_REGEX, text)
    phone = phone_match.group(0) if phone_match else None
    
    # Simple city/state location regex or fallback
    location_match = re.search(r'\b([A-Z][a-zA-Z]+,\s*(?:[A-Z]{2}|[A-Z][a-zA-Z]+))\b', text)
    location = location_match.group(1) if location_match else "Not Specified"
    
    return {"email": email, "phone": phone, "location": location}

def calculate_experience_years(text: str) -> float:
    """Calculates approximate years of experience from year ranges or explicit mentions."""
    # Check explicit mentions like "5+ years of experience"
    exp_explicit = re.findall(r'(\d+(?:\.\d+)?)\s*\+?\s*years?\s*(?:of)?\s*(?:experience|exp)', text, re.IGNORECASE)
    if exp_explicit:
        try:
            return max(float(x) for x in exp_explicit)
        except ValueError:
            pass

    # Find date ranges (e.g., 2019 - 2023, 2021 - Present)
    ranges = re.findall(YEAR_RANGE_REGEX, text, re.IGNORECASE)
    current_year = 2026
    total_months = 0
    intervals = []

    for start_str, end_str in ranges:
        try:
            start = int(start_str)
            if end_str.lower() in ["present", "current"]:
                end = current_year
            else:
                end = int(end_str)
            if 1980 <= start <= end <= current_year + 1:
                intervals.append((start, end))
        except ValueError:
            continue

    if intervals:
        # Merge overlapping intervals
        intervals.sort(key=lambda x: x[0])
        merged = [intervals[0]]
        for curr in intervals[1:]:
            prev_start, prev_end = merged[-1]
            if curr[0] <= prev_end:
                merged[-1] = (prev_start, max(prev_end, curr[1]))
            else:
                merged.append(curr)
        years = sum(end - start for start, end in merged)
        return float(min(years, 35))

    return 2.0  # reasonable baseline default if indeterminate

def extract_education(text: str, edu_section: str) -> Dict[str, str]:
    combined = (edu_section + "\n" + text).lower()
    highest_level = "Bachelor's Degree"
    highest_score = 3
    details = ""

    for kw, label, score in EDUCATION_KEYWORDS:
        if kw.lower() in combined:
            if score > highest_score:
                highest_score = score
                highest_level = label
                
    # Extract line matching education for details
    for line in edu_section.splitlines():
        if any(kw.lower() in line.lower() for kw, _, _ in EDUCATION_KEYWORDS) or "university" in line.lower() or "college" in line.lower():
            details = line.strip()
            break
            
    if not details:
        details = highest_level

    return {"level": highest_level, "details": details}

def extract_projects_and_experience(sections: Dict[str, str]) -> Dict[str, List[Dict[str, Any]]]:
    """Parse projects and experience bullet points into structured lists."""
    proj_lines = [l.strip() for l in sections.get("projects", "").splitlines() if len(l.strip()) > 10]
    projects = []
    current_proj = None
    for line in proj_lines[:10]:
        if line.startswith(("-", "*", "•")) and current_proj:
            current_proj["description"] += " " + line.lstrip("-*• ")
        else:
            if current_proj:
                projects.append(current_proj)
            current_proj = {"title": line[:60], "description": line}
    if current_proj:
        projects.append(current_proj)

    exp_lines = [l.strip() for l in sections.get("experience", "").splitlines() if len(l.strip()) > 10]
    experiences = []
    current_exp = None
    for line in exp_lines[:15]:
        if line.startswith(("-", "*", "•")) and current_exp:
            current_exp["description"] += " " + line.lstrip("-*• ")
        else:
            if current_exp:
                experiences.append(current_exp)
            current_exp = {"company": "Experience Record", "title": line[:60], "description": line}
    if current_exp:
        experiences.append(current_exp)

    # Certifications
    cert_lines = [l.strip().lstrip("-*• ") for l in sections.get("certifications", "").splitlines() if len(l.strip()) > 5]

    return {
        "projects": projects,
        "experiences": experiences,
        "certifications": cert_lines
    }

def parse_resume_document(file_path: Path) -> Dict[str, Any]:
    """Main function to parse resume from PDF, DOCX or TXT and return structured candidate info."""
    ext = file_path.suffix.lower()
    if ext == ".pdf":
        raw_text = extract_text_from_pdf(file_path)
    elif ext in [".docx", ".doc"]:
        raw_text = extract_text_from_docx(file_path)
    elif ext in [".txt", ".md"]:
        raw_text = file_path.read_text(encoding="utf-8", errors="ignore")
    else:
        raise ValueError(f"Unsupported file format '{ext}'. Please upload PDF, DOCX, or TXT.")

    if not raw_text.strip():
        raise ValueError("The uploaded document contains no readable text.")

    lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
    sections = segment_sections(raw_text)
    
    name = extract_candidate_name(raw_text, lines)
    contact = extract_candidate_contact(raw_text)
    exp_years = calculate_experience_years(raw_text)
    education = extract_education(raw_text, sections.get("education", ""))
    skills = extract_skills(raw_text)
    structured_data = extract_projects_and_experience(sections)

    return {
        "name": name,
        "email": contact["email"],
        "phone": contact["phone"],
        "location": contact["location"],
        "total_experience_years": exp_years,
        "education_level": education["level"],
        "education_details": education["details"],
        "skills": skills,
        "projects": structured_data["projects"],
        "experiences": structured_data["experiences"],
        "certifications": structured_data["certifications"],
        "raw_text": raw_text
    }

