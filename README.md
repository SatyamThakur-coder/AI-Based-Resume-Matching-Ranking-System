# AI TalentMatch – Intelligent Resume Matching & Ranking System

[![Python](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![Sentence Transformers](https://img.shields.io/badge/Sentence--Transformers-all--MiniLM--L6--v2-orange.svg)](https://sbert.net/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An enterprise-grade, production-style web application designed to help recruiters and hiring teams automatically analyze candidate resumes, parse structured profiles, compare applicants against customizable job descriptions, compute explainable weighted multi-dimensional match scores, and rank applicants objectively without human bias.

---

## 1. Project Overview

Modern recruitment faces massive resume influx, where manual screening is tedious, inconsistent, and error-prone. **AI TalentMatch** automates and elevates this workflow by:
- Ingesting resumes in **PDF, DOCX, and TXT** formats.
- Automatically extracting candidate names, contact details, career duration, education level, certifications, projects, and technical skills.
- Evaluating candidates against job descriptions using a hybrid matching pipeline: **Bi-Encoder Sentence Transformer embeddings**, **TF-IDF n-gram cosine similarity**, **taxonomy-based technical skill matching**, and **seniority/education qualification matrices**.
- Providing **Explainable AI (XAI)** breakdowns: highlighting matching skills, critical skill gaps, experience suitability, and actionable interview recommendations.
- Offering interactive side-by-side **Candidate Comparison Matrices**, **Executive PDF Recruitment Reports**, and **CSV Exports**.

---

## 2. Problem Statement

Traditional Applicant Tracking Systems (ATS) rely primarily on rigid keyword matching, frequently missing qualified candidates who express identical concepts with synonymous phrasing (e.g., "FastAPI microservices" vs "Python backend development"). Conversely, generic AI models can produce opaque, uncalibrated scores without explaining *why* a candidate was ranked high or low.

**AI TalentMatch** bridges this gap:
1. **Semantic Awareness**: Understands nuanced context beyond literal keywords using neural embeddings.
2. **Transparent Explainability**: Unpacks every score into 5 distinct sub-dimensions.
3. **Recruiter Calibration**: Configurable weighting sliders allow hiring teams to prioritize deep technical skills, senior tenure, or educational background depending on the requisition.

---

## 3. System Architecture

```
                    ┌─────────────────────────────────────────────────────────┐
                    │               React + Vite Frontend (UI/UX)             │
                    │   • Dashboard (Metrics & Distribution Charts)           │
                    │   • Resume Upload & Review (Drag & Drop, Multi-file)    │
                    │   • Job Descriptions Management (Auto-extraction)       │
                    │   • Candidate Rankings & Comparison Matrix Modal        │
                    │   • Candidate Deep Dive Profile (Radar & XAI Breakdowns)│
                    │   • Analytics & Algorithm Weight Settings               │
                    └────────────────────────────┬────────────────────────────┘
                                                 │ HTTP / JSON REST APIs
                                                 ▼
                    ┌─────────────────────────────────────────────────────────┐
                    │                    FastAPI Backend                      │
                    │   /api/v1/candidates  •  /api/v1/jobs  •  /api/v1/matching│
                    │   /api/v1/analytics   •  /api/v1/reports  •  /settings  │
                    └───────┬────────────────────┬────────────────────┬───────┘
                            │                    │                    │
              ┌─────────────▼─────────┐ ┌────────▼──────────┐ ┌───────▼───────────────┐
              │ Parsing & Extraction  │ │  Matching Engine  │ │ Database & Storage    │
              │ • PyMuPDF (PDFs)      │ │ • SBERT Embeddings│ │ • SQLite + SQLAlchemy │
              │ • python-docx (DOCX)  │ │ • TF-IDF Cosine   │ │ • resumes/ storage    │
              │ • NLP Regex & Taxonomy│ │ • Skill Matrix    │ │ • ReportLab PDF Gen   │
              └───────────────────────┘ └───────────────────┘ └───────────────────────┘
```

---

## 4. Technologies Used

### Frontend
- **React.js 18 & Vite**: Lightning-fast modular single-page architecture.
- **Tailwind CSS**: Modern SaaS white and navy palette with rounded cards and subtle gradients.
- **Recharts**: Interactive radar charts, bar charts, and distribution analytics.
- **Lucide React**: Clean iconography.

### Backend & AI/ML
- **FastAPI**: Asynchronous, high-performance Python web framework with automatic OpenAPI docs.
- **Sentence Transformers (`all-MiniLM-L6-v2`)**: Generates 384-dimensional dense semantic vectors for candidate text and job descriptions.
- **Scikit-learn**: TF-IDF vectorization and cosine similarity calculations.
- **PyMuPDF (`fitz`) & python-docx**: Robust document text and metadata extraction.
- **SQLAlchemy ORM & SQLite**: Relational database managing candidates, requisitions, match results, and weight settings.
- **ReportLab**: Programmatic PDF recruitment report generation.

---

## 5. Matching Algorithm & Mathematical Formulation

The matching engine computes five independent sub-scores $\in [0, 100]$:

### 1. Semantic Similarity ($S_{\text{sem}}$)
Given dense embeddings $\mathbf{u} = \text{Embed}(\text{Resume})$ and $\mathbf{v} = \text{Embed}(\text{Job Description})$ generated by `all-MiniLM-L6-v2`:
$$\text{Cosine Sim}(\mathbf{u}, \mathbf{v}) = \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\|_2 \|\mathbf{v}\|_2}$$
Normalized to percentage scale:
$$S_{\text{sem}} = \text{clip}\left(\frac{\text{sim} - 0.10}{0.85}, 0, 1\right) \times 100$$
*(Combined with bigram TF-IDF cosine similarity as a high-fidelity hybrid fallback).*

### 2. Technical Skill Match ($S_{\text{skill}}$)
Let $R$ be the set of required skills, $P$ preferred skills, and $C$ candidate skills:
$$\text{Coverage}_{\text{req}} = \frac{|C \cap R|}{|R|}, \quad \text{Coverage}_{\text{pref}} = \frac{|C \cap P|}{|P|}$$
$$S_{\text{skill}} = \left(0.85 \times \text{Coverage}_{\text{req}} + 0.15 \times \text{Coverage}_{\text{pref}}\right) \times 100$$

### 3. Experience Match ($S_{\text{exp}}$)
Comparing candidate experience years $Y_c$ with requisition minimum $Y_r$:
$$S_{\text{exp}} = \begin{cases} 
100 & \text{if } Y_c \ge Y_r \\
\text{clip}\left(\frac{Y_c}{Y_r} \times 90, 10, 95\right) & \text{if } Y_c < Y_r 
\end{cases}$$

### 4. Education Match ($S_{\text{edu}}$)
Degrees mapped to ordinal ranks (Doctorate: 5, Master's: 4, Bachelor's: 3, Associate: 2, Other: 1). If candidate meets or exceeds target level, score is 100%; one level below yields 80%; two levels below yields 60%.

### 5. Project & Certification Relevance ($S_{\text{proj}}$)
Based on technical keyword density across candidate project portfolios and verified certifications.

---

## 6. Scoring Methodology

The final match score is calculated as the normalized weighted sum:

$$\text{Final Score} = \frac{w_{\text{sem}} S_{\text{sem}} + w_{\text{skill}} S_{\text{skill}} + w_{\text{exp}} S_{\text{exp}} + w_{\text{edu}} S_{\text{edu}} + w_{\text{proj}} S_{\text{proj}}}{w_{\text{sem}} + w_{\text{skill}} + w_{\text{exp}} + w_{\text{edu}} + w_{\text{proj}}}$$

### Default Weights:
- **Semantic Similarity**: 35%
- **Technical Skill Matching**: 30%
- **Experience Matching**: 15%
- **Education Matching**: 10%
- **Project & Certification Relevance**: 10%
- **Total**: 100%

*All weights are fully customizable in real time via the Algorithm Settings page.*

---

## 7. Installation Instructions

### Prerequisites
- **Python**: 3.10+ (tested on Python 3.12)
- **Node.js**: 18+ and `npm`

### Clone and Setup Environment
```bash
git clone https://github.com/your-username/ai-talentmatch.git
cd ai-talentmatch

# 1. Install Python Backend Dependencies
pip install -r requirements.txt

# 2. Install Frontend Dependencies
cd frontend
npm install
cd ..
```

---

## 8. How to Run Frontend and Backend

### Option A: Development Mode (Hot Reload)
Open two terminal tabs:

**Terminal 1 (Backend):**
```bash
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be live at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```
Open your browser to: [http://localhost:5173](http://localhost:5173)

### Option B: Single Production Server
Build the frontend once and let FastAPI serve both the web app and REST APIs on port 8000:
```bash
# Build frontend
npm run build:frontend

# Launch unified server
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```
Open your browser to: [http://127.0.0.1:8000](http://127.0.0.1:8000)

---

## 9. API Documentation

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Healthcheck endpoint |
| `GET` | `/api/v1/candidates` | List parsed candidates with search and pagination |
| `POST` | `/api/v1/candidates/upload` | Upload multiple resumes (`.pdf`, `.docx`, `.txt`) |
| `POST` | `/api/v1/candidates/seed-demo` | Populate realistic demo candidates |
| `GET` | `/api/v1/jobs` | List active job requisitions |
| `POST` | `/api/v1/jobs` | Create a job description (with skill auto-extraction) |
| `POST` | `/api/v1/matching/run` | Execute AI matching engine for a job requisition |
| `GET` | `/api/v1/matching/results/{job_id}` | Retrieve sorted candidate rankings with filters |
| `POST` | `/api/v1/matching/compare` | Multi-candidate side-by-side comparison matrix |
| `GET` | `/api/v1/analytics/dashboard` | Dashboard KPIs, skill supply/demand, score tiers |
| `GET` | `/api/v1/reports/export/csv/{job_id}` | Download ranking spreadsheet in CSV format |
| `GET` | `/api/v1/reports/export/pdf/{job_id}` | Generate downloadable executive recruitment PDF report |
| `GET` | `/api/v1/settings/weights` | Get current matching dimension weights |
| `PUT` | `/api/v1/settings/weights` | Update algorithm weights (must sum to 100%) |

---

## 10. Key Features Walkthrough

1. **One-Click Demo Data**: Click "Load Sample Data" in the top navigation bar to populate 5 realistic engineering candidates and 3 standard job requisitions instantly.
2. **Multi-File Resume Upload**: Drag-and-drop or select PDF and DOCX files. View extracted skills, contact information, and career history cards immediately.
3. **Requisition Management**: Post new openings with automated skill extraction from job text.
4. **Rankings & Filtering**: Real-time sortable leaderboard displaying match %, matched skills, missing skills, and score tier badges. Filter by minimum score and minimum experience years.
5. **Side-by-Side Comparison**: Check boxes on any 2 to 4 candidates and click "Compare Selected" to inspect side-by-side radar metrics and gaps.
6. **Candidate Deep Dive**: Explore full candidate profiles with 5-axis radar charts, career history timelines, and explainable AI strength/gap narratives.
7. **Executive PDF & CSV Reports**: One-click download of styled, ready-to-share recruitment summary documents for hiring managers.
8. **Configurable Algorithm Settings**: Interactive weight sliders with validation and preset configurations.

---

## 11. Automated Testing

The project includes unit tests for the parsing, extraction, and matching algorithms, as well as end-to-end integration tests:

```bash
# Run all automated tests
$env:PYTHONPATH="backend"; python -m pytest backend/tests -v
```

All 18 automated test suites cover:
- Resume text extraction and regex normalization
- Contact information parsing (Email, Phone, Location)
- Career tenure and date range computation
- Skill extraction against comprehensive taxonomy
- TF-IDF and Sentence Transformer cosine similarity
- Experience and education level ranking
- Full weighted match score computation
- Database seeding and CRUD operations
- Side-by-side comparison matrix generation
- ReportLab PDF generation and CSV export
- Weight configuration validation

---

## 12. Limitations & Future Improvements

- **Optical Character Recognition (OCR)**: Scanned image resumes can be integrated using Tesseract or cloud vision OCR for non-text PDFs.
- **Multilingual Support**: Expanding skill taxonomies and multilingual embeddings (e.g., `paraphrase-multilingual-MiniLM-L12-v2`).
- **ATS Webhook Integration**: Direct syncing with Greenhouse, Lever, and Workday APIs.
- **AI Interview Question Generator**: Dynamically generating customized interview questions tailored specifically to each candidate's missing skill gaps.

