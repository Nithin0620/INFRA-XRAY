"""
INFRA-XRAY — Data Quality Checker
Validates file integrity before extraction pipeline runs.
Checks: existence, PDF parseability, photo validity, duplicates, format mismatches.
"""

import hashlib
import os
from pathlib import Path

from PIL import Image
import pdfplumber


def _file_hash(filepath: str) -> str:
    h = hashlib.md5()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def check_pdf(filepath: str) -> dict:
    result = {"filepath": filepath, "status": "ok", "issues": []}

    if not os.path.exists(filepath):
        result["status"] = "error"
        result["issues"].append("File does not exist")
        return result

    if os.path.getsize(filepath) == 0:
        result["status"] = "error"
        result["issues"].append("File is empty")
        return result

    try:
        with pdfplumber.open(filepath) as pdf:
            if len(pdf.pages) == 0:
                result["status"] = "error"
                result["issues"].append("PDF has zero pages")
                return result

            has_text = False
            for page in pdf.pages:
                text = page.extract_text()
                if text and text.strip():
                    has_text = True
                    break

            if not has_text:
                result["status"] = "warning"
                result["issues"].append("Possible scanned image / no extractable text")
    except Exception as e:
        result["status"] = "error"
        result["issues"].append(f"PDF cannot be opened: {e}")

    return result


def check_photo(filepath: str, metadata: dict | None = None) -> dict:
    result = {"filepath": filepath, "status": "ok", "issues": []}

    if not os.path.exists(filepath):
        result["status"] = "error"
        result["issues"].append("File does not exist")
        return result

    if os.path.getsize(filepath) == 0:
        result["status"] = "error"
        result["issues"].append("File is empty")
        return result

    try:
        with Image.open(filepath) as img:
            img.verify()
    except Exception as e:
        result["status"] = "error"
        result["issues"].append(f"Not a valid image: {e}")
        return result

    if metadata is None:
        result["status"] = "warning"
        result["issues"].append("No metadata entry found for this photo")
    else:
        if metadata.get("gps_lat") is None or metadata.get("gps_lon") is None:
            result["status"] = "warning"
            result["issues"].append("Missing GPS metadata")
        if metadata.get("timestamp") is None:
            result["status"] = "warning"
            result["issues"].append("Missing timestamp metadata")

    return result


def check_document(filepath: str) -> dict:
    ext = Path(filepath).suffix.lower()
    if ext == ".pdf":
        return check_pdf(filepath)
    elif ext in (".jpg", ".jpeg", ".png", ".tiff", ".bmp"):
        return check_photo(filepath)
    else:
        return {"filepath": filepath, "status": "warning", "issues": [f"Unknown file type: {ext}"]}


def find_duplicates(file_results: list[dict]) -> list[dict]:
    hash_map: dict[str, list[str]] = {}
    for r in file_results:
        if r["status"] == "error":
            continue
        try:
            h = _file_hash(r["filepath"])
            hash_map.setdefault(h, []).append(r["filepath"])
        except OSError:
            pass

    dupes = []
    for h, paths in hash_map.items():
        if len(paths) > 1:
            dupes.append({
                "hash": h,
                "files": paths,
                "message": f"Duplicate files detected: {', '.join(Path(p).name for p in paths)}",
            })
    return dupes


def check_project(project: dict, data_dir: str) -> dict:
    project_id = project["project_id"]
    results = []

    # Check PDFs
    for doc_type, rel_path in project.get("documents", {}).items():
        filepath = os.path.join(data_dir, rel_path)
        results.append(check_document(filepath))

    # Check photos
    photo_meta_path = os.path.join(data_dir, project.get("photo_folder", ""), "photos_meta.json")
    photo_meta = {}
    if os.path.exists(photo_meta_path):
        import json
        with open(photo_meta_path) as f:
            meta_list = json.load(f)
        photo_meta = {m["photo_id"]: m for m in meta_list}

    photo_dir = os.path.join(data_dir, project.get("photo_folder", ""))
    if os.path.isdir(photo_dir):
        for fname in sorted(os.listdir(photo_dir)):
            if fname.lower().endswith((".jpg", ".jpeg", ".png")):
                filepath = os.path.join(photo_dir, fname)
                photo_id = Path(fname).stem
                meta = photo_meta.get(photo_id)
                results.append(check_photo(filepath, meta))

    # Duplicate detection within project
    duplicates = find_duplicates(results)

    errors = sum(1 for r in results if r["status"] == "error")
    warnings = sum(1 for r in results if r["status"] == "warning")
    ok_count = sum(1 for r in results if r["status"] == "ok")

    return {
        "project_id": project_id,
        "files_checked": len(results),
        "ok": ok_count,
        "warnings": warnings,
        "errors": errors,
        "ready_for_extraction": errors == 0,
        "duplicates": duplicates,
        "file_results": results,
    }
