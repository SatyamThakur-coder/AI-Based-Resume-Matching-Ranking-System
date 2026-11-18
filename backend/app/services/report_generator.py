import io
import csv
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from app.config import settings

def generate_csv_report(job_title: str, results: List[Dict[str, Any]]) -> str:
    """Generates CSV format string of candidate rankings."""
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Headers
    writer.writerow([
        "Rank", "Candidate Name", "Email", "Overall Match Score (%)",
        "Semantic Score (%)", "Skill Score (%)", "Experience Score (%)",
        "Education Score (%)", "Project Score (%)", "Years Experience",
        "Matched Skills", "Missing Skills", "Tier"
    ])
    
    for idx, r in enumerate(results, 1):
        explanation = r.get("explanation", {})
        writer.writerow([
            idx,
            r.get("candidate_name", "N/A"),
            r.get("candidate_email", "N/A"),
            r.get("overall_score", 0.0),
            r.get("semantic_score", 0.0),
            r.get("skill_score", 0.0),
            r.get("experience_score", 0.0),
            r.get("education_score", 0.0),
            r.get("project_score", 0.0),
            r.get("candidate_experience_years", 0.0),
            "; ".join(r.get("matched_skills", [])),
            "; ".join(r.get("missing_skills", [])),
            explanation.get("tier", "N/A")
        ])
        
    return output.getvalue()

def generate_pdf_report(job: Dict[str, Any], results: List[Dict[str, Any]]) -> Path:
    """Generates a polished PDF report using ReportLab."""
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    file_name = f"Recruitment_Report_Job_{job.get('id', 'all')}_{timestamp}.pdf"
    file_path = settings.REPORTS_DIR / file_name
    
    doc = SimpleDocTemplate(
        str(file_path),
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Palette
    NAVY = colors.HexColor("#0F172A")
    ACCENT_BLUE = colors.HexColor("#2563EB")
    TEXT_MUTED = colors.HexColor("#64748B")
    BG_LIGHT = colors.HexColor("#F8FAFC")
    BORDER_COLOR = colors.HexColor("#E2E8F0")
    GREEN = colors.HexColor("#16A34A")
    AMBER = colors.HexColor("#D97706")
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=NAVY
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=TEXT_MUTED
    )
    
    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=NAVY,
        spaceBefore=14,
        spaceAfter=6
    )
    
    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=NAVY
    )

    story = []
    
    # Header Banner
    story.append(Paragraph("AI TalentMatch – Recruitment Ranking & Analysis Report", title_style))
    story.append(Paragraph(f"Generated on {datetime.utcnow().strftime('%B %d, %Y at %H:%M UTC')} | Intelligent Resume Screening", subtitle_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=ACCENT_BLUE, spaceBefore=4, spaceAfter=14))
    
    # Role Details Table
    job_info = [
        [
            Paragraph("<b>Target Role:</b>", body_style),
            Paragraph(job.get("title", "Untitled Role"), body_style),
            Paragraph("<b>Department:</b>", body_style),
            Paragraph(job.get("department", "Engineering"), body_style)
        ],
        [
            Paragraph("<b>Experience Target:</b>", body_style),
            Paragraph(f"{job.get('min_experience_years', 0)} Years ({job.get('experience_level', 'Mid-Level')})", body_style),
            Paragraph("<b>Candidates Evaluated:</b>", body_style),
            Paragraph(f"{len(results)} Applicants", body_style)
        ]
    ]
    t_job = Table(job_info, colWidths=[110, 150, 120, 140])
    t_job.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_LIGHT),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_job)
    story.append(Spacer(1, 14))
    
    # Candidate Rankings Table
    story.append(Paragraph("Executive Candidate Ranking Summary", h2_style))
    
    table_data = [
        [
            Paragraph("<b>Rank</b>", body_style),
            Paragraph("<b>Candidate Name</b>", body_style),
            Paragraph("<b>Score</b>", body_style),
            Paragraph("<b>Semantic</b>", body_style),
            Paragraph("<b>Skills</b>", body_style),
            Paragraph("<b>Exp</b>", body_style),
            Paragraph("<b>Tier</b>", body_style)
        ]
    ]
    
    for idx, r in enumerate(results[:25], 1):
        explanation = r.get("explanation", {})
        score = r.get("overall_score", 0.0)
        tier_str = explanation.get("tier", "Qualified")
        
        table_data.append([
            Paragraph(f"#{idx}", body_style),
            Paragraph(f"<b>{r.get('candidate_name', 'Applicant')}</b>", body_style),
            Paragraph(f"<b>{score:.1f}%</b>", body_style),
            Paragraph(f"{r.get('semantic_score', 0):.1f}%", body_style),
            Paragraph(f"{r.get('skill_score', 0):.1f}%", body_style),
            Paragraph(f"{r.get('candidate_experience_years', 0):.1f} yrs", body_style),
            Paragraph(f"{tier_str.split('(')[0].strip()}", body_style)
        ])
        
    rank_table = Table(table_data, colWidths=[40, 150, 55, 55, 55, 55, 110])
    rank_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#1E293B")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
    ]))
    story.append(rank_table)
    story.append(Spacer(1, 15))
    
    # Top 3 In-Depth Analysis
    story.append(Paragraph("In-Depth Analysis: Top Ranked Candidates", h2_style))
    for idx, top in enumerate(results[:3], 1):
        expl = top.get("explanation", {})
        strengths = expl.get("strengths", [])
        gaps = expl.get("missing_skills_highlight", [])
        
        cand_block = [
            [
                Paragraph(f"<b>Rank #{idx}: {top.get('candidate_name')}</b> — Overall Score: <b>{top.get('overall_score', 0):.1f}%</b>", body_style)
            ],
            [
                Paragraph(f"<b>Summary:</b> {expl.get('summary', 'Candidate meets required standards.')}", body_style)
            ],
            [
                Paragraph(f"<b>Matched Skills:</b> {', '.join(top.get('matched_skills', [])[:8]) if top.get('matched_skills') else 'General Alignment'}", body_style)
            ],
            [
                Paragraph(f"<b>Missing Skills:</b> {', '.join(gaps[:5]) if gaps else 'None detected (full coverage)'}", body_style)
            ]
        ]
        t_block = Table(cand_block, colWidths=[520])
        t_block.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), BG_LIGHT),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#CBD5E1")),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(t_block)
        story.append(Spacer(1, 8))
        
    doc.build(story)
    return file_path

