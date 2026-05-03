"""
One-time setup: download spaCy model and NLTK data.
Run this after installing requirements:
    python setup_nlp.py
"""
import subprocess
import sys

import nltk


def main():
    print("=" * 60)
    print("  Smart Resume Screening System — NLP Setup")
    print("=" * 60)

    # ── spaCy model ─────────────────────────────────────────────
    print("\n[1/2] Downloading spaCy English model (en_core_web_sm)...")
    subprocess.check_call(
        [sys.executable, "-m", "spacy", "download", "en_core_web_sm"]
    )
    print("  => spaCy model downloaded.\n")

    # ── NLTK data ───────────────────────────────────────────────
    print("[2/2] Downloading NLTK data packages...")
    for pkg in ["punkt", "punkt_tab", "stopwords", "wordnet", "averaged_perceptron_tagger", "averaged_perceptron_tagger_eng"]:
        nltk.download(pkg, quiet=True)
    print("  => NLTK data downloaded.\n")

    print("=" * 60)
    print("  Setup complete! You can now run the application.")
    print("=" * 60)


if __name__ == "__main__":
    main()
