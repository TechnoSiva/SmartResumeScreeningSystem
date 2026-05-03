"""
SQLAlchemy ORM models for the Smart Resume Screening System.
"""
import json
from datetime import datetime, timezone

from sqlalchemy import (
    Column, Integer, String, Float, Text, DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import relationship

from database import Base


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    email = Column(String(200), nullable=True)
    phone = Column(String(50), nullable=True)
    file_name = Column(String(300), nullable=False)
    file_path = Column(String(500), nullable=False)
    raw_text = Column(Text, nullable=True)
    skills = Column(JSON, default=list)          # list of extracted skills
    skills_categorized = Column(JSON, default=dict)  # {"technical": [], "soft_skills": [], "tools": []}
    experience_years = Column(Float, default=0.0)
    education_level = Column(String(100), nullable=True)
    summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    screening_results = relationship(
        "ScreeningResult", back_populates="candidate", cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "file_name": self.file_name,
            "skills": self.skills or [],
            "skills_categorized": self.skills_categorized or {},
            "experience_years": self.experience_years,
            "education_level": self.education_level,
            "summary": self.summary,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class JobRole(Base):
    __tablename__ = "job_roles"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    department = Column(String(200), nullable=True)
    description = Column(Text, nullable=False)
    required_skills = Column(JSON, default=list)    # list of required skill strings
    preferred_skills = Column(JSON, default=list)   # nice-to-have skills
    min_experience = Column(Float, default=0.0)
    min_education = Column(String(100), nullable=True)  # "Bachelors", "Masters", etc.
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    screening_results = relationship(
        "ScreeningResult", back_populates="job_role", cascade="all, delete-orphan"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "department": self.department,
            "description": self.description,
            "required_skills": self.required_skills or [],
            "preferred_skills": self.preferred_skills or [],
            "min_experience": self.min_experience,
            "min_education": self.min_education,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class ScreeningResult(Base):
    __tablename__ = "screening_results"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    job_role_id = Column(Integer, ForeignKey("job_roles.id"), nullable=False)
    skill_score = Column(Float, default=0.0)
    experience_score = Column(Float, default=0.0)
    education_score = Column(Float, default=0.0)
    keyword_score = Column(Float, default=0.0)
    overall_score = Column(Float, default=0.0)
    recommendation = Column(String(50), nullable=True)
    matched_skills = Column(JSON, default=list)
    missing_skills = Column(JSON, default=list)
    details = Column(JSON, default=dict)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    candidate = relationship("Candidate", back_populates="screening_results")
    job_role = relationship("JobRole", back_populates="screening_results")

    def to_dict(self):
        return {
            "id": self.id,
            "candidate_id": self.candidate_id,
            "job_role_id": self.job_role_id,
            "candidate_name": self.candidate.name if self.candidate else None,
            "job_title": self.job_role.title if self.job_role else None,
            "skill_score": round(self.skill_score, 1),
            "experience_score": round(self.experience_score, 1),
            "education_score": round(self.education_score, 1),
            "keyword_score": round(self.keyword_score, 1),
            "overall_score": round(self.overall_score, 1),
            "recommendation": self.recommendation,
            "matched_skills": self.matched_skills or [],
            "missing_skills": self.missing_skills or [],
            "details": self.details or {},
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
