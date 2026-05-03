# 🚀 Deployment Guide: Smart Resume Screening System

This guide walk you through deploying the Smart Resume Screening System using **Render** for the Backend (FastAPI) and **Streamlit Community Cloud** or **Render** for the Frontend.

---

## 🏗️ Phase 1: GitHub Preparation

1.  **Clean your project:**
    *   Delete everything inside the `uploads/` folder.
    *   Ensure `.gitignore` is present (I've already created this for you).
2.  **Push to GitHub:**
    *   Create a new private or public repository on GitHub.
    *   Run the following commands in your project root:
        ```bash
        git init
        git add .
        git commit -m "Initial commit: Ready for deployment"
        git branch -M main
        git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
        git push -u origin main
        ```

---

## 🧠 Phase 2: Deploy Backend (FastAPI) on Render

1.  Log in to [Render](https://render.com/).
2.  Click **New +** > **Web Service**.
3.  Connect your GitHub repository.
4.  Configure the service:
    *   **Name:** `resume-screening-api`
    *   **Environment:** `Python 3`
    *   **Build Command:** `pip install -r requirements.txt && python setup_nlp.py && python load_sample_jobs.py`
        *   *(Note: `load_sample_jobs.py` ensures your DB has data on every restart/deploy.)*
    *   **Start Command:** `uvicorn api.main:app --host 0.0.0.0 --port $PORT`
    *   **Plan:** Free (or your choice).
5.  Click **Create Web Service**.
6.  **Wait for the build to finish.** Copy the URL provided by Render (e.g., `https://resume-screening-api.onrender.com`).

---

## 💻 Phase 3: Deploy Frontend (Streamlit)

You have two great options here:

### Option A: Streamlit Community Cloud (Recommended - Free & Fast)
1.  Go to [Streamlit Cloud](https://share.streamlit.io/).
2.  Click **New app**.
3.  Select your Repository, Branch (`main`), and Main file path (`streamlit_app.py`).
4.  Click **Advanced settings...**
5.  In the **Secrets** section, add your Backend URL:
    ```toml
    API_URL = "https://resume-screening-api.onrender.com/api"
    ```
6.  Click **Deploy**.

---

### Option B: Render (Keep everything in one place)
1.  On Render, click **New +** > **Web Service**.
2.  Connect the same GitHub repository.
3.  Configure the service:
    *   **Name:** `resume-screening-dashboard`
    *   **Environment:** `Python 3`
    *   **Build Command:** `pip install -r requirements.txt`
    *   **Start Command:** `streamlit run streamlit_app.py --server.port $PORT --server.address 0.0.0.0`
4.  Go to the **Environment** tab and click **Add Environment Variable**:
    *   **Key:** `API_URL`
    *   **Value:** `https://resume-screening-api.onrender.com/api`
5.  Click **Deploy**.

---

## ⚠️ Important Considerations for Production

### 1. Database Persistence
Since you are using SQLite, data uploaded by users will be lost whenever the Render free tier service spins down or restarts. 
*   **Solution:** For a real-world app, you should use Render's **Managed PostgreSQL** database. You would just need to change the `DATABASE_URL` in `config.py` to point to the Postgres connection string.

### 2. Large File Sizes
The `spaCy` models and `nltk` data take up significant disk space (~500MB+). Render's free tier has limits, but this project should fit within them. If the build fails due to memory, you might need to upgrade to a "Starter" plan.

### 3. Monitoring
You can monitor the logs of both services on the Render dashboard to see incoming requests and any NLP processing errors.

---
*Happy Deploying! 🚀*
