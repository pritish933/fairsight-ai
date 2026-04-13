import pandas as pd
import numpy as np
from typing import Dict, List, Any


class BiasDetector:
    """
    Core bias detection engine.
    Supports CSV datasets with a binary or continuous target column.
    """

    def __init__(self, df: pd.DataFrame, target_col: str, protected_attrs: List[str]):
        self.df = df.copy()
        self.target_col = target_col
        self.protected_attrs = protected_attrs

        # Normalize target to numeric
        if self.df[self.target_col].dtype == object:
            unique_vals = self.df[self.target_col].unique()
            if len(unique_vals) == 2:
                self.df[self.target_col] = self.df[self.target_col].map(
                    {unique_vals[0]: 0, unique_vals[1]: 1}
                )

        self.df[self.target_col] = pd.to_numeric(self.df[self.target_col], errors='coerce')
        self.df.dropna(subset=[self.target_col], inplace=True)

    # ──────────────────────────────────────────────────────────────────────────
    # Public entry point
    # ──────────────────────────────────────────────────────────────────────────
    def detect_all(self) -> Dict[str, Any]:
        overall_penalty = 0
        attr_results: Dict[str, Any] = {}

        for attr in self.protected_attrs:
            if attr not in self.df.columns:
                continue
            result = self._analyze_attribute(attr)
            attr_results[attr] = result
            overall_penalty += result["severity_penalty"]

        overall_score = max(0, min(100, 100 - overall_penalty))

        return {
            "overall_score": round(overall_score),
            "risk_level": self._get_risk_level(overall_score),
            "attributes": attr_results,
            "dataset_stats": self._get_dataset_stats(),
        }

    # ──────────────────────────────────────────────────────────────────────────
    # Per-attribute analysis
    # ──────────────────────────────────────────────────────────────────────────
    def _analyze_attribute(self, attr: str) -> Dict[str, Any]:
        col = self.df[attr].astype(str)
        target = self.df[self.target_col]

        groups = sorted(col.unique())
        group_positive_rates: Dict[str, float] = {}
        group_sizes: Dict[str, int] = {}

        for group in groups:
            mask = col == group
            group_target = target[mask]
            group_sizes[group] = int(mask.sum())
            rate = float(group_target.mean()) if len(group_target) > 0 else 0.0
            group_positive_rates[group] = round(rate, 4)

        rates = list(group_positive_rates.values())

        # 1. Demographic Parity Gap
        dem_parity_gap = round(max(rates) - min(rates), 4) if len(rates) > 1 else 0.0

        # 2. Disparate Impact Ratio  (4/5 rule: must be >= 0.8)
        max_rate = max(rates) if rates else 1.0
        min_rate = min(rates) if rates else 1.0
        di_ratio = round(min_rate / max_rate, 4) if max_rate > 0 else 1.0

        # 3. Representation distribution
        total = len(self.df)
        representation = {
            g: round(group_sizes.get(g, 0) / total * 100, 2) for g in groups
        }
        rep_gap = max(representation.values()) - min(representation.values()) if representation else 0

        # 4. Most & least favoured group
        most_favoured = max(group_positive_rates, key=group_positive_rates.get)
        least_favoured = min(group_positive_rates, key=group_positive_rates.get)

        # 5. Equalized Odds — TPR & FPR per group (requires knowing true label)
        #    If target is binary {0,1}: true positives when target=1 and prediction=1
        #    We treat the target itself as the "decision" (label = outcome)
        #    So TPR per group = P(outcome=1 | group) = group_positive_rates
        #    FPR per group → not applicable in pure CSV label auditing, skip gracefully
        tpr_values = list(group_positive_rates.values())
        tpr_gap = round(max(tpr_values) - min(tpr_values), 4) if len(tpr_values) > 1 else 0.0

        # Severity scoring
        severity = self._calculate_severity(dem_parity_gap, di_ratio)

        return {
            "demographic_parity_gap": dem_parity_gap,
            "disparate_impact_ratio": di_ratio,
            "equalized_odds_tpr_gap": tpr_gap,
            "group_positive_rates": group_positive_rates,
            "group_sizes": group_sizes,
            "representation": representation,
            "most_favoured_group": most_favoured,
            "least_favoured_group": least_favoured,
            "severity": severity["level"],
            "severity_penalty": severity["penalty"],
            "di_passes_threshold": di_ratio >= 0.8,
            "metrics": {
                "demographic_parity": {
                    "gap": dem_parity_gap,
                    "threshold": 0.10,
                    "passes": dem_parity_gap <= 0.10,
                },
                "disparate_impact": {
                    "ratio": di_ratio,
                    "threshold": 0.80,
                    "passes": di_ratio >= 0.80,
                },
                "equalized_odds": {
                    "tpr_gap": tpr_gap,
                    "threshold": 0.10,
                    "passes": tpr_gap <= 0.10,
                },
                "representation": {
                    "distribution": representation,
                    "max_gap": round(rep_gap, 2),
                    "balanced": rep_gap < 30,
                },
            },
        }


    # ──────────────────────────────────────────────────────────────────────────
    # Helper methods
    # ──────────────────────────────────────────────────────────────────────────
    def _calculate_severity(self, dem_parity_gap: float, di_ratio: float) -> Dict[str, Any]:
        score = 0
        if dem_parity_gap > 0.30:
            score += 3
        elif dem_parity_gap > 0.15:
            score += 2
        elif dem_parity_gap > 0.10:
            score += 1

        if di_ratio < 0.60:
            score += 3
        elif di_ratio < 0.70:
            score += 2
        elif di_ratio < 0.80:
            score += 1

        if score >= 5:
            return {"level": "CRITICAL", "penalty": 35}
        elif score >= 3:
            return {"level": "HIGH", "penalty": 22}
        elif score >= 1:
            return {"level": "MEDIUM", "penalty": 12}
        else:
            return {"level": "LOW", "penalty": 3}

    def _get_risk_level(self, score: float) -> str:
        if score >= 80:
            return "LOW"
        elif score >= 60:
            return "MEDIUM"
        elif score >= 40:
            return "HIGH"
        else:
            return "CRITICAL"

    def _get_dataset_stats(self) -> Dict[str, Any]:
        target_dist = (
            self.df[self.target_col]
            .value_counts(normalize=True)
            .round(3)
            .to_dict()
        )
        return {
            "total_rows": len(self.df),
            "total_columns": len(self.df.columns),
            "target_column": self.target_col,
            "target_distribution": {str(k): v for k, v in target_dist.items()},
        }
