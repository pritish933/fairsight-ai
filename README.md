<div align="center">
  <img src="https://raw.githubusercontent.com/pritish933/fairsight-ai/main/frontend/public/corridor.jpg" alt="FairSight AI Banner" width="100%" style="border-radius: 12px; height: 250px; object-fit: cover;">
  
  <br />
  <br />

  <h1>🛡️ FairSight AI</h1>
  <h3>Enterprise-Grade AI Bias Auditing & Safety Firewall</h3>
  <p>Built for the <strong>Google Solution Challenge 2026</strong> | Track: <i>Unbiased AI Decision</i></p>

  <p align="center">
    <img src="https://img.shields.io/badge/Google-Gemini_2.0-blue?style=for-the-badge&logo=google" />
    <img src="https://img.shields.io/badge/FastAPI-Python-green?style=for-the-badge&logo=fastapi" />
    <img src="https://img.shields.io/badge/React-18-cyan?style=for-the-badge&logo=react" />
    <img src="https://img.shields.io/badge/License-MIT-purple?style=for-the-badge" />
  </p>
</div>

<hr />

## 🌟 Overview
Computer programs now make life-changing decisions about who gets a job, a bank loan, or medical care. If these ML programs learn from flawed historical data, they will repeat and scale discrimination.

**FairSight AI** is a complete, production-ready bias inspection suite and safety firewall. Unlike simple post-hoc analysis tools, FairSight not only mathematically detects demographic bias in datasets but actively intercepts discriminatory decisions in live production systems, guaranteeing compliance with modern AI legislation.

## 🚀 Key Innovation: The FairSight Ecosystem
We provide a 3-layer approach to AI Fairness:
1. **The Automated Auditor:** Upload your dataset. FairSight calculates complex mathematical limits (*Demographic Parity, Disparate Impact Ratio, Equalized Odds*) against your protected attributes (Race, Gender, Age).
2. **Gemini XAI Engine & Compliance:** Instead of leaving users with raw math, **Google Gemini 2.0 Flash** translates the bias metrics into plain-English Executive Insights, grades the model against the **EU AI Act & EEOC Title VII**, and generates synthetically debiased dataset copies using intelligent oversampling.
3. **Live Safety Firewall (API):** Developers can route their model's live predictions through our ultra-low latency `/firewall/evaluate` endpoint. If an automated decision negatively targets a flagged disadvantaged group, the Firewall intercepts and `BLOCKS` the decision, forcing human review.

---

## 🛠️ Tech Stack & Architecture
- **Backend:** Python, FastAPI, Pandas, Google GenAI SDK
- **Frontend:** React, Vite, Recharts, Framer Motion, GSAP-style UI
- **AI/LLM:** `gemini-2.0-flash` with in-memory RAG Legal Context

### 🧠 Advanced RAG Chatbot
FairSight Assistant is equipped with a static **Retrieval-Augmented Generation (RAG)** knowledge base containing strict definitions of the EU AI Act penalties, GDPR Article 22, and US Civil Rights laws. It answers targeted legal questions about your specific audit results with cited facts.

---

## 💻 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (3.9+)
- A [Google Gemini API Key](https://aistudio.google.com/)

### ⚙️ Installation

1. **Clone the repository:**
   \`\`\`bash
   git clone https://github.com/pritish933/fairsight-ai.git
   cd fairsight-ai
   \`\`\`

2. **Backend Setup:**
   \`\`\`bash
   cd backend
   python -m venv venv
   # Windows: venv\\Scripts\\activate | Mac/Linux: source venv/bin/activate
   pip install -r requirements.txt
   
   # Setup your API Key
   echo "GEMINI_API_KEY=your_google_api_key_here" > .env
   
   # Run the server
   python -m uvicorn main:app --reload
   \`\`\`
   *Server runs on http://localhost:8000*

3. **Frontend Setup:**
   \`\`\`bash
   cd ../frontend
   npm install
   npm run dev
   \`\`\`
   *App runs on http://localhost:5173*

---

## ⚡ Integration: The Safety Firewall API
Once your model is audited, secure it in production with 5 lines of code:

\`\`\`python
import requests

def safeguard_ml_decision(session_id, ml_score, user_attributes):
    response = requests.post("http://localhost:8000/firewall/evaluate", json={
        "session_id": session_id,
        "decision": ml_score, # e.g., 0 for Reject
        "protected_attributes": user_attributes # e.g., {"gender": "Female"}
    })
    
    if response.json().get("action") == "BLOCK":
        return "flag_for_human_review"
    return "process_approval"
\`\`\`

---
<p align="center">
  <i>"Measuring bias is only the first step. Preventing it is the solution."</i>
</p>
