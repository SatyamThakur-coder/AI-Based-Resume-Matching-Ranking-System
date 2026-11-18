import logging
from typing import Dict, Any, List, Tuple
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.services.nlp_parser import clean_text, remove_stopwords
from app.services.skill_extractor import extract_skills

logger = logging.getLogger(__name__)

# Lazy singleton for SentenceTransformer model to load once on demand
_sentence_model = None

def get_sentence_model():
    global _sentence_model
    if _sentence_model is None:
        try:
            from sentence_transformers import SentenceTransformer
            # Try loading cached model locally first to prevent network delay
            try:
                _sentence_model = SentenceTransformer("all-MiniLM-L6-v2", local_files_only=True)
                logger.info("SentenceTransformer model loaded from local cache.")
            except Exception:
                _sentence_model = SentenceTransformer("all-MiniLM-L6-v2")
                logger.info("SentenceTransformer model initialized.")
        except Exception as e:
            logger.warning(f"Could not load SentenceTransformer ({str(e)}). Falling back to TF-IDF semantic approximation.")
            _sentence_model = False
    return _sentence_model

def compute_tfidf_similarity(text1: str, text2: str) -> float:
    """Computes cosine similarity between two texts using unigram + bigram TF-IDF vectors."""
    cleaned1 = remove_stopwords(clean_text(text1))
    cleaned2 = remove_stopwords(clean_text(text2))
    
    if not cleaned1 or not cleaned2:
        return 0.0
        
    try:
        vectorizer = TfidfVectorizer(ngram_range=(1, 2), min_df=1, max_df=1.0)
        tfidf_matrix = vectorizer.fit_transform([cleaned1, cleaned2])
        sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        return float(np.clip(sim, 0.0, 1.0))
    except Exception as e:
        logger.error(f"Error computing TF-IDF similarity: {e}")
        return 0.0

def compute_semantic_similarity(resume_text: str, job_text: str) -> float:
    """
    Computes semantic similarity using Sentence Transformers.
    If SentenceTransformer is not loaded or fails, uses enhanced n-gram TF-IDF similarity.
    """
    model = get_sentence_model()
    if model:
        try:
            # Chunk or truncate large texts to 512 tokens / ~2000 chars for embedding efficiency
            res_chunk = resume_text[:2500]
            job_chunk = job_text[:2500]
            embeddings = model.encode([res_chunk, job_chunk], convert_to_numpy=True)
            emb1, emb2 = embeddings[0], embeddings[1]
            norm1 = np.linalg.norm(emb1)
            norm2 = np.linalg.norm(emb2)
            if norm1 > 0 and norm2 > 0:
                sim = float(np.dot(emb1, emb2) / (norm1 * norm2))
                # Sentence transformer cosine sim typically falls between 0.2 and 0.95 for related text
                # We normalize slightly for recruiter score readability
                scaled_sim = float(np.clip((sim - 0.1) / 0.85, 0.0, 1.0))
                return scaled_sim
        except Exception as e:
            logger.warning(f"SentenceTransformer encoding failed: {e}. Using TF-IDF fallback.")
            
    # Fallback to TF-IDF similarity
    return compute_tfidf_similarity(resume_text, job_text)

def compute_skill_match(candidate_skills: List[str], required_skills: List[str], preferred_skills: List[str]) -> Tuple[float, List[str], List[str]]:
    """
    Computes skill match score:
    - Required skills coverage (base up to 85%)
    - Preferred skills bonus (up to 15%)
    Returns: (score [0-100], matched_skills, missing_skills)
    """
    cand_lower = {s.lower(): s for s in candidate_skills}
    req_lower = {s.lower(): s for s in required_skills}
    pref_lower = {s.lower(): s for s in preferred_skills}
    
    matched_req = []
    missing_req = []
    
    for r_low, r_orig in req_lower.items():
        if r_low in cand_lower:
            matched_req.append(r_orig)
        else:
            missing_req.append(r_orig)
            
    matched_pref = [p_orig for p_low, p_orig in pref_lower.items() if p_low in cand_lower]
    
    # Calculate score
    if required_skills:
        req_ratio = len(matched_req) / len(required_skills)
    else:
        req_ratio = 1.0  # No required skills specified
        
    if preferred_skills:
        pref_ratio = len(matched_pref) / len(preferred_skills)
    else:
        pref_ratio = 0.5
        
    # 85% weight on required, 15% on preferred
    score = (req_ratio * 85.0) + (pref_ratio * 15.0)
    
    all_matched = sorted(list(set(matched_req + matched_pref)))
    return float(np.clip(score, 0.0, 100.0)), all_matched, missing_req

