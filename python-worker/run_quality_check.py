#!/usr/bin/env python3
"""
INFRA-XRAY — Run Quality Check
Iterates all projects in data/projects.json, runs quality checks,
writes data/quality_report.json.
"""

import json
import os
import sys
from pathlib import Path

from quality_checker import check_project

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def main():
    projects_path = DATA_DIR / "projects.json"
    if not projects_path.exists():
        print("ERROR: data/projects.json not found. Run the data generator first.")
        sys.exit(1)

    with open(projects_path) as f:
        projects = json.load(f)

    print(f"INFRA-XRAY — Data Quality Check")
    print(f"{'=' * 40}")
    print(f"Checking {len(projects)} projects...\n")

    report = {"projects": [], "summary": {}}

    for project in projects:
        result = check_project(project, str(DATA_DIR))
        report["projects"].append(result)

        status_icon = "✓" if result["ready_for_extraction"] else "✗"
        print(
            f"  {status_icon} {project['project_id']:10s} | "
            f"Files: {result['files_checked']} | "
            f"OK: {result['ok']} | "
            f"Warnings: {result['warnings']} | "
            f"Errors: {result['errors']} | "
            f"Ready: {result['ready_for_extraction']}"
        )

    total_files = sum(r["files_checked"] for r in report["projects"])
    total_ok = sum(r["ok"] for r in report["projects"])
    total_warnings = sum(r["warnings"] for r in report["projects"])
    total_errors = sum(r["errors"] for r in report["projects"])
    all_ready = all(r["ready_for_extraction"] for r in report["projects"])

    report["summary"] = {
        "total_projects": len(projects),
        "total_files_checked": total_files,
        "total_ok": total_ok,
        "total_warnings": total_warnings,
        "total_errors": total_errors,
        "all_ready_for_extraction": all_ready,
    }

    # Write report
    output_path = DATA_DIR / "quality_report.json"
    with open(output_path, "w") as f:
        json.dump(report, f, indent=2)

    print(f"\n{'─' * 40}")
    print(f"Total: {total_files} files | {total_ok} OK | {total_warnings} warnings | {total_errors} errors")
    print(f"All ready: {'YES' if all_ready else 'NO'}")
    print(f"\n✓ Report saved to {output_path}")


if __name__ == "__main__":
    main()
