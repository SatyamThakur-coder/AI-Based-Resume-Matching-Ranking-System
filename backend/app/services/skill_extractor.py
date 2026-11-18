import re
from typing import List, Set, Dict

# Standard taxonomy mapping canonical skill -> list of aliases / variants
SKILL_TAXONOMY: Dict[str, List[str]] = {
    # Programming Languages
    "Python": ["python", "python3", "py"],
    "JavaScript": ["javascript", "js", "ecmascript"],
    "TypeScript": ["typescript", "ts"],
    "Java": ["java", "j2ee"],
    "C++": ["c++", "cpp"],
    "C#": ["c#", "csharp", ".net c#"],
    "Go": ["golang", r"\bgo\b"],
    "Rust": ["rust"],
    "Ruby": ["ruby", "ruby on rails", "rails"],
    "PHP": ["php"],
    "Swift": ["swift"],
    "Kotlin": ["kotlin"],
    "SQL": ["sql", "structured query language"],
    "HTML": ["html", "html5"],
    "CSS": ["css", "css3"],
    "R": [r"\br\b", "r-lang"],
    "Bash": ["bash", "shell scripting", "sh"],

    # Frontend Technologies
    "React": ["react", "react.js", "reactjs"],
    "Next.js": ["next.js", "nextjs", "next"],
    "Vue.js": ["vue", "vue.js", "vuejs"],
    "Angular": ["angular", "angularjs"],
    "Svelte": ["svelte", "sveltekit"],
    "Tailwind CSS": ["tailwind", "tailwindcss", "tailwind-css"],
    "Bootstrap": ["bootstrap"],
    "Redux": ["redux", "redux toolkit", "rtk"],
    "Vite": ["vite", "vitejs"],
    "Webpack": ["webpack"],
    "GraphQL": ["graphql"],
    "REST API": ["rest", "restful", "rest api", "rest apis", "restful apis"],

    # Backend Technologies
    "Node.js": ["node.js", "nodejs", "node"],
    "Express.js": ["express", "express.js", "expressjs"],
    "FastAPI": ["fastapi", "fast-api"],
    "Django": ["django"],
    "Flask": ["flask"],
    "Spring Boot": ["spring boot", "springboot", "spring framework"],
    "ASP.NET": ["asp.net", "dotnet", ".net core"],
    "Microservices": ["microservices", "microservice architecture"],

    # AI, Machine Learning & Data Science
    "Machine Learning": ["machine learning", "ml"],
    "Deep Learning": ["deep learning", "dl"],
    "Natural Language Processing": ["nlp", "natural language processing"],
    "Computer Vision": ["computer vision", "cv"],
    "Sentence Transformers": ["sentence-transformers", "sentence transformers", "sbert"],
    "PyTorch": ["pytorch", "torch"],
    "TensorFlow": ["tensorflow", "tf"],
    "Scikit-learn": ["scikit-learn", "sklearn"],
    "Keras": ["keras"],
    "Hugging Face": ["hugging face", "huggingface", "transformers"],
    "Large Language Models": ["llm", "llms", "large language models"],
    "LangChain": ["langchain"],
    "LlamaIndex": ["llamaindex"],
    "RAG": ["rag", "retrieval augmented generation", "retrieval-augmented generation"],
    "Vector Databases": ["vector database", "faiss", "pinecone", "chromadb", "weaviate", "qdrant"],
    "Pandas": ["pandas"],
    "NumPy": ["numpy"],
    "Data Science": ["data science"],
    "Data Analysis": ["data analysis", "data analytics"],
    "Tableau": ["tableau"],
    "Power BI": ["power bi", "powerbi"],

    # Cloud & DevOps
    "AWS": ["aws", "amazon web services", "ec2", "s3", "lambda"],
    "Azure": ["azure", "microsoft azure"],
    "Google Cloud Platform": ["gcp", "google cloud", "google cloud platform"],
    "Docker": ["docker", "containerization"],
    "Kubernetes": ["kubernetes", "k8s"],
    "CI/CD": ["ci/cd", "continuous integration", "github actions", "jenkins", "gitlab ci"],
    "Terraform": ["terraform"],
    "Linux": ["linux", "ubuntu", "debian", "centos"],
    "Nginx": ["nginx"],

    # Databases
    "PostgreSQL": ["postgresql", "postgres"],
    "MySQL": ["mysql"],
    "MongoDB": ["mongodb", "mongo"],
    "Redis": ["redis"],
    "SQLite": ["sqlite", "sqlite3"],
    "Cassandra": ["cassandra"],
    "Elasticsearch": ["elasticsearch", "elastic search"],
    "Firebase": ["firebase", "firestore"],

    # Tools & Methodologies
    "Git": ["git", "version control"],
    "GitHub": ["github"],
    "GitLab": ["gitlab"],
    "Jira": ["jira"],
    "Agile": ["agile", "scrum", "kanban"],
    "Unit Testing": ["unit testing", "pytest", "jest", "unittest", "tdd"],
    "System Design": ["system design", "software architecture"]
}

def extract_skills(text: str) -> List[str]:
    """
    Extracts skills from text using normalized matching against our comprehensive taxonomy.
    Preserves canonical capitalization.
    """
    if not text:
        return []
    
    # Replace common trailing sentence punctuation with spaces before matching
    # but preserve technical dots like .js or .net or c++ or c#
    normalized = re.sub(r'([a-zA-Z0-9])[\.,;:\!\?](?=\s|$)', r'\1 ', text)
    text_lower = " " + normalized.lower() + " "
    matched_skills: Set[str] = set()

    for canonical_name, aliases in SKILL_TAXONOMY.items():
        for alias in aliases:
            # If alias starts with \b it's a regex
            if "\\" in alias:
                if re.search(alias, text_lower, re.IGNORECASE):
                    matched_skills.add(canonical_name)
                    break
            else:
                # Word-boundary search
                pattern = r'(?<![a-zA-Z0-9_\-\+])' + re.escape(alias) + r'(?![a-zA-Z0-9_\-\+])'
                if re.search(pattern, text_lower, re.IGNORECASE):
                    matched_skills.add(canonical_name)
                    break

    return sorted(list(matched_skills))
