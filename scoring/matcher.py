"""
Matching & Scoring Engine — scores candidates against job roles.

Scoring Components (configurable weights in config.py):
  • Skill Match   (40%) — Jaccard overlap + TF-IDF cosine similarity
  • Experience    (30%) — Sigmoid-scaled comparison
  • Education     (15%) — Ordinal comparison
  • Keyword       (15%) — Full-text TF-IDF cosine similarity
"""
import math
import re
from typing import Dict, List, Optional, Tuple

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from config import SCORING_WEIGHTS, RECOMMENDATION_THRESHOLDS

# ── Education ordinal map ───────────────────────────────────────────────
EDUCATION_ORDINAL = {
    "High School / GED":      1,
    "Diploma / Certificate":  2,
    "Associate's Degree":     3,
    "Bachelor's Degree":      4,
    "Master's Degree":        5,
    "PhD / Doctorate":        6,
}


def _sigmoid(x: float, midpoint: float = 0.0, steepness: float = 1.0) -> float:
    """Scaled sigmoid function mapping (-∞,+∞) → (0,1)."""
    return 1.0 / (1.0 + math.exp(-steepness * (x - midpoint)))


def compute_skill_score(
    candidate_skills: List[str],
    required_skills: List[str],
    preferred_skills: List[str] | None = None,
) -> Tuple[float, List[str], List[str]]:
    """
    Compute skill match score (0–100).

    Returns: (score, matched_skills, missing_skills)
    """
    if not required_skills:
        return 100.0, list(candidate_skills), []

    cand_set = {s.lower().strip() for s in candidate_skills}
    req_set = {s.lower().strip() for s in required_skills}
    pref_set = {s.lower().strip() for s in (preferred_skills or [])}

    # Required skill overlap
    matched_required = cand_set & req_set
    missing_required = req_set - cand_set

    # Jaccard for required
    if req_set:
        jaccard_required = len(matched_required) / len(req_set) * 100
    else:
        jaccard_required = 100.0

    # Bonus for preferred skills (up to 10 pts)
    matched_preferred = cand_set & pref_set
    pref_bonus = 0.0
    if pref_set:
        pref_bonus = (len(matched_preferred) / len(pref_set)) * 10

    # TF-IDF cosine similarity between skill strings
    cand_text = " ".join(candidate_skills)
    req_text = " ".join(required_skills + (preferred_skills or []))
    tfidf_score = _tfidf_similarity(cand_text, req_text) * 100

    # Weighted average of Jaccard and TF-IDF
    score = (jaccard_required * 0.6 + tfidf_score * 0.4 + pref_bonus)
    score = min(100.0, max(0.0, score))

    matched = sorted(matched_required | matched_preferred)
    missing = sorted(missing_required)

    return round(score, 1), matched, missing


def compute_experience_score(
    candidate_years: float,
    required_years: float,
) -> float:
    """
    Compute experience match score (0–100) using sigmoid scaling.
    - Candidate meets requirement → 70-100
    - Candidate exceeds → approaches 100
    - Candidate falls short → graceful degradation
    """
    if required_years <= 0:
        return 100.0

    diff = candidate_years - required_years
    # Sigmoid: at diff=0 → 70, at diff=+3 → ~95, at diff=-3 → ~30
    raw = _sigmoid(diff, midpoint=0, steepness=0.8)
    score = 30 + (raw * 70)  # Map to 30–100 range
    return round(min(100.0, max(0.0, score)), 1)


def compute_education_score(
    candidate_education: Optional[str],
    required_education: Optional[str],
) -> float:
    """
    Compute education match score (0–100) via ordinal comparison.
    """
    if not required_education:
        return 100.0

    cand_level = EDUCATION_ORDINAL.get(candidate_education, 0)
    req_level = EDUCATION_ORDINAL.get(required_education, 0)

    if req_level == 0:
        return 100.0
    if cand_level == 0:
        return 20.0  # Unknown education, give partial credit

    if cand_level >= req_level:
        return 100.0
    elif cand_level == req_level - 1:
        return 70.0
    elif cand_level == req_level - 2:
        return 40.0
    else:
        return 20.0


def compute_keyword_score(resume_text: str, job_description: str) -> float:
    """
    Compute keyword relevance score (0–100) via TF-IDF cosine similarity
    between full resume text and job description.
    """
    if not resume_text or not job_description:
        return 0.0

    score = _tfidf_similarity(resume_text, job_description)
    return round(score * 100, 1)


def _tfidf_similarity(text_a: str, text_b: str) -> float:
    """Compute cosine similarity between two texts using TF-IDF."""
    if not text_a.strip() or not text_b.strip():
        return 0.0
    try:
        vectorizer = TfidfVectorizer(stop_words="english", max_features=5000)
        tfidf_matrix = vectorizer.fit_transform([text_a, text_b])
        sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        return float(sim)
    except ValueError:
        return 0.0


def get_recommendation(score: float) -> str:
    """Map overall score to a recommendation label."""
    for label, threshold in RECOMMENDATION_THRESHOLDS.items():
        if score >= threshold:
            return label
    return "Weak Fit"


def screen_candidate(
    candidate_skills: List[str],
    candidate_experience: float,
    candidate_education: Optional[str],
    candidate_text: str,
    job_required_skills: List[str],
    job_preferred_skills: List[str],
    job_min_experience: float,
    job_min_education: Optional[str],
    job_description: str,
) -> Dict:
    """
    Run full screening for one candidate against one job role.

    Returns dict with all component scores, overall score, and recommendation.
    """
    weights = SCORING_WEIGHTS

    skill_score, matched, missing = compute_skill_score(
        candidate_skills, job_required_skills, job_preferred_skills
    )
    experience_score = compute_experience_score(candidate_experience, job_min_experience)
    education_score = compute_education_score(candidate_education, job_min_education)
    keyword_score = compute_keyword_score(candidate_text, job_description)

    overall = (
        skill_score * weights["skills"]
        + experience_score * weights["experience"]
        + education_score * weights["education"]
        + keyword_score * weights["keyword"]
    )
    overall = round(min(100.0, max(0.0, overall)), 1)
    recommendation = get_recommendation(overall)

    return {
        "skill_score": round(skill_score, 1),
        "experience_score": round(experience_score, 1),
        "education_score": round(education_score, 1),
        "keyword_score": round(keyword_score, 1),
        "overall_score": overall,
        "recommendation": recommendation,
        "matched_skills": matched,
        "missing_skills": missing,
        "details": {
            "weights": weights,
            "candidate_experience_years": candidate_experience,
            "required_experience_years": job_min_experience,
            "candidate_education": candidate_education,
            "required_education": job_min_education,
        },
    }
