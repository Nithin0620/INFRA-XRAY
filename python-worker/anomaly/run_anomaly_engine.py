#!/usr/bin/env python3
"""Run anomaly engine — merge flags, score risk, generate reports."""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from anomaly.engine import merge_flags, calculate_risk_score

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"


def main():
    print("Anomaly Engine + Risk Scoring")
    print("=" * 40)

    projects = json.loads((DATA_DIR / "projects.json").read_text())
    verified_dir = DATA_DIR / "verified"
    verified_dir.mkdir(exist_ok=True)

    summary = []

    for project in projects:
        pid = project["project_id"]

        # Load all flag sources
        cross_path = verified_dir / f"{pid}_cross_flags.json"
        vision_path = verified_dir / f"{pid}_vision_flags.json"
        geo_path = verified_dir / f"{pid}_geo_flags.json"

        cross = json.loads(cross_path.read_text()) if cross_path.exists() else []
        vision = json.loads(vision_path.read_text()) if vision_path.exists() else []
        geo = json.loads(geo_path.read_text()) if geo_path.exists() else []

        # ML anomaly score (placeholder — simple heuristic for now)
        ml_score = _compute_ml_score(cross, vision, geo)

        all_flags = merge_flags(cross, vision, geo)
        report = calculate_risk_score(all_flags, ml_score)

        output = verified_dir / f"{pid}_report.json"
        output.write_text(json.dumps(report, indent=2))

        summary.append({
            "project_id": pid,
            "project_name": project["project_name"],
            "state": project["state"],
            "category": project["category"],
            "sanctioned_amount_inr": project["sanctioned_amount_inr"],
            "risk_score": report["overall_score"],
            "severity_label": report["severity_label"],
            "red_flags": report["breakdown"]["red_count"],
            "yellow_flags": report["breakdown"]["yellow_count"],
        })

        print(f"  {pid}: score={report['overall_score']} ({report['severity_label']}) "
              f"| {report['breakdown']['red_count']}R {report['breakdown']['yellow_count']}Y "
              f"| ML={ml_score:.2f}")

    # Write portfolio summary (sorted by risk score desc)
    summary.sort(key=lambda x: x["risk_score"], reverse=True)
    summary_path = verified_dir / "summary.json"
    summary_path.write_text(json.dumps(summary, indent=2))
    print(f"\n✓ Summary saved ({len(summary)} projects)")


def _compute_ml_score(cross, vision, geo):
    """Simple anomaly score based on flag density and severity mix."""
    total = len(cross) + len(vision) + len(geo)
    reds = sum(1 for f in cross + vision + geo if f.get("severity") == "red")
    if total == 0:
        return 0.0
    # Normalize: 0 = no flags, 1 = many red flags
    return min(1.0, (reds * 0.3 + total * 0.05))


if __name__ == "__main__":
    main()
