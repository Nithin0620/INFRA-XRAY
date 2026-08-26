"""
INFRA-XRAY — Computer Vision: Damage Detector
Heuristic placeholder for RDD2022 CNN/YOLO model.
Uses OpenCV edge-density + contour analysis.
TODO: swap in trained model — same function signature.
"""

import os
import uuid
from pathlib import Path

try:
    import cv2
    import numpy as np
    HAS_CV2 = True
except ImportError:
    HAS_CV2 = False

from PIL import Image


def classify_photo(filepath: str) -> dict:
    """Classify a photo as clean_surface, cracking, or pothole.

    TODO: Replace with trained RDD2022 CNN/YOLO model.
    Current implementation is a heuristic placeholder.
    """
    if not HAS_CV2:
        return _classify_pillow(filepath)

    img = cv2.imread(filepath)
    if img is None:
        return {"predicted_tag": "unknown", "confidence": 0.0}

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150)
    edge_ratio = np.count_nonzero(edges) / edges.size

    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    large_contours = [c for c in contours if cv2.contourArea(c) > 500]
    contour_density = len(large_contours) / (gray.shape[0] * gray.shape[1]) * 10000

    # Heuristic: high edge + many contours = damage
    if edge_ratio > 0.15 and contour_density > 2:
        tag = "pothole" if contour_density > 4 else "cracking"
        confidence = min(0.9, 0.5 + edge_ratio + contour_density * 0.05)
    elif edge_ratio > 0.08:
        tag = "cracking"
        confidence = 0.4 + edge_ratio
    else:
        tag = "clean_surface"
        confidence = 0.7 + (0.1 - edge_ratio)

    return {"predicted_tag": tag, "confidence": round(min(confidence, 0.99), 2)}


def _classify_pillow(filepath: str) -> dict:
    """Fallback using Pillow only (no OpenCV). Checks image variance."""
    try:
        img = Image.open(filepath).convert("L")
        arr = list(img.getdata())
        variance = sum((x - sum(arr)/len(arr))**2 for x in arr) / len(arr)
        # High variance = likely complex/damaged surface
        if variance > 2000:
            return {"predicted_tag": "cracking", "confidence": 0.45}
        return {"predicted_tag": "clean_surface", "confidence": 0.6}
    except Exception:
        return {"predicted_tag": "unknown", "confidence": 0.0}


def analyze_project_photos(project: dict, data_dir: str) -> list[dict]:
    """Run classifier over every photo in a project."""
    photo_folder = project.get("photo_folder", "")
    photo_dir = os.path.join(data_dir, photo_folder)
    results = []

    if not os.path.isdir(photo_dir):
        return results

    for fname in sorted(os.listdir(photo_dir)):
        if fname.lower().endswith((".jpg", ".jpeg", ".png")):
            filepath = os.path.join(photo_dir, fname)
            classification = classify_photo(filepath)
            results.append({
                "photo_id": Path(fname).stem,
                "filepath": f"{photo_folder}/{fname}",
                **classification,
            })

    return results


def check_photo_evidence(project_id, inspection, photo_results):
    """Flag if damaged photos exist on claimed-complete stretches."""
    import uuid as _uuid

    verified_qty = inspection.get("verified_quantity", 0)
    photo_refs = inspection.get("photo_refs", [])

    damage_photos = [p for p in photo_results if p["predicted_tag"] in ("pothole", "cracking")]

    if not damage_photos:
        return [{
            "flag_id": f"flg_{_uuid.uuid4().hex[:12]}",
            "project_id": project_id,
            "source_module": "computer_vision",
            "severity": "green",
            "category": "photo_condition",
            "message": f"All {len(photo_results)} site photos show clean surface conditions.",
            "documents_involved": ["InspectionReport.pdf"],
            "photos_involved": [p["photo_id"] for p in photo_results],
            "deviation_percent": None,
            "gps_point": None,
        }]

    severity = "red" if any(p["predicted_tag"] == "pothole" for p in damage_photos) else "yellow"
    damage_ids = [p["photo_id"] for p in damage_photos]
    damage_tags = [f'{p["photo_id"]}({p["predicted_tag"]})' for p in damage_photos]

    return [{
        "flag_id": f"flg_{_uuid.uuid4().hex[:12]}",
        "project_id": project_id,
        "source_module": "computer_vision",
        "severity": severity,
        "category": "photo_damage",
        "message": f"Site photos show damage ({', '.join(damage_tags)}) on a stretch claimed as {verified_qty} completed — visual evidence contradicts progress claim.",
        "documents_involved": ["InspectionReport.pdf"],
        "photos_involved": damage_ids,
        "deviation_percent": round(len(damage_photos) / len(photo_results) * 100, 1) if photo_results else 0,
        "gps_point": None,
    }]
