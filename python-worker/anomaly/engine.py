"""
INFRA-XRAY — Anomaly Engine + Unified Risk Scoring
Merges flags from all sources, runs ML anomaly detection, computes risk scores.
"""

import uuid


def merge_flags(cross_flags, vision_flags, geo_flags):
    all_flags = []
    all_flags.extend(cross_flags)
    all_flags.extend(vision_flags)
    all_flags.extend(geo_flags)
    return all_flags


def calculate_risk_score(flags, ml_anomaly_score=0.0):
    """Weighted risk scoring: red=30, yellow=12, green=0, + deviation bonus, + ML bonus."""
    score = 0
    red_count = 0
    yellow_count = 0
    green_count = 0

    for flag in flags:
        sev = flag.get("severity", "green")
        dev = flag.get("deviation_percent") or 0

        if sev == "red":
            score += 30
            score += min(dev, 20)  # deviation bonus
            red_count += 1
        elif sev == "yellow":
            score += 12
            score += min(dev, 20) * 0.5
            yellow_count += 1
        else:
            green_count += 1

    # ML anomaly bonus (capped at 15 pts)
    ml_contribution = ml_anomaly_score * 15
    score += ml_contribution

    # Cap at 100
    score = min(round(score), 100)

    if score >= 71:
        severity_label = "Critical"
    elif score >= 46:
        severity_label = "High"
    elif score >= 21:
        severity_label = "Medium"
    else:
        severity_label = "Low"

    return {
        "overall_score": score,
        "severity_label": severity_label,
        "ml_anomaly_score": round(ml_anomaly_score, 3),
        "flags": flags,
        "breakdown": {
            "red_count": red_count,
            "yellow_count": yellow_count,
            "green_count": green_count,
            "ml_contribution": round(ml_contribution, 3),
        },
    }
