"""
Skill Extractor — matches resume text against a curated skills taxonomy.
Uses spaCy tokenization + lemmatisation + n-gram matching.
"""
import re
from typing import Dict, List, Set

import spacy
from config import SPACY_MODEL

_nlp = None

def _get_nlp():
    global _nlp
    if _nlp is None:
        _nlp = spacy.load(SPACY_MODEL)
    return _nlp


# ════════════════════════════════════════════════════════════════════════
# CURATED SKILLS TAXONOMY  (~300 skills)
# ════════════════════════════════════════════════════════════════════════

TECHNICAL_SKILLS = {
    # Programming Languages
    "python", "java", "javascript", "typescript", "c++", "c#", "ruby", "go",
    "golang", "rust", "swift", "kotlin", "scala", "php", "perl", "r",
    "matlab", "lua", "dart", "elixir", "haskell", "clojure", "objective-c",
    # Web Frontend
    "html", "css", "react", "reactjs", "react.js", "angular", "angularjs",
    "vue", "vuejs", "vue.js", "svelte", "next.js", "nextjs", "nuxt.js",
    "gatsby", "tailwind", "tailwindcss", "bootstrap", "sass", "less",
    "webpack", "vite", "jquery",
    # Web Backend
    "node.js", "nodejs", "express", "express.js", "django", "flask",
    "fastapi", "spring", "spring boot", "springboot", "asp.net", "rails",
    "ruby on rails", "laravel", "gin", "fiber", "nestjs", "graphql",
    # Databases
    "sql", "mysql", "postgresql", "postgres", "mongodb", "redis",
    "elasticsearch", "cassandra", "dynamodb", "sqlite", "oracle",
    "mariadb", "couchdb", "neo4j", "firebase", "supabase",
    # Cloud & DevOps
    "aws", "azure", "gcp", "google cloud", "docker", "kubernetes", "k8s",
    "terraform", "ansible", "jenkins", "ci/cd", "github actions",
    "gitlab ci", "circleci", "nginx", "apache", "linux", "unix", "bash",
    "powershell", "helm", "vagrant",
    # Data & ML
    "machine learning", "deep learning", "neural networks",
    "natural language processing", "nlp", "computer vision",
    "tensorflow", "pytorch", "keras", "scikit-learn", "sklearn",
    "pandas", "numpy", "scipy", "matplotlib", "seaborn", "plotly",
    "spark", "pyspark", "hadoop", "hive", "airflow", "kafka",
    "data engineering", "data science", "data analysis", "data visualization",
    "statistics", "regression", "classification", "clustering",
    "random forest", "xgboost", "lightgbm", "transformers", "bert",
    "gpt", "llm", "large language models", "rag",
    "retrieval augmented generation", "langchain", "huggingface",
    # Mobile
    "android", "ios", "react native", "flutter", "xamarin",
    "swiftui", "jetpack compose",
    # Testing
    "unit testing", "integration testing", "selenium", "cypress",
    "jest", "pytest", "junit", "mocha", "playwright",
    # APIs & Protocols
    "rest", "restful", "rest api", "soap", "grpc", "websocket",
    "mqtt", "oauth", "jwt",
    # Version Control
    "git", "github", "gitlab", "bitbucket", "svn",
    # Other Technical
    "microservices", "serverless", "event driven",
    "design patterns", "system design", "api design",
    "data structures", "algorithms", "oop",
    "object oriented programming", "functional programming",
    "agile", "scrum", "kanban", "jira", "confluence",
    "blockchain", "smart contracts", "solidity",
    "cybersecurity", "penetration testing", "encryption",
    "networking", "tcp/ip", "dns", "load balancing",
}

TOOLS_AND_PLATFORMS = {
    "tableau", "power bi", "powerbi", "looker", "grafana",
    "excel", "google sheets", "microsoft office", "ms office",
    "figma", "sketch", "adobe xd", "invision", "zeplin",
    "photoshop", "illustrator", "after effects", "premiere pro",
    "blender", "unity", "unreal engine",
    "slack", "trello", "asana", "notion", "monday.com",
    "salesforce", "hubspot", "zendesk",
    "postman", "swagger", "insomnia",
    "datadog", "splunk", "new relic", "prometheus",
    "snowflake", "databricks", "bigquery", "redshift",
    "sap", "erp", "crm",
    "visual studio code", "vs code", "intellij", "pycharm",
    "eclipse", "vim", "emacs",
    "chatgpt", "copilot", "gemini",
}