def compute_experience_match(candidate_years: float, required_years: float) -> float:
    """
    Compares candidate experience years with required minimum experience years.
    Returns score from 0 to 100.
    """
    if required_years <= 0:
        return 100.0
        
    if candidate_years >= required_years:
        # Full score, slight bonus for strong seniority up to 100
        return 100.0
    else:
        # Linear drop-off
        ratio = candidate_years / required_years
        return float(np.clip(ratio * 90.0, 10.0, 95.0))

def compute_education_match(candidate_edu: str, required_edu: str) -> float:
    """
    Compares candidate education level with job education requirement.
    """
    edu_ranking = {
        "doctorate": 5,
        "ph.d": 5,
        "master": 4,
        "bachelor": 3,
        "associate": 2,
        "diploma": 1,
        "high school": 1
    }
    
    cand_rank = 3 # default bachelor
    for k, v in edu_ranking.items():
        if k in (candidate_edu or "").lower():
            cand_rank = v
            break
            
    req_rank = 3 # default bachelor
    for k, v in edu_ranking.items():
        if k in (required_edu or "").lower():
            req_rank = v
            break
            
    if cand_rank >= req_rank:
        return 100.0
    elif cand_rank == req_rank - 1:
        return 80.0
    else:
        return 60.0

def compute_project_score(candidate_projects: List[Dict], candidate_certs: List[str], required_skills: List[str]) -> float:
    """
    Calculates project & certification relevance based on skill mentions and project quantity/depth.
    """
    if not candidate_projects and not candidate_certs:
        return 40.0
        
    req_set = {s.lower() for s in required_skills}
    proj_text = " ".join([p.get("title", "") + " " + p.get("description", "") for p in candidate_projects]).lower()
    cert_text = " ".join(candidate_certs).lower()
    
    matched_in_projects = sum(1 for s in req_set if s in proj_text)
    matched_in_certs = sum(1 for s in req_set if s in cert_text)
    
    base_proj_score = min(len(candidate_projects) * 20.0, 60.0)
    relevance_bonus = 0.0
    if req_set:
        relevance_bonus = (matched_in_projects / len(req_set)) * 30.0
        
    cert_bonus = min(len(candidate_certs) * 10.0, 20.0) + (10.0 if matched_in_certs > 0 else 0.0)
    
    total = base_proj_score + relevance_bonus + cert_bonus
    return float(np.clip(total, 20.0, 100.0))

def generate_explanation(
    candidate_name: str,
    overall_score: float,
    semantic_score: float,
    skill_score: float,
    experience_score: float,
    education_score: float,
    project_score: float,
    matched_skills: List[str],
    missing_skills: List[str],
    candidate_years: float,
    required_years: float,
    candidate_edu: str,
    required_edu: str
) -> Dict[str, Any]:
    """Generates transparent, explainable AI analysis for recruiter insights."""
    strengths = []
    improvement_areas = []
    
    # Analyze skills
    if matched_skills:
        top_skills = ", ".join(matched_skills[:5])
        strengths.append(f"Demonstrates strong coverage in key skills: {top_skills}.")
    if missing_skills:
        missing_str = ", ".join(missing_skills[:4])
        improvement_areas.append(f"Missing core required skills: {missing_str}. Additional training or assessment recommended.")
    else:
        strengths.append("Matches all essential required skills specified for the role.")

    # Analyze experience
    if candidate_years >= required_years:
        strengths.append(f"Exceeds minimum experience requirement ({candidate_years:.1f} years vs {required_years:.1f} years required).")
        exp_assessment = f"Strong candidate with {candidate_years:.1f} years of relevant industry experience."
    else:
        improvement_areas.append(f"Has {candidate_years:.1f} years of experience, slightly below target {required_years:.1f} years.")
        exp_assessment = f"Junior to mid-level track with {candidate_years:.1f} years experience."

    # Analyze education
    edu_assessment = f"Holds {candidate_edu}, aligning well with {required_edu} requirements."
    if education_score >= 90:
        strengths.append(f"Academic background ({candidate_edu}) meets or exceeds criteria.")
        
    # Analyze semantic & project
    if semantic_score >= 75:
        strengths.append("Resume narrative exhibits high semantic alignment with the job description duties.")
    if project_score >= 80:
        strengths.append("Project portfolio shows practical hands-on application of relevant technologies.")
    elif project_score < 60:
        improvement_areas.append("Could benefit from showcasing more industry-grade projects directly utilizing target tech stack.")

    # High-level summary
    if overall_score >= 80:
        tier = "Excellent Fit (Top Tier Candidate)"
        summary = f"{candidate_name} is an outstanding candidate with an overall match score of {overall_score:.1f}%. The candidate possesses {len(matched_skills)} matching skills and fulfills both technical and experience criteria."
    elif overall_score >= 65:
        tier = "Solid Fit (Shortlist Candidate)"
        summary = f"{candidate_name} is a solid match ({overall_score:.1f}%) with good fundamentals and relevant background, though minor skill gaps ({', '.join(missing_skills[:3]) if missing_skills else 'none'}) exist."
    else:
        tier = "Moderate / Developing Match"
        summary = f"{candidate_name} has potential ({overall_score:.1f}%) but shows significant skill or experience divergence from the job specifications."

    return {
        "tier": tier,
        "summary": summary,
        "strengths": strengths,
        "improvement_areas": improvement_areas,
        "matched_skills_highlight": matched_skills,
        "missing_skills_highlight": missing_skills,
        "experience_assessment": exp_assessment,
        "education_assessment": edu_assessment
    }

