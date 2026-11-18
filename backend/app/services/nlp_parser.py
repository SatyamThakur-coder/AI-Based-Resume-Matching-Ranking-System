import re
from typing import Dict, List, Any

# Common stopwords to clean text for TF-IDF & NLP
STOPWORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", 
    "aren't", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", 
    "but", "by", "can", "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", 
    "doesn't", "doing", "don't", "down", "during", "each", "few", "for", "from", "further", "had", 
    "hadn't", "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", 
    "here", "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i", "i'd", 
    "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", 
    "let's", "me", "more", "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off", 
    "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", 
    "own", "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", 
    "some", "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves", 
    "then", "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've", 
    "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "wasn't", 
    "we", "we'd", "we'll", "we're", "we've", "were", "weren't", "what", "what's", "when", 
    "when's", "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's", 
    "with", "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", 
    "yours", "yourself", "yourselves"
}

def clean_text(text: str) -> str:
    """Cleans and normalizes text for NLP processing."""
    if not text:
        return ""
    # Normalize unicode and whitespace
    text = re.sub(r'[\r\n\t]+', ' ', text)
    # Remove excessive punctuation while preserving alphanumeric characters and key tech symbols (+, #, .)
    text = re.sub(r'[^\w\s\+\#\.]', ' ', text)
    # Collapse multi-spaces
    text = re.sub(r'\s+', ' ', text).strip()
    return text.lower()

def remove_stopwords(text: str) -> str:
    """Removes common stopwords while keeping domain and technical keywords."""
    words = text.split()
    filtered = [w for w in words if w.lower() not in STOPWORDS and len(w) > 1]
    return " ".join(filtered)

def segment_sections(raw_text: str) -> Dict[str, str]:
    """
    Segments resume text into distinct logical sections:
    Experience, Education, Skills, Projects, Certifications, Summary.
    """
    sections = {
        "summary": "",
        "experience": "",
        "education": "",
        "skills": "",
        "projects": "",
        "certifications": ""
    }
    
    section_patterns = {
        "experience": r"(?:work\s+experience|professional\s+experience|employment\s+history|experience)",
        "education": r"(?:education|academic\s+background|academic\s+qualifications|qualifications)",
        "skills": r"(?:technical\s+skills|core\s+competencies|skills\s+&\s+proficiencies|skills)",
        "projects": r"(?:key\s+projects|personal\s+projects|academic\s+projects|projects)",
        "certifications": r"(?:certifications|certificates|licenses|courses|accreditations)",
        "summary": r"(?:professional\s+summary|profile|about\s+me|summary|objective)"
    }
    
    # Find headers and indices in text
    lines = raw_text.splitlines()
    current_section = "summary"
    buffer: Dict[str, List[str]] = {k: [] for k in sections}
    
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        
        # Check if line matches a known section header
        header_found = None
        for sec, pattern in section_patterns.items():
            if re.match(r'^(?:[0-9\.\-\*#\s]*)\b' + pattern + r'\b(?:\s*[:\-]*)?$', stripped, re.IGNORECASE):
                header_found = sec
                break
        
        if header_found:
            current_section = header_found
        else:
            buffer[current_section].append(stripped)
            
    for sec in sections:
        sections[sec] = "\n".join(buffer[sec])
        
    return sections

