"""
Smart Resume Screening System - Streamlit Dashboard
Professional, modern UI interacting with the FastAPI backend.
"""
import streamlit as st
import requests
import pandas as pd
import plotly.express as px
from datetime import datetime
import os
API_URL = os.getenv("API_URL", "https://your-backend-url.onrender.com/api")

# ── Page Config & Custom CSS ──────────────────────────────────────────
st.set_page_config(
    page_title="Smart Resume Screening",
    page_icon="📄",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom CSS for glassmorphism, professional typography, and metric cards
def inject_custom_css():
    st.markdown("""
        <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        html, body, [class*="css"] {
            font-family: 'Inter', sans-serif;
        }
        
        .main {
            background-color: #f8fafc;
        }
        
        /* Dark Mode adjustments */
        @media (prefers-color-scheme: dark) {
            .main {
                background-color: #0f172a;
            }
        }
        
        .stButton>button {
            border-radius: 8px;
            font-weight: 500;
            transition: all 0.2s;
        }
        .stButton>button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        /* Custom Metric Cards */
        div[data-testid="metric-container"] {
            background-color: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 1rem;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        
        /* Tags & Badges */
        .skill-tag {
            display: inline-block;
            background: rgba(59, 130, 246, 0.15);
            color: #3b82f6;
            padding: 2px 8px;
            border-radius: 999px;
            font-size: 0.8rem;
            margin: 2px;
            border: 1px solid rgba(59, 130, 246, 0.3);
        }
        .rec-badge-strong { background: #10b981; color: white; padding: 4px 12px; border-radius: 12px; font-weight: 600; font-size: 0.85rem;}
        .rec-badge-good { background: #3b82f6; color: white; padding: 4px 12px; border-radius: 12px; font-weight: 600; font-size: 0.85rem;}
        .rec-badge-mod { background: #f59e0b; color: white; padding: 4px 12px; border-radius: 12px; font-weight: 600; font-size: 0.85rem;}
        .rec-badge-weak { background: #ef4444; color: white; padding: 4px 12px; border-radius: 12px; font-weight: 600; font-size: 0.85rem;}
        </style>
    """, unsafe_allow_html=True)

# ── Helper Functions ──────────────────────────────────────────────────
def fetch_api(endpoint: str):
    try:
        response = requests.get(f"{API_URL}/{endpoint}")
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        st.error(f"API Error: {e}")
        return None

def post_api(endpoint: str, json_data=None):
    try:
        response = requests.post(f"{API_URL}/{endpoint}", json=json_data)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        st.error(f"API Error: {e}")
        return None

def delete_api(endpoint: str):
    try:
        response = requests.delete(f"{API_URL}/{endpoint}")
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        st.error(f"API Error: {e}")
        return None

def get_badge_html(rec: str) -> str:
    if rec == "Strong Fit": return f"<span class='rec-badge-strong'>{rec}</span>"
    if rec == "Good Fit": return f"<span class='rec-badge-good'>{rec}</span>"
    if rec == "Moderate Fit": return f"<span class='rec-badge-mod'>{rec}</span>"
    return f"<span class='rec-badge-weak'>{rec or 'Unknown'}</span>"

def render_skills(skills_list):
    if not skills_list:
        return "None"
    tags = "".join([f"<span class='skill-tag'>{s}</span>" for s in skills_list[:15]])
    if len(skills_list) > 15:
        tags += f" <span style='font-size:0.8rem; color: gray;'>+{len(skills_list)-15} more</span>"
    return tags

# ── Pages ─────────────────────────────────────────────────────────────
def page_dashboard():
    st.title("📊 System Dashboard")
    st.markdown("Overview of Resume Screening metrics.")
    
    data = fetch_api("dashboard/stats")
    if not data:
        st.warning("Cannot connect to backend. Is FastAPI running on port 8000?")
        return

    # Metrics
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Total Candidates", data["total_candidates"])
    c2.metric("Active Job Roles", data["total_jobs"])
    c3.metric("Screenings Run", data["total_screenings"])
    c4.metric("Average Score", f"{data['avg_score']}%")

    st.markdown("---")

    col1, col2 = st.columns([1, 1])
    
    with col1:
        st.subheader("Recommendation Breakdown")
        recs = data.get("recommendation_breakdown", {})
        if recs:
            df_recs = pd.DataFrame(list(recs.items()), columns=["Recommendation", "Count"])
            fig = px.pie(df_recs, values="Count", names="Recommendation", hole=0.4,
                         color="Recommendation",
                         color_discrete_map={
                             "Strong Fit": "#10b981", 
                             "Good Fit": "#3b82f6", 
                             "Moderate Fit": "#f59e0b", 
                             "Weak Fit": "#ef4444"
                         })
            fig.update_layout(margin=dict(t=0, b=0, l=0, r=0))
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("No screening results yet.")

    with col2:
        st.subheader("Recent Activity")
        st.write("Recent uploaded candidates:")
        cands_data = fetch_api("candidates")
        if cands_data and cands_data.get("candidates"):
            df_cands = pd.DataFrame(cands_data["candidates"][:5])
            st.dataframe(
                df_cands[["name", "experience_years", "education_level"]], 
                use_container_width=True,
                hide_index=True
            )
        else:
            st.info("No candidates uploaded yet.")


def page_upload():
    st.title("📤 Upload Resumes")
    st.markdown("Upload candidate resumes in **PDF** or **DOCX** format. NLP extraction runs automatically.")

    uploaded_files = st.file_uploader("Select files", type=["pdf", "docx"], accept_multiple_files=True)
    
    if st.button("Processing Uploads", type="primary") and uploaded_files:
        progress_bar = st.progress(0)
        status_text = st.empty()
        
        success_count = 0
        for i, file in enumerate(uploaded_files):
            status_text.text(f"Processing: {file.name}")
            
            # Use requests directly for multipart file upload
            files = {"file": (file.name, file.getvalue(), file.type)}
            try:
                res = requests.post(f"{API_URL}/upload-resume", files=files)
                res.raise_for_status()
                success_count += 1
            except Exception as e:
                st.error(f"Failed to process {file.name}: {e}")
                
            progress_bar.progress((i + 1) / len(uploaded_files))
            
        status_text.text("Upload complete!")
        st.success(f"Successfully processed {success_count} / {len(uploaded_files)} resumes.")


def page_candidates():
    st.title("👥 Candidates")
    
    data = fetch_api("candidates")
    if not data or not data.get("candidates"):
        st.info("No candidates found in the database.")
        if st.button("Go to Upload Page"):
            st.query_params["page"] = "Upload"
        return

    cands = data["candidates"]
    
    # Search
    search = st.text_input("🔍 Search candidates by name or skill...").lower()
    
    filtered_cands = []
    for c in cands:
        if search in c["name"].lower() or any(search in s.lower() for s in c["skills"]):
            filtered_cands.append(c)
            
    st.caption(f"Showing {len(filtered_cands)} matching candidates.")
    
    for c in filtered_cands:
        with st.expander(f"👤 {c['name']} — {c['experience_years']} yrs exp, {c['education_level'] or 'Unknown Edu'}"):
            col1, col2 = st.columns([3, 1])
            with col1:
                st.markdown(f"**Email:** {c['email'] or 'N/A'} | **Phone:** {c['phone'] or 'N/A'}")
                st.markdown("**Core Skills:**")
                st.markdown(render_skills(c["skills"]), unsafe_allow_html=True)
            with col2:
                if st.button("🗑️ Delete", key=f"del_c_{c['id']}"):
                    delete_api(f"candidates/{c['id']}")
                    st.rerun()


def page_job_roles():
    st.title("💼 Job Roles")
    
    tab_list, tab_create = st.tabs(["Active Roles", "Create New Role"])
    
    with tab_create:
        st.subheader("Create a New Job Role")
        with st.form("new_job_form"):
            title = st.text_input("Job Title *", placeholder="e.g. Senior Software Engineer")
            dept = st.text_input("Department", placeholder="Engineering")
            desc = st.text_area("Job Description *", height=150)
            
            c1, c2 = st.columns(2)
            with c1:
                req_skills = st.text_input("Required Skills (comma separated) *", placeholder="Python, FastAPI, SQL")
                min_exp = st.number_input("Minimum Experience (Years)", min_value=0.0, step=0.5)
            with c2:
                pref_skills = st.text_input("Preferred Skills (comma separated)", placeholder="Docker, AWS")
                min_edu = st.selectbox("Minimum Education", ["High School / GED", "Diploma / Certificate", "Associate's Degree", "Bachelor's Degree", "Master's Degree", "PhD / Doctorate"])
                
            submitted = st.form_submit_button("Save Job Role", type="primary")
            
            if submitted:
                if not title or not desc:
                    st.error("Title and Description are required.")
                else:
                    payload = {
                        "title": title,
                        "department": dept,
                        "description": desc,
                        "required_skills": [s.strip() for s in req_skills.split(",") if s.strip()],
                        "preferred_skills": [s.strip() for s in pref_skills.split(",") if s.strip()],
                        "min_experience": min_exp,
                        "min_education": min_edu
                    }
                    res = post_api("job-roles", payload)
                    if res:
                        st.success("Job role created!")
                        st.rerun()

    with tab_list:
        data = fetch_api("job-roles")
        jobs = data.get("job_roles", []) if data else []
        
        if not jobs:
            st.info("No active job roles.")
        else:
            for job in jobs:
                with st.expander(f"💼 {job['title']} ({job['department'] or 'General'})"):
                    col1, col2 = st.columns([3, 1])
                    with col1:
                        st.markdown(f"**Min Exp:** {job['min_experience']} yrs | **Edu:** {job['min_education']}")
                        st.markdown("**Required Skills:**")
                        st.markdown(render_skills(job["required_skills"]), unsafe_allow_html=True)
                    with col2:
                        if st.button("🗑️ Delete", key=f"del_j_{job['id']}"):
                            delete_api(f"job-roles/{job['id']}")
                            st.rerun()


def page_screening():
    st.title("🎯 Screen & Match")
    st.markdown("Run the NLP scoring engine against a job role.")
    
    jobs_data = fetch_api("job-roles")
    jobs = jobs_data.get("job_roles", []) if jobs_data else []
    
    if not jobs:
        st.warning("Please create a job role first.")
        return
        
    job_opts = {f"{j['title']} (ID: {j['id']})": j['id'] for j in jobs}
    selected_job_str = st.selectbox("Select target Job Role:", list(job_opts.keys()))
    job_id = job_opts[selected_job_str]
    
    col1, col2 = st.columns([1, 4])
    with col1:
        if st.button("🚀 Screen All Candidates", type="primary"):
            with st.spinner("Running matching engine..."):
                res = post_api(f"screen-bulk/{job_id}")
                if res:
                    st.success(f"Screened {res.get('count', 0)} candidates.")
                    
    with col2:
        st.markdown(f"*This analyzes all uploaded resumes against the required skills, experience, and keywords using TF-IDF and weighted scoring.*")
                    
    st.markdown("---")
    
    # Show Results
    results_data = fetch_api(f"results/job/{job_id}")
    results = results_data.get("results", []) if results_data else []
    
    if not results:
        st.info("No screening results yet for this role.")
        return
        
    st.subheader(f"Ranked Candidates for {selected_job_str.split(' (')[0]}")
    
    for r in results:
        card_html = f"""
        <div style="padding: 1rem; border: 1px solid rgba(200,200,200,0.3); border-radius: 8px; margin-bottom: 0.5rem; background: rgba(255,255,255,0.02)">
            <h4 style="margin: 0; display: flex; justify-content: space-between; align-items: center;">
                <span>👤 {r['candidate_name']}</span>
                <span>Overall: <b>{r['overall_score']}%</b> &nbsp; {get_badge_html(r['recommendation'])}</span>
            </h4>
        </div>
        """
        st.markdown(card_html, unsafe_allow_html=True)
        with st.expander("Score Details & Missing Skills"):
            c1, c2, c3, c4 = st.columns(4)
            c1.metric("Skill Match", f"{r['skill_score']}%")
            c2.metric("Experience", f"{r['experience_score']}%")
            c3.metric("Education", f"{r['education_score']}%")
            c4.metric("Keyword Rel.", f"{r['keyword_score']}%")
            
            if r['missing_skills']:
                st.warning(f"**Missing Required Skills:** {', '.join(r['missing_skills'])}")
            if r['matched_skills']:
                st.success(f"**Matched Skills:** {', '.join(r['matched_skills'])}")


# ── App Router ────────────────────────────────────────────────────────
def main():
    inject_custom_css()
    
    st.sidebar.title("Smart Screen HR")
    st.sidebar.markdown("---")
    
    pages = {
        "Dashboard": page_dashboard,
        "Job Roles": page_job_roles,
        "Upload Resumes": page_upload,
        "Candidates": page_candidates,
        "Screen & Match": page_screening,
    }
    
    selection = st.sidebar.radio("Navigation", list(pages.keys()))
    
    st.sidebar.markdown("---")
    st.sidebar.caption("v1.0.0 | AI-Powered Platform")
    
    # Run selected page
    pages[selection]()

if __name__ == "__main__":
    main()
