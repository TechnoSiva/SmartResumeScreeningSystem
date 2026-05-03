"""
Experience & Education Parser — detects years of experience and education level.
"""
import re
from datetime import datetime
from typing import Optional


# ── Education Level Hierarchy (higher = better) ────────────────────────
EDUCATION_LEVELS = {
    "phd":        6,
    "doctorate":  6,
    "doctor":     6,
    "ph.d":       6,
    "masters":    5,
    "master":     5,
    "m.s.":       5,
    "m.sc":       5,
    "msc":        5,
    "m.tech":     5,
    "mtech":      5,
    "mba":        5,
    "m.b.a":      5,
    "m.a.":       5,
    "bachelors":  4,
    "bachelor":   4,
    "b.s.":       4,
    "b.sc":       4,
    "bsc":        4,
    "b.tech":     4,
    "btech":      4,
    "b.e.":       4,
    "b.a.":       4,
    "b.com":      4,
    "bcom":       4,
    "bba":        4,
    "associate":  3,
    "associates": 3,
    "a.s.":       3,
    "diploma":    2,
    "certificate": 2,
    "certification": 2,
    "high school": 1,
    "ged":        1,
}

EDUCATION_NAMES = {
    6: "PhD / Doctorate",
    5: "Master's Degree",
    4: "Bachelor's Degree",
    3: "Associate's Degree",
    2: "Diploma / Certificate",
    1: "High School / GED",
}


def detect_education_level(text: str) -> Optional[str]:
    """
    Detect the highest education level mentioned in the text.
    Returns a human-readable label or None.
    """
    text_lower = text.lower()
    max_level = 0

    for keyword, level in EDUCATION_LEVELS.items():
        if keyword in text_lower:
            max_level = max(max_level, level)

    return EDUCATION_NAMES.get(max_level)


def estimate_experience_years(text: str) -> float:
    """
    Estimate total years of professional experience from resume text.

    Strategy:
    1. Look for explicit statements like "X years of experience"
    2. Parse date ranges (e.g. "Jan 2018 – Dec 2022") and sum durations
    3. Return the higher of the two estimates
    """
    years_explicit = _extract_explicit_years(text)
    years_from_dates = _extract_years_from_date_ranges(text)
    return max(years_explicit, years_from_dates)


def _extract_explicit_years(text: str) -> float:
    """Extract years from explicit statements like '5 years of experience'."""
    patterns = [
        r"(\d+)\+?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:experience|exp)",
        r"(?:experience|exp)\s*(?:of\s+)?(\d+)\+?\s*(?:years?|yrs?)",
        r"(\d+)\+?\s*(?:years?|yrs?)\s+(?:in|of|working)",
        r"over\s+(\d+)\s+(?:years?|yrs?)",
    ]
    max_years = 0.0
    text_lower = text.lower()
    for pattern in patterns:
        for match in re.finditer(pattern, text_lower):
            try:
                years = float(match.group(1))
                if 0 < years < 50:  # sanity check
                    max_years = max(max_years, years)
            except (ValueError, IndexError):
                continue
    return max_years


def _extract_years_from_date_ranges(text: str) -> float:
    """
    Parse date ranges like "Jan 2018 – Dec 2022" or "2018 - 2022"
    and sum the durations.
    """
    # Patterns for date ranges
    month_pattern = (
        r"(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|"
        r"jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|"
        r"oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)"
    )

    # "Month Year – Month Year" or "Month Year – Present"
    range_pattern = re.compile(
        rf"({month_pattern})\s*[\.,]?\s*(\d{{4}})\s*"
        rf"[\–\-–—~to]+\s*"
        rf"(?:({month_pattern})\s*[\.,]?\s*(\d{{4}})|present|current|now|ongoing)",
        re.IGNORECASE,
    )

    # "Year – Year"
    year_range_pattern = re.compile(
        r"(\d{4})\s*[\–\-–—~to]+\s*(?:(\d{4})|present|current|now|ongoing)",
        re.IGNORECASE,
    )

    total_months = 0
    current_year = datetime.now().year

    # Try detailed month-year ranges first
    for match in range_pattern.finditer(text):
        try:
            start_year = int(match.group(2))
            end_month_str = match.group(3)
            end_year_str = match.group(4)

            if end_year_str:
                end_year = int(end_year_str)
            else:
                end_year = current_year

            if 1970 <= start_year <= current_year and 1970 <= end_year <= current_year + 1:
                duration = max(0, (end_year - start_year) * 12 + 6)
                total_months += duration
        except (ValueError, IndexError):
            continue

    if total_months > 0:
        return round(total_months / 12, 1)

    # Fallback: year-only ranges
    for match in year_range_pattern.finditer(text):
        try:
            start_year = int(match.group(1))
            end_year_str = match.group(2)
            end_year = int(end_year_str) if end_year_str else current_year

            if 1990 <= start_year <= current_year and 1990 <= end_year <= current_year + 1:
                duration = max(0, end_year - start_year)
                if 0 < duration < 40:
                    total_months += duration * 12
        except (ValueError, IndexError):
            continue

    return round(total_months / 12, 1) if total_months > 0 else 0.0