SOFT_SKILLS = {
    "leadership", "communication", "teamwork", "collaboration",
    "problem solving", "problem-solving", "critical thinking",
    "analytical thinking", "analytical skills", "time management",
    "project management", "stakeholder management",
    "presentation skills", "public speaking", "negotiation",
    "decision making", "decision-making", "strategic thinking",
    "mentoring", "coaching", "conflict resolution",
    "adaptability", "flexibility", "creativity", "innovation",
    "attention to detail", "organization", "multitasking",
    "customer service", "client management", "relationship building",
    "cross-functional collaboration", "team building",
    "emotional intelligence", "self-motivated", "proactive",
    "results oriented", "results-oriented", "goal oriented",
}

BUSINESS_SKILLS = {
    "business analysis", "business intelligence", "bi",
    "product management", "product strategy", "product development",
    "market research", "competitive analysis", "swot analysis",
    "financial analysis", "financial modeling", "budgeting",
    "forecasting", "risk management", "compliance",
    "supply chain management", "inventory management",
    "operations management", "process improvement",
    "lean", "six sigma", "change management",
    "digital marketing", "seo", "sem", "content marketing",
    "social media marketing", "email marketing", "analytics",
    "a/b testing", "user research", "ux research",
    "ux design", "ui design", "user experience",
    "user interface", "wireframing", "prototyping",
    "requirements gathering", "documentation",
}


def _build_skill_lookup() -> Dict[str, tuple]:
    """
    Build a lowercase lookup: skill_text → (category, canonical_name).
    """
    lookup = {}
    for skill in TECHNICAL_SKILLS:
        lookup[skill.lower()] = ("technical", skill)
    for skill in TOOLS_AND_PLATFORMS:
        lookup[skill.lower()] = ("tools", skill)
    for skill in SOFT_SKILLS:
        lookup[skill.lower()] = ("soft_skills", skill)
    for skill in BUSINESS_SKILLS:
        lookup[skill.lower()] = ("business", skill)
    return lookup


SKILL_LOOKUP = _build_skill_lookup()

# Pre-compute max n-gram size needed
MAX_NGRAM = max(len(s.split()) for s in SKILL_LOOKUP)


def extract_skills(text: str) -> Dict[str, List[str]]:
    """
    Extract skills from resume text using tokenization + n-gram matching.

    Returns:
        {
            "technical": ["python", "django", ...],
            "tools": ["tableau", ...],
            "soft_skills": ["leadership", ...],
            "business": ["product management", ...],
            "all": ["python", "django", "tableau", "leadership", ...]
        }
    """
    nlp = _get_nlp()
    text_lower = text.lower()

    # Clean text for matching
    text_clean = re.sub(r"[•●■▪▸►→–—\|]", " ", text_lower)
    text_clean = re.sub(r"\s+", " ", text_clean).strip()

    found: Dict[str, Set[str]] = {
        "technical": set(),
        "tools": set(),
        "soft_skills": set(),
        "business": set(),
    }

    # Strategy 1: Direct substring matching for multi-word skills
    for skill_text, (category, canonical) in SKILL_LOOKUP.items():
        if len(skill_text.split()) > 1:
            # Multi-word: check as substring
            if skill_text in text_clean:
                found[category].add(canonical)

    # Strategy 2: Token-level matching for single-word skills
    doc = nlp(text_clean)
    tokens = {token.text.lower() for token in doc if not token.is_punct}
    lemmas = {token.lemma_.lower() for token in doc if not token.is_punct}
    all_forms = tokens | lemmas

    for skill_text, (category, canonical) in SKILL_LOOKUP.items():
        if len(skill_text.split()) == 1:
            if skill_text in all_forms:
                found[category].add(canonical)

    # Convert sets to sorted lists
    result = {cat: sorted(skills) for cat, skills in found.items()}
    result["all"] = sorted(
        found["technical"] | found["tools"] | found["soft_skills"] | found["business"]
    )
    return result
