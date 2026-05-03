"""
FastAPI route definitions.
"""
import os
import shutil
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

import models
from database import get_db
from config import UPLOAD_DIR, ALLOWED_EXTENSIONS
from nlp_engine.resume_parser import parse_resume
from nlp_engine.skill_extractor import extract_skills
from nlp_engine.experience_parser import estimate_experience_years, detect_education_level
from scoring.matcher import screen_candidate

router = APIRouter()


# ════════════════════════════════════════════════════════════════════════
# CANDIDATES & RESUMES
# ════════════════════════════════════════════════════════════════════════

@router.post("/upload-resume")
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload a PDF/DOCX resume.
    It will be parsed, skills extracted, and saved to the database.
    """
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File extension {ext} not allowed.")

    # Save file
    file_path = UPLOAD_DIR / file.filename
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # Parse text and contact info
        parsed_data = parse_resume(str(file_path))
        raw_text = parsed_data["raw_text"]
        
        # Extract skills
        skills_categorized = extract_skills(raw_text)
        all_skills = skills_categorized.pop("all", [])

        # Parse experience & education
        exp_years = estimate_experience_years(raw_text)
        edu_level = detect_education_level(raw_text)

        # Create Candidate record
        candidate = models.Candidate(
            name=parsed_data["name"] or file.filename,
            email=parsed_data["email"],
            phone=parsed_data["phone"],
            file_name=file.filename,
            file_path=str(file_path),
            raw_text=raw_text,
            skills=all_skills,
            skills_categorized=skills_categorized,
            experience_years=exp_years,
            education_level=edu_level,
        )
        db.add(candidate)
        db.commit()
        db.refresh(candidate)

        return {"message": "Upload successful", "candidate": candidate.to_dict()}

    except Exception as e:
        # Cleanup file if DB insertion/parsing fails
        if file_path.exists():
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/candidates")
def list_candidates(db: Session = Depends(get_db)):
    cands = db.query(models.Candidate).order_by(desc(models.Candidate.created_at)).all()
    return {"candidates": [c.to_dict() for c in cands]}


@router.get("/candidates/{candidate_id}")
def get_candidate(candidate_id: int, db: Session = Depends(get_db)):
    cand = db.query(models.Candidate).filter(models.Candidate.id == candidate_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return cand.to_dict()


@router.delete("/candidates/{candidate_id}")
def delete_candidate(candidate_id: int, db: Session = Depends(get_db)):
    cand = db.query(models.Candidate).filter(models.Candidate.id == candidate_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Optional: Delete actual file
    if Path(cand.file_path).exists():
        try:
            os.remove(cand.file_path)
        except OSError:
            pass

    db.delete(cand)
    db.commit()
    return {"message": "Deleted successfully"}


# ════════════════════════════════════════════════════════════════════════
# JOB ROLES
# ════════════════════════════════════════════════════════════════════════

from pydantic import BaseModel

class JobRoleCreate(BaseModel):
    title: str
    department: Optional[str] = None
    description: str
    required_skills: List[str] = []
    preferred_skills: List[str] = []
    min_experience: float = 0.0
    min_education: Optional[str] = None


@router.post("/job-roles")
def create_job_role(job: JobRoleCreate, db: Session = Depends(get_db)):
    new_job = models.JobRole(**job.model_dump())
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    return new_job.to_dict()


@router.get("/job-roles")
def list_job_roles(db: Session = Depends(get_db)):
    jobs = db.query(models.JobRole).order_by(desc(models.JobRole.created_at)).all()
    return {"job_roles": [j.to_dict() for j in jobs]}


@router.get("/job-roles/{job_id}")
def get_job_role(job_id: int, db: Session = Depends(get_db)):
    job = db.query(models.JobRole).filter(models.JobRole.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job Role not found")
    return job.to_dict()

@router.delete("/job-roles/{job_id}")
def delete_job_role(job_id: int, db: Session = Depends(get_db)):
    job = db.query(models.JobRole).filter(models.JobRole.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job Role not found")
    
    db.delete(job)
    db.commit()
    return {"message": "Deleted successfully"}


# ════════════════════════════════════════════════════════════════════════
# SCREENING & MATCHING
# ════════════════════════════════════════════════════════════════════════

@router.post("/screen/{job_id}/{candidate_id}")
def screen_single(job_id: int, candidate_id: int, db: Session = Depends(get_db)):
    """Screen one candidate against one job."""
    job = db.query(models.JobRole).filter(models.JobRole.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job Role not found")

    cand = db.query(models.Candidate).filter(models.Candidate.id == candidate_id).first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")

    result_dict = screen_candidate(
        candidate_skills=cand.skills,
        candidate_experience=cand.experience_years,
        candidate_education=cand.education_level,
        candidate_text=cand.raw_text or "",
        job_required_skills=job.required_skills,
        job_preferred_skills=job.preferred_skills,
        job_min_experience=job.min_experience,
        job_min_education=job.min_education,
        job_description=job.description,
    )

    # Delete existing result if any (ensure 1-to-1 per job/candidate pair)
    db.query(models.ScreeningResult).filter(
        models.ScreeningResult.job_role_id == job_id,
        models.ScreeningResult.candidate_id == candidate_id
    ).delete()

    sr = models.ScreeningResult(
        candidate_id=cand.id,
        job_role_id=job.id,
        **result_dict
    )
    db.add(sr)
    db.commit()
    db.refresh(sr)

    return sr.to_dict()


@router.post("/screen-bulk/{job_id}")
def screen_bulk(job_id: int, db: Session = Depends(get_db)):
    """Screen ALL candidates against a single job role."""
    job = db.query(models.JobRole).filter(models.JobRole.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job Role not found")

    candidates = db.query(models.Candidate).all()
    results = []

    for cand in candidates:
        r_dict = screen_candidate(
            candidate_skills=cand.skills,
            candidate_experience=cand.experience_years,
            candidate_education=cand.education_level,
            candidate_text=cand.raw_text or "",
            job_required_skills=job.required_skills,
            job_preferred_skills=job.preferred_skills,
            job_min_experience=job.min_experience,
            job_min_education=job.min_education,
            job_description=job.description,
        )

        db.query(models.ScreeningResult).filter(
            models.ScreeningResult.job_role_id == job_id,
            models.ScreeningResult.candidate_id == cand.id
        ).delete()

        sr = models.ScreeningResult(
            candidate_id=cand.id,
            job_role_id=job.id,
            **r_dict
        )
        db.add(sr)
        results.append(sr)

    db.commit()
    return {"message": f"Screened {len(candidates)} candidates", "count": len(candidates)}


@router.get("/results/job/{job_id}")
def get_results_for_job(job_id: int, db: Session = Depends(get_db)):
    """Get ranked results for a specific job."""
    results = (
        db.query(models.ScreeningResult)
        .filter(models.ScreeningResult.job_role_id == job_id)
        .order_by(desc(models.ScreeningResult.overall_score))
        .all()
    )
    return {"results": [r.to_dict() for r in results]}


# ════════════════════════════════════════════════════════════════════════
# DASHBOARD STATS
# ════════════════════════════════════════════════════════════════════════

@router.get("/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    num_candidates = db.query(func.count(models.Candidate.id)).scalar()
    num_jobs = db.query(func.count(models.JobRole.id)).scalar()
    num_screenings = db.query(func.count(models.ScreeningResult.id)).scalar()
    
    avg_score = db.query(func.avg(models.ScreeningResult.overall_score)).scalar() or 0.0

    # Top recommendations count
    rec_counts = db.query(
        models.ScreeningResult.recommendation, 
        func.count(models.ScreeningResult.id)
    ).group_by(models.ScreeningResult.recommendation).all()
    
    rec_dict = {rc[0]: rc[1] for rc in rec_counts}

    return {
        "total_candidates": num_candidates,
        "total_jobs": num_jobs,
        "total_screenings": num_screenings,
        "avg_score": round(avg_score, 1),
        "recommendation_breakdown": rec_dict,
    }
