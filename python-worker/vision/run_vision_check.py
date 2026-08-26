#!/usr/bin/env python3
"""Run computer vision check on all projects."""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from vision.damage_detector import analyze_project_photos, check_photo_evidence

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"


def main():
    print("Computer Vision Module")
    print("=" * 40)

    projects = json.loads((DATA_DIR / "projects.json").read_text())
    verified_dir = DATA_DIR / "verified"
    verified_dir.mkdir(exist_ok=True)

    for project in projects:
        pid = project["project_id"]
        extracted_path = DATA_DIR / "extracted" / f"{pid}.json"
        if not extracted_path.exists():
            print(f"  ✗ {pid}: no extracted data")
            continue

        extracted = json.loads(extracted_path.read_text())
        inspection = extracted.get("inspection_report", {})
        photo_results = analyze_project_photos(project, str(DATA_DIR))
        flags = check_photo_evidence(pid, inspection, photo_results)

        output = verified_dir / f"{pid}_vision_flags.json"
        output.write_text(json.dumps(flags, indent=2))

        damage = sum(1 for p in photo_results if p["predicted_tag"] != "clean_surface")
        print(f"  {pid}: {len(photo_results)} photos, {damage} damage, {len(flags)} flags")

    print("Done.")


if __name__ == "__main__":
    main()
