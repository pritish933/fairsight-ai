"""
Generate realistic sample datasets with intentional bias for demo purposes.
Run once: python generate_samples.py
"""

import os
import numpy as np
import pandas as pd

np.random.seed(42)
OUT_DIR = os.path.join(os.path.dirname(__file__), "sample_datasets")
os.makedirs(OUT_DIR, exist_ok=True)

# ─────────────────────────────────────────────────────────────────────────────
# 1. HIRING DATA  (gender + age bias)
# ─────────────────────────────────────────────────────────────────────────────
N = 300
genders     = np.random.choice(["Male", "Female"], N, p=[0.58, 0.42])
age_groups  = np.random.choice(["22-30", "31-40", "41-50", "51+"], N, p=[0.33, 0.35, 0.22, 0.10])
education   = np.random.choice(["High School", "Bachelor", "Master", "PhD"], N, p=[0.12, 0.48, 0.30, 0.10])
experience  = np.clip(np.random.normal(7, 4, N).astype(int), 0, 25)
skills      = np.clip(np.random.normal(65, 15, N).astype(int), 30, 100)

hire_prob = np.zeros(N)
for i in range(N):
    p = 0.35
    if genders[i] == "Male":      p += 0.22   # gender bias
    if age_groups[i] == "22-30":  p += 0.12   # age bias (favour young)
    if age_groups[i] == "31-40":  p += 0.08
    if age_groups[i] == "51+":    p -= 0.10   # penalise older
    if education[i] in ("Master", "PhD"): p += 0.10
    if skills[i] > 75:            p += 0.08
    hire_prob[i] = np.clip(p, 0.05, 0.95)

hired = np.random.binomial(1, hire_prob)

hiring_df = pd.DataFrame({
    "applicant_id":   range(1, N + 1),
    "gender":         genders,
    "age_group":      age_groups,
    "education_level": education,
    "years_experience": experience,
    "skills_score":   skills,
    "hired":          hired,
})
hiring_df.to_csv(os.path.join(OUT_DIR, "hiring_data.csv"), index=False)
print(f"[OK] hiring_data.csv  — rows: {len(hiring_df)}")
print(f"    Hire rate Male  : {hiring_df[hiring_df.gender=='Male']['hired'].mean():.2%}")
print(f"    Hire rate Female: {hiring_df[hiring_df.gender=='Female']['hired'].mean():.2%}")

# ─────────────────────────────────────────────────────────────────────────────
# 2. LOAN APPROVAL DATA  (race + gender bias)
# ─────────────────────────────────────────────────────────────────────────────
N2 = 400
genders2  = np.random.choice(["Male", "Female"], N2, p=[0.55, 0.45])
races     = np.random.choice(["White", "Black", "Hispanic", "Asian"], N2, p=[0.45, 0.22, 0.20, 0.13])
age_grp2  = np.random.choice(["18-30", "31-45", "46-60", "60+"], N2, p=[0.28, 0.38, 0.24, 0.10])
income    = np.clip(np.random.normal(55000, 25000, N2).astype(int), 15000, 250000)
credit    = np.clip(np.random.normal(660, 90, N2).astype(int), 400, 850)
loan_amt  = np.clip(np.random.normal(120000, 80000, N2).astype(int), 5000, 600000)

approve_prob = np.zeros(N2)
for i in range(N2):
    p = 0.40
    if genders2[i] == "Male":     p += 0.12   # gender bias
    if races[i] == "White":       p += 0.18   # race bias
    if races[i] == "Asian":       p += 0.08
    if races[i] == "Black":       p -= 0.08
    if races[i] == "Hispanic":    p -= 0.05
    if credit[i] > 700:           p += 0.15
    if income[i] > 70000:         p += 0.10
    if age_grp2[i] == "60+":     p -= 0.08
    approve_prob[i] = np.clip(p, 0.05, 0.95)

approved = np.random.binomial(1, approve_prob)

loan_df = pd.DataFrame({
    "applicant_id":         range(1, N2 + 1),
    "gender":               genders2,
    "race":                 races,
    "age_group":            age_grp2,
    "annual_income":        income,
    "credit_score":         credit,
    "loan_amount_requested": loan_amt,
    "approved":             approved,
})
loan_df.to_csv(os.path.join(OUT_DIR, "loan_approval.csv"), index=False)
print(f"\n[OK] loan_approval.csv  - rows: {len(loan_df)}")
print(f"    Approval White  : {loan_df[loan_df.race=='White']['approved'].mean():.2%}")
print(f"    Approval Black  : {loan_df[loan_df.race=='Black']['approved'].mean():.2%}")

# ─────────────────────────────────────────────────────────────────────────────
# 3. MEDICAL TRIAL DATA  (gender + ethnicity bias)
# ─────────────────────────────────────────────────────────────────────────────
N3 = 250
genders3   = np.random.choice(["Male", "Female"], N3, p=[0.65, 0.35])
ethnicity  = np.random.choice(["Caucasian", "African American", "Latino", "Asian"], N3, p=[0.50, 0.22, 0.18, 0.10])
severity   = np.random.choice(["Mild", "Moderate", "Severe"], N3, p=[0.40, 0.40, 0.20])
age_grp3   = np.random.choice(["18-40", "41-60", "61+"], N3, p=[0.35, 0.40, 0.25])

success_prob = np.zeros(N3)
for i in range(N3):
    p = 0.50
    if genders3[i] == "Male":              p += 0.15   # gender bias in treatment
    if ethnicity[i] == "Caucasian":        p += 0.12
    if ethnicity[i] == "African American": p -= 0.08
    if severity[i] == "Mild":              p += 0.10
    if severity[i] == "Severe":            p -= 0.15
    if age_grp3[i] == "61+":              p -= 0.10
    success_prob[i] = np.clip(p, 0.05, 0.95)

outcome = np.random.binomial(1, success_prob)

medical_df = pd.DataFrame({
    "patient_id":        range(1, N3 + 1),
    "gender":            genders3,
    "ethnicity":         ethnicity,
    "age_group":         age_grp3,
    "condition_severity": severity,
    "treatment_success": outcome,
})
medical_df.to_csv(os.path.join(OUT_DIR, "medical_trial.csv"), index=False)
print(f"\n[OK] medical_trial.csv  - rows: {len(medical_df)}")
print(f"    Success Male  : {medical_df[medical_df.gender=='Male']['treatment_success'].mean():.2%}")
print(f"    Success Female: {medical_df[medical_df.gender=='Female']['treatment_success'].mean():.2%}")

print("\n[DONE] All sample datasets generated successfully!")
