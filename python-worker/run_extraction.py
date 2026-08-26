#!/usr/bin/env python3
"""
INFRA-XRAY — Document Extraction Pipeline
For each project: read PDFs → extract structured data → generate Evidence Records.
Saves data/extracted/{project_id}.json per project.
"""

import json
import os
import sys
import time
from pathlib import Path

from pdf_reader import extract_text_from_pdf
from llm_extractor import extract_structured_data
from photo_metadata import read_photo_metadata
from evidence_model import generate_evidence_records

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
EXTRACTED_DIR = DATA_DIR / "extracted"

DOC_TYPES = ["contract", "boq", "progress_report", "invoice", "inspection_report"]


def extract_project(project: dict) -> dict:
    project_id = project["project_id"]
    result = {"project_id": project_id}

    for doc_type in DOC_TYPES:
        rel_path = project.get("documents", {}).get(doc_type)
        if not rel_path:
            print(f"    ⚠ {doc_type}: no path in projects.json")
            continue

        filepath = DATA_DIR / rel_path
        if not filepath.exists():
            print(f"    ✗ {doc_type}: file not found at {rel_path}")
            continue

        print(f"    → {doc_type}...", end=" ", flush=True)
        raw_text = extract_text_from_pdf(str(filepath))

        if not raw_text.strip():
            print("⚠ no text extracted")
            continue

        data = extract_structured_data(raw_text, doc_type)
        result[doc_type] = data
        print("✓")

    # Photo metadata
    photos = read_photo_metadata(project, str(DATA_DIR))
    result["photos"] = photos
    print(f"    → photos: {len(photos)} records ✓")

    # Evidence Model records
    evidence_records = generate_evidence_records(project_id, result)
    result["evidence_records"] = evidence_records
    print(f"    → evidence_records: {len(evidence_records)} records ✓")

    return result


def main():
    print("INFRA-XRAY — Document Extraction Pipeline")
    print("=" * 44)

    projects_path = DATA_DIR / "projects.json"
    quality_path = DATA_DIR / "quality_report.json"

    if not projects_path.exists():
        print("ERROR: data/projects.json not found.")
        sys.exit(1)

    with open(projects_path) as f:
        projects = json.load(f)

    # Check quality gate
    if quality_path.exists():
        with open(quality_path) as f:
            quality = json.load(f)
        not_ready = [p["project_id"] for p in quality.get("projects", []) if not p.get("ready_for_extraction")]
        if not_ready:
            print(f"⚠ Skipping projects not ready: {', '.join(not_ready)}")
            projects = [p for p in projects if p["project_id"] not in not_ready]

    EXTRACTED_DIR.mkdir(parents=True, exist_ok=True)

    has_api_key = bool(os.environ.get("ANTHROPIC_API_KEY") and os.environ.get("ANTHROPIC_API_KEY") != "your_key_here")
    mode = "LLM (Anthropic Claude)" if has_api_key else "Fallback (regex parser)"
    print(f"Mode: {mode}\n")

    success = 0
    for project in projects:
        pid = project["project_id"]
        print(f"\n[{pid}] {project['project_name']}")

        try:
            extracted = extract_project(project)
            output_path = EXTRACTED_DIR / f"{pid}.json"
            with open(output_path, "w") as f:
                json.dump(extracted, f, indent=2)
            print(f"  ✓ Saved to {output_path.name}")
            success += 1
        except Exception as e:
            print(f"  ✗ FAILED: {e}")

        # Rate limit pause for LLM calls
        if has_api_key:
            time.sleep(1)

    print(f"\n{'─' * 44}")
    print(f"Extracted: {success}/{len(projects)} projects")

    # Show sample output for one clean and one mismatch project
    for sample_id in ["proj_001", "proj_002"]:
        sample_path = EXTRACTED_DIR / f"{sample_id}.json"
        if sample_path.exists():
            with open(sample_path) as f:
                sample = json.load(f)
            print(f"\n─── Sample: {sample_id} ───")
            for doc_type in DOC_TYPES:
                data = sample.get(doc_type, {})
                if doc_type == "boq":
                    print(f"  {doc_type}: {len(data.get('line_items', []))} items, total INR {data.get('boq_total_inr', 0):,.0f}")
                elif doc_type == "inspection_report":
                    print(f"  {doc_type}: verified {data.get('verified_quantity', 0)} {data.get('unit', '')}")
                else:
                    # Show key fields
                    keys = [k for k in data.keys() if not k.startswith("_")]
                    key_vals = {k: data[k] for k in keys[:3]}
                    print(f"  {doc_type}: {key_vals}")
            print(f"  evidence_records: {len(sample.get('evidence_records', []))} records")


if __name__ == "__main__":
    main()
