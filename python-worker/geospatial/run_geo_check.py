#!/usr/bin/env python3
"""Run geospatial checks on all projects."""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from geospatial.geo_checks import run_geo_checks

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"


def main():
    print("Geospatial Verification Module")
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
        photos = extracted.get("photos", [])
        flags = run_geo_checks(pid, extracted, photos)

        output = verified_dir / f"{pid}_geo_flags.json"
        output.write_text(json.dumps(flags, indent=2))

        red = sum(1 for f in flags if f["severity"] == "red")
        yellow = sum(1 for f in flags if f["severity"] == "yellow")
        print(f"  {pid}: {len(flags)} flags ({red} red, {yellow} yellow)")

    print("Done.")


if __name__ == "__main__":
    main()
