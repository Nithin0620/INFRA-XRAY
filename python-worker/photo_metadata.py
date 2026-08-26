"""
INFRA-XRAY — Photo Metadata Reader
Reads photo sidecar metadata (gps, timestamp, condition_tag) into normalized format.
"""

import json
import os


def read_photo_metadata(project: dict, data_dir: str) -> list[dict]:
    photo_folder = project.get("photo_folder", "")
    meta_path = os.path.join(data_dir, photo_folder, "photos_meta.json")

    if not os.path.exists(meta_path):
        return []

    with open(meta_path) as f:
        raw = json.load(f)

    return [
        {
            "photo_id": m["photo_id"],
            "gps_lat": m["gps_lat"],
            "gps_lon": m["gps_lon"],
            "timestamp": m["timestamp"],
            "filepath": m["filepath"],
            "condition_tag": m.get("condition_tag", "unknown"),
        }
        for m in raw
    ]
