"""
Script to populate the database with sample jobs.
"""
import json
import requests

API_URL = "http://localhost:8000/api"

def load_jobs():
    try:
        with open("data/sample_jobs.json", "r") as f:
            jobs = json.load(f)
            
        for job in jobs:
            res = requests.post(f"{API_URL}/job-roles", json=job)
            if res.status_code == 200:
                print(f"OK Created job: {job['title']}")
            else:
                print(f"FAILED to create {job['title']}: {res.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    load_jobs()
