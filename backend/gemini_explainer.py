import json
import os
from typing import Dict, Any

from google import genai
from google.genai import types


class GeminiExplainer:
    """
    Wraps Google Gemini API (new google.genai SDK) to generate human-readable
    bias explanations, fix suggestions, and executive summaries.
    """

    def __init__(self, api_key: str):
        self.client = genai.Client(api_key=api_key)
        self.model = "gemini-2.0-flash"

    # ──────────────────────────────────────────────────────────────────────────
    def explain_bias(self, attr: str, metrics: Dict[str, Any]) -> str:
        """Explain the bias found in a specific protected attribute."""
        prompt = f"""You are a world-class AI fairness expert writing for a non-technical audience.

Bias analysis for attribute: '{attr}'
- Demographic Parity Gap: {metrics.get('demographic_parity_gap')} (threshold is 0.10 — lower is better)
- Disparate Impact Ratio: {metrics.get('disparate_impact_ratio')} (must be ≥ 0.80 to be legally compliant)
- Group Outcome Rates: {json.dumps(metrics.get('group_positive_rates', {}), indent=2)}
- Most Favoured Group: {metrics.get('most_favoured_group')}
- Least Favoured Group: {metrics.get('least_favoured_group')}
- Severity: {metrics.get('severity')}

Write exactly 3 short paragraphs:
1. What this bias means in plain English with real-world consequences.
2. The likely root cause of this bias in the data or model.
3. Who is being disadvantaged and by how much (use the numbers given).

Keep it factual, empathetic, and under 180 words total. No bullet points. No jargon."""

        return self._safe_generate(prompt)

    # ──────────────────────────────────────────────────────────────────────────
    def suggest_fixes(self, bias_results: Dict[str, Any]) -> str:
        """Suggest concrete, actionable fixes for detected bias."""
        attr_severities = {
            attr: data.get("severity")
            for attr, data in bias_results.get("attributes", {}).items()
        }
        prompt = f"""You are an AI fairness engineer. Here are the bias audit results:
- Overall Fairness Score: {bias_results.get('overall_score')}/100
- Risk Level: {bias_results.get('risk_level')}
- Affected Attributes and Severity: {json.dumps(attr_severities, indent=2)}

List exactly 5 actionable fixes, numbered 1–5. For each fix:
- Give it a short bold name (e.g., **Re-sampling with SMOTE**)
- One sentence explaining what to do
- One sentence explaining why it works for this specific situation

Focus on: data re-sampling, fairness constraints, threshold calibration, data collection audits, and post-processing corrections.
Max 250 words total. Be specific, not generic."""

        return self._safe_generate(prompt)

    # ──────────────────────────────────────────────────────────────────────────
    def generate_summary(self, bias_results: Dict[str, Any]) -> str:
        """Generate an executive summary of the full audit."""
        prompt = f"""You are an AI ethics auditor writing an executive summary for a C-level manager.

Audit Results:
- Overall Fairness Score: {bias_results.get('overall_score')}/100
- Risk Level: {bias_results.get('risk_level')}
- Attributes Analysed: {list(bias_results.get('attributes', {}).keys())}
- Per-attribute severity: {json.dumps({a: d.get('severity') for a, d in bias_results.get('attributes', {}).items()})}

Write a 4-sentence executive summary:
1. The overall fairness score and what it means.
2. The most critical bias found and its real-world impact.
3. The urgency of action needed.
4. The recommended next step.

Be direct, authoritative, and avoid jargon. Max 120 words."""

        return self._safe_generate(prompt)

    # ──────────────────────────────────────────────────────────────────────────
    def check_compliance(self, bias_results: Dict[str, Any]) -> str:
        """Grade the audit against EU AI Act and GDPR."""
        prompt = f"""You are a top-tier legal AI compliance auditor.
Analyze the following bias audit results against the EU AI Act (Title III High-Risk Systems) and EEOC guidelines.

Audit Results:
Overall Score: {bias_results.get('overall_score')}/100
Risk Level: {bias_results.get('risk_level')}
Attributes and Severities: {json.dumps({a: d.get('severity') for a, d in bias_results.get('attributes', {}).items()})}

Output exactly 3 sections using Markdown headers (###):
### Legal Risk Assessment
(Is this model at risk of violating the EU AI Act? Why?)
### Key Compliance Violations
(Bullet points of specific protected attributes failing legal thresholds)
### Remediation Mandate
(What must be done to achieve compliance before deployment?)

Keep it under 250 words total. Use a highly professional, legal, and authoritative tone. Be direct."""
        return self._safe_generate(prompt)

    # ──────────────────────────────────────────────────────────────────────────
    def chat_with_report(self, message: str, bias_results: Dict[str, Any]) -> str:
        """Answer a user's question using the audit context."""
        context_json = json.dumps({
            "overall_score": bias_results.get("overall_score"),
            "risk_level": bias_results.get("risk_level"),
            "attributes": bias_results.get("attributes", {})
        }, indent=2)

        prompt = f"""You are FairSight Assistant, a legal AI and ML fairness expert. 
You are equipped with an advanced RAG legal knowledge base. 

[RAG KNOWLEDGE BASE]:
- **EU AI Act:** Classifies AI used in employment, education, and credit scoring as "High-Risk". Violations map to fines up to €35M or 7% of global turnover.
- **US EEOC & Title VII:** Enforces the "4/5ths Rule" (Disparate Impact Ratio must be >= 0.80). Any ratio below 0.80 is legal evidence of discrimination.
- **GDPR Article 22:** Individuals have the right to human intervention and a "right to explanation" for automated decisions affecting them.

Use the RAG Knowledge Base and the Audit Context to answer the user's question. Cite the specific laws when relevant. Keep your answer brief, professional, and highly factual.

Audit Context:
{context_json}

User Question: {message}"""
        return self._safe_generate(prompt)

    # ──────────────────────────────────────────────────────────────────────────
    def _safe_generate(self, prompt: str) -> str:
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.7,
                    max_output_tokens=512,
                ),
            )
            return response.text.strip()
        except Exception as exc:
            err_str = str(exc)
            if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                return (
                    "⏳ **Gemini AI rate limit reached.** The free API tier allows a limited number of requests per minute. "
                    "Please wait 60 seconds and re-run the audit, or add a paid API key for unlimited access."
                )
            elif "API_KEY" in err_str or "authentication" in err_str.lower():
                return "🔑 **API key error.** Please check your `GEMINI_API_KEY` in the `.env` file."
            return f"⚠️ AI explanation temporarily unavailable. Error: {exc}"

