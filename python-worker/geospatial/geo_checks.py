"""
INFRA-XRAY — Geospatial Verification
GPS/boundary/route alignment checks.
All coordinates are [lat, lon].
"""

import math
import uuid


def _haversine(lat1, lon1, lat2, lon2):
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlam/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))


def _point_to_segment_distance(px, py, ax, ay, bx, by):
    """Distance from point (px,py) to line segment (ax,ay)-(bx,by). All lat,lon."""
    dx, dy = bx - ax, by - ay
    if dx == 0 and dy == 0:
        return _haversine(px, py, ax, ay)
    t = max(0, min(1, ((px-ax)*dx + (py-ay)*dy) / (dx*dx + dy*dy)))
    proj_x, proj_y = ax + t*dx, ay + t*dy
    return _haversine(px, py, proj_x, proj_y)


def _flag(project_id, severity, category, message, docs, photos=None, deviation=None, gps=None):
    return {
        "flag_id": f"flg_{uuid.uuid4().hex[:12]}",
        "project_id": project_id,
        "source_module": "geospatial",
        "severity": severity,
        "category": category,
        "message": message,
        "documents_involved": docs,
        "photos_involved": photos or [],
        "deviation_percent": deviation,
        "gps_point": gps,
    }


def check_boundary_containment(project_id, contract, inspection):
    """For buildings: flag if inspection GPS falls outside contract polygon."""
    boundary = contract.get("gps_boundary", {})
    if boundary.get("type") != "Polygon":
        return []

    coords = boundary.get("coordinates", [[]])[0]  # outer ring
    if len(coords) < 3:
        return []

    gps_track = inspection.get("gps_track", [])
    if not gps_track:
        return []

    def point_in_polygon(lat, lon, polygon):
        n = len(polygon)
        inside = False
        j = n - 1
        for i in range(n):
            yi, xi = polygon[i]
            yj, xj = polygon[j]
            if ((yi > lat) != (yj > lat)) and (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi):
                inside = not inside
            j = i
        return inside

    flags = []
    for pt in gps_track:
        # pt = [lat, lon]
        if not point_in_polygon(pt[0], pt[1], coords):
            flags.append(_flag(
                project_id, "red", "boundary_violation",
                f"Inspection GPS point [{pt[0]}, {pt[1]}] falls outside contract site polygon.",
                ["Contract.pdf", "InspectionReport.pdf"],
                gps={"lat": pt[0], "lon": pt[1]},
            ))
            break

    return flags


def check_route_alignment(project_id, contract, inspection):
    """For linear works: max perpendicular deviation of inspection track from contract route."""
    boundary = contract.get("gps_boundary", {})
    if boundary.get("type") != "LineString":
        return []

    route = boundary.get("coordinates", [])  # [[lat, lon], ...]
    if len(route) < 2:
        return []

    gps_track = inspection.get("gps_track", [])
    if not gps_track:
        return []

    # Skip route check if inspection has fewer than 2 points (can't measure deviation)
    if len(gps_track) < 2:
        return []

    max_dev = 0
    worst_point = None

    for pt in gps_track:
        # pt = [lat, lon], route = [[lat, lon], ...]
        for i in range(len(route) - 1):
            dist = _point_to_segment_distance(
                pt[0], pt[1],           # inspection point
                route[i][0], route[i][1],  # route segment start
                route[i+1][0], route[i+1][1],  # route segment end
            )
            if dist > max_dev:
                max_dev = dist
                worst_point = pt

    if max_dev < 100:
        return []  # within tolerance

    severity = "yellow" if max_dev < 500 else "red"

    return [_flag(
        project_id, severity, "route_deviation",
        f"Inspection GPS track deviates up to {max_dev:.0f}m from contract route — potential route-alignment issue.",
        ["Contract.pdf", "InspectionReport.pdf"],
        deviation=round(max_dev, 0),
        gps={"lat": worst_point[0], "lon": worst_point[1]} if worst_point else None,
    )]


def check_photo_geotag_consistency(project_id, inspection, photo_results):
    """Flag if photo GPS is >1km from inspection track."""
    gps_track = inspection.get("gps_track", [])
    if not gps_track or not photo_results:
        return []

    flags = []
    for photo in photo_results:
        photo_lat = photo.get("gps_lat")
        photo_lon = photo.get("gps_lon")
        if photo_lat is None or photo_lon is None:
            continue

        min_dist = min(
            _haversine(photo_lat, photo_lon, pt[0], pt[1])
            for pt in gps_track
        )

        # Only flag if photo is very far from inspection location (>10km for demo)
        if min_dist > 10000:
            flags.append(_flag(
                project_id, "yellow", "photo_geotag_mismatch",
                f"Photo {photo['photo_id']} is {min_dist:.0f}m from inspection track — possible mislabeled evidence.",
                ["InspectionReport.pdf"],
                photos=[photo["photo_id"]],
                deviation=round(min_dist, 0),
                gps={"lat": photo_lat, "lon": photo_lon},
            ))

    return flags


def run_geo_checks(project_id, extracted, photos):
    contract = extracted.get("contract", {})
    inspection = extracted.get("inspection_report", {})

    flags = []
    flags.extend(check_boundary_containment(project_id, contract, inspection))
    flags.extend(check_route_alignment(project_id, contract, inspection))
    flags.extend(check_photo_geotag_consistency(project_id, inspection, photos))

    return flags
