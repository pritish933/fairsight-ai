import io
import os
import uuid
from typing import Dict, List

import pandas as pd
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from bias_detector import BiasDetector
from gemini_explainer import GeminiExplainer

load_dotenv()

# ─────────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="FairSight AI — Bias Audit API",
    version="1.0.0",
    description="Detect, explain, and fix AI bias using Gemini.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
gemini = GeminiExplainer(GEMINI_API_KEY)

# In-memory session store  {session_id: DataFrame}
_sessions: Dict[str, pd.DataFrame] = {}
# Cache bias results for the Live Firewall
_bias_cache: Dict[str, dict] = {}

SAMPLE_DIR = os.path.join(os.path.dirname(__file__), "sample_datasets")

# ─────────────────────────────────────────────────────────────────────────────
# Request / Response models
# ─────────────────────────────────────────────────────────────────────────────
class AnalyzeRequest(BaseModel):
    session_id: str
    target_column: str
    protected_attributes: List[str]


class ChatRequest(BaseModel):
    message: str
    bias_results: dict


class DebiasRequest(BaseModel):
    session_id: str
    target_column: str
    protected_attributes: List[str]


class FirewallRequest(BaseModel):
    session_id: str
    decision: int
    protected_attributes: Dict[str, str]


# ─────────────────────────────────────────────────────────────────────────────
# Utility
# ─────────────────────────────────────────────────────────────────────────────
def _store_df(df: pd.DataFrame) -> str:
    sid = str(uuid.uuid4())[:8]
    _sessions[sid] = df
    return sid


def _df_info(df: pd.DataFrame, filename: str = "", sid: str = "") -> dict:
    return {
        "session_id": sid,
        "filename": filename,
        "rows": len(df),
        "columns": list(df.columns),
        "preview": df.head(5).fillna("").to_dict(orient="records"),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"message": "FairSight AI API is running ✅", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/upload")
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")
    content = await file.read()
    try:
        df = pd.read_csv(io.StringIO(content.decode("utf-8")))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not parse CSV: {exc}")

    sid = _store_df(df)
    return _df_info(df, file.filename, sid)


@app.get("/sample-datasets")
def list_samples():
    datasets = []
    if not os.path.exists(SAMPLE_DIR):
        return datasets
    for fname in os.listdir(SAMPLE_DIR):
        if fname.endswith(".csv"):
            df = pd.read_csv(os.path.join(SAMPLE_DIR, fname))
            datasets.append(
                {
                    "name": fname.replace("_", " ").replace(".csv", "").title(),
                    "filename": fname,
                    "rows": len(df),
                    "columns": list(df.columns),
                }
            )
    return datasets


@app.post("/load-sample/{filename}")
def load_sample(filename: str):
    path = os.path.join(SAMPLE_DIR, filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Sample dataset not found.")
    df = pd.read_csv(path)
    sid = _store_df(df)
    return _df_info(df, filename, sid)


@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    if req.session_id not in _sessions:
        raise HTTPException(
            status_code=404,
            detail="Session not found. Please upload a file first.",
        )

    df = _sessions[req.session_id]

    if req.target_column not in df.columns:
        raise HTTPException(
            status_code=400,
            detail=f"Target column '{req.target_column}' not found in dataset.",
        )

    valid_attrs = [a for a in req.protected_attributes if a in df.columns]
    if not valid_attrs:
        raise HTTPException(
            status_code=400,
            detail="None of the selected protected attributes exist in the dataset.",
        )

    # ── Bias detection ────────────────────────────────────────────────────────
    detector = BiasDetector(df, req.target_column, valid_attrs)
    results = detector.detect_all()

    # ── Gemini explanations per attribute ─────────────────────────────────────
    for attr, data in results["attributes"].items():
        data["gemini_explanation"] = gemini.explain_bias(attr, data)

    # ── Overall Gemini insights & Compliance ──────────────────────────────────
    results["gemini_fixes"] = gemini.suggest_fixes(results)
    results["gemini_summary"] = gemini.generate_summary(results)
    results["gemini_compliance"] = gemini.check_compliance(results)
    
    # Store request context for debias and firewall
    results["session_id"] = req.session_id
    results["target_column"] = req.target_column
    results["protected_attributes"] = req.protected_attributes
    
    _bias_cache[req.session_id] = results

    return results


@app.post("/chat")
def chat(req: ChatRequest):
    try:
        reply = gemini.chat_with_report(req.message, req.bias_results)
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/debias")
def debias(req: DebiasRequest):
    if req.session_id not in _sessions:
        raise HTTPException(
            status_code=404,
            detail="Session not found. Please upload a file first.",
        )

    df = _sessions[req.session_id].copy()

    # Simple naive oversampling using pandas
    # Find the target column and oversample the minority class
    target = req.target_column
    if target not in df.columns:
        raise HTTPException(status_code=400, detail=f"Target column '{target}' not found.")

    class_counts = df[target].value_counts()
    if len(class_counts) < 2:
        # Cannot debias a single class
        csv_data = df.to_csv(index=False)
        return {"csv": csv_data, "message": "Dataset heavily imbalanced or single class. No resampling applied."}

    max_count = class_counts.max()
    resampled_dfs = []

    for class_val, count in class_counts.items():
        class_df = df[df[target] == class_val]
        if count < max_count:
            # Oversample minority class
            sampled = class_df.sample(max_count, replace=True, random_state=42)
            resampled_dfs.append(sampled)
        else:
            resampled_dfs.append(class_df)

    debiased_df = pd.concat(resampled_dfs).sample(frac=1, random_state=42).reset_index(drop=True)
    
    # Store debiased back or just return it as CSV string
    csv_data = debiased_df.to_csv(index=False)
    return {"csv": csv_data, "message": "Debiased dataset generated successfully."}


@app.delete("/session/{session_id}")
def clear_session(session_id: str):
    _sessions.pop(session_id, None)
    _bias_cache.pop(session_id, None)
    return {"message": "Session cleared."}


# ─────────────────────────────────────────────────────────────────────────────
# LIVE FIREWALL ENDPOINT
# ─────────────────────────────────────────────────────────────────────────────
@app.post("/firewall/evaluate")
def firewall_evaluate(req: FirewallRequest):
    if req.session_id not in _bias_cache:
        raise HTTPException(status_code=404, detail="Audit results not found for this session. Run an audit first.")
    
    results = _bias_cache[req.session_id]
    
    # If decision is positive (1), assume no immediate adverse harm
    if req.decision == 1:
        return {"action": "ALLOW", "reason": "Positive outcome, no adverse impact."}
        
    risk_level = results.get("risk_level", "LOW")
    if risk_level == "LOW":
        return {"action": "ALLOW", "reason": "Model is graded as Low Risk."}
        
    # Check if a negative decision targets a historically disadvantaged group
    for attr, value in req.protected_attributes.items():
        attr_data = results.get("attributes", {}).get(attr)
        if attr_data:
            if str(value).lower() == str(attr_data.get("least_favoured_group")).lower():
                severity = attr_data.get("severity")
                if severity in ["HIGH", "CRITICAL"]:
                    return {
                        "action": "BLOCK", 
                        "reason": f"Interceptor: High risk of bias. Model systematically disadvantages '{value}' under '{attr}' metrics."
                    }
    
    return {"action": "ALLOW", "reason": "No critical bias rules triggered for these attributes."}