def calculate_match(
    resume_text: str,
    candidate_skills: List[str],
    candidate_years: float,
    candidate_edu: str,
    candidate_projects: List[Dict],
    candidate_certs: List[str],
    job_text: str,
    job_required_skills: List[str],
    job_preferred_skills: List[str],
    job_min_years: float,
    job_education_required: str,
    candidate_name: str = "Candidate",
    weights: Dict[str, float] = None
) -> Dict[str, Any]:
    """
    Executes full multi-component matching algorithm with configurable weights:
    - Semantic similarity: 35%
    - Technical skill matching: 30%
    - Experience matching: 15%
    - Education matching: 10%
    - Project and certification relevance: 10%
    """
    if weights is None:
        weights = {
            "semantic": 35.0,
            "skill": 30.0,
            "experience": 15.0,
            "education": 10.0,
            "project": 10.0
        }
        
    # 1. Semantic Similarity (0 - 100)
    sem_sim = compute_semantic_similarity(resume_text, job_text) * 100.0
    
    # 2. Technical Skill Match (0 - 100)
    skill_score, matched_skills, missing_skills = compute_skill_match(
        candidate_skills, job_required_skills, job_preferred_skills
    )
    
    # 3. Experience Match (0 - 100)
    exp_score = compute_experience_match(candidate_years, job_min_years)
    
    # 4. Education Match (0 - 100)
    edu_score = compute_education_match(candidate_edu, job_education_required)
    
    # 5. Project & Certification Relevance (0 - 100)
    proj_score = compute_project_score(candidate_projects, candidate_certs, job_required_skills)
    
    # Weighted calculation
    w_sum = sum(weights.values()) or 100.0
    overall = (
        (sem_sim * weights.get("semantic", 35.0)) +
        (skill_score * weights.get("skill", 30.0)) +
        (exp_score * weights.get("experience", 15.0)) +
        (edu_score * weights.get("education", 10.0)) +
        (proj_score * weights.get("project", 10.0))
    ) / w_sum
    
    overall_clamped = round(float(np.clip(overall, 0.0, 100.0)), 1)
    
    explanation = generate_explanation(
        candidate_name=candidate_name,
        overall_score=overall_clamped,
        semantic_score=round(sem_sim, 1),
        skill_score=round(skill_score, 1),
        experience_score=round(exp_score, 1),
        education_score=round(edu_score, 1),
        project_score=round(proj_score, 1),
        matched_skills=matched_skills,
        missing_skills=missing_skills,
        candidate_years=candidate_years,
        required_years=job_min_years,
        candidate_edu=candidate_edu,
        required_edu=job_education_required
    )
    
    return {
        "overall_score": overall_clamped,
        "semantic_score": round(sem_sim, 1),
        "skill_score": round(skill_score, 1),
        "experience_score": round(exp_score, 1),
        "education_score": round(edu_score, 1),
        "project_score": round(proj_score, 1),
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "explanation": explanation
    }
