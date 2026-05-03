# Smart Resume Screening System 🚀

An AI-driven recruitment tool designed to automate the initial screening process. This system parses resumes (PDF/DOCX), extracts key information using NLP, and ranks candidates against job requirements using a weighted scoring engine.

![Dashboard Preview](https://img.shields.io/badge/Tech-FastAPI%20%7C%20Streamlit%20%7C%20spaCy-blue)

## 🌟 Key Features

- **Automated Parsing:** Extracts contact info, skills, experience, and education from PDF and DOCX files.
- **Smart Name Detection:** Dual-layer extraction using structural heuristics and spaCy NER for robust real-world name identification.
- **Weighted Scoring Engine:** Matches candidates based on:
  - **Skills (40%)**: Taxonomy-aware keyword and n-gram matching.
  - **Experience (30%)**: Semantic parsing of work history and years.
  - **Education (15%)**: Hierarchy-based qualification matching.
  - **Relevance (15%)**: TF-IDF cosine similarity between resume and job description.
- **Interactive Dashboard:** Professional Streamlit UI with KPI metrics and Plotly visualizations.
- **HR Workflow:** Manage Job Roles, upload bulk resumes, and view ranked candidate recommendations.

## 🛠️ Tech Stack

- **Backend:** [FastAPI](https://fastapi.tiangolo.com/) (High-performance Python API)
- **Frontend:** [Streamlit](https://streamlit.io/) (Data Dashboard)
- **Database:** SQLite with [SQLAlchemy](https://www.sqlalchemy.org/) ORM
- **NLP Engine:** [spaCy](https://spacy.io/), [NLTK](https://www.nltk.org/), [scikit-learn](https://scikit-learn.org/)
- **Document Processing:** `pdfplumber`, `python-docx`

## 🚀 Getting Started

### 1. Prerequisite: Python 3.9+
Ensure you have Python installed. We recommend using a virtual environment.

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/your-username/SmartResumeScreeningSystem.git
cd SmartResumeScreeningSystem

# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt
```

### 3. Setup NLP Models
Run the setup script to download required spaCy models and NLTK data:
```bash
python setup_nlp.py
```

### 4. Initialize Sample Data
Populate the database with industry-standard job roles:
```bash
python load_sample_jobs.py
```

## 🏁 Running the Application

You need to run two services simultaneously:

### Step 1: Start Backend (FastAPI)
```bash
uvicorn api.main:app --reload
```
*API will be available at: http://localhost:8000*

### Step 2: Start Frontend (Streamlit)
Open a new terminal, activate venv, and run:
```bash
streamlit run streamlit_app.py
```
*UI will be available at: http://localhost:8501*

## 📂 Project Structure

```text
├── api/                # FastAPI routes and main entry point
├── nlp_engine/         # Core NLP logic (parser, skills, experience)
├── scoring/            # Matching and ranking algorithms
├── uploads/            # Temporary storage for uploaded resumes
├── config.py           # Centralized configuration & weights
├── models.py           # SQLAlchemy database models
├── streamlit_app.py    # Multi-page Streamlit dashboard
└── setup_nlp.py        # Dependency setup script
```

## 📝 License
Distributed under the MIT License. See `LICENSE` for more information.

---
*Built with ❤️ for modern HR teams.*
