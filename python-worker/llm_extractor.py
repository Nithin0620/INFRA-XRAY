"""
INFRA-XRAY — LLM Document Extractor
Calls Anthropic Claude to extract structured JSON from raw PDF text.
Falls back to regex-based parser for demo mode (no API key).
"""

import json
import os
import re
import time

# ─── Schema prompts per document type ───

SCHEMAS = {
    "contract": {
        "fields": [
            "project_name", "tender_id", "contractor_name",
            "sanctioned_quantity", "unit", "sanctioned_cost_inr",
            "gps_boundary", "start_date", "deadline",
        ],
        "system": "Extract contract data from government infrastructure documents. Return ONLY valid JSON, no markdown fences.",
    },
    "boq": {
        "fields": ["line_items", "boq_total_inr"],
        "system": "Extract Bill of Quantities data. Return line_items as array of {item, unit_rate_inr, quantity, line_total_inr} and boq_total_inr. Return ONLY valid JSON.",
    },
    "progress_report": {
        "fields": [
            "reporting_period", "quantity_completed", "unit",
            "percent_complete", "engineer_name", "report_date",
        ],
        "system": "Extract progress report data. Return ONLY valid JSON.",
    },
    "invoice": {
        "fields": [
            "invoice_number", "billed_quantity", "unit",
            "billed_amount_inr", "payment_date",
        ],
        "system": "Extract invoice/bill data. Return ONLY valid JSON.",
    },
    "inspection_report": {
        "fields": [
            "inspection_date", "inspector_name", "verified_quantity",
            "unit", "gps_track", "photo_refs", "condition_remarks", "risk_comment",
        ],
        "system": "Extract inspection report data. gps_track should be array of [lat, lon]. photo_refs should be array of strings. Return ONLY valid JSON.",
    },
}


def extract_with_llm(raw_text: str, doc_type: str) -> dict | None:
    """Call Anthropic Claude for structured extraction. Returns None if no API key."""
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key or api_key == "your_key_here":
        return None

    try:
        import anthropic
    except ImportError:
        return None

    schema_info = SCHEMAS.get(doc_type)
    if not schema_info:
        return None

    client = anthropic.Anthropic(api_key=api_key)
    prompt = f"""Extract structured data from this government infrastructure document.

Document type: {doc_type}
Expected fields: {', '.join(schema_info['fields'])}

Raw text:
---
{raw_text[:4000]}
---

Return ONLY valid JSON matching the expected fields. No markdown fences, no preamble."""

    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            system=schema_info["system"],
            messages=[{"role": "user", "content": prompt}],
        )
        text = response.content[0].text.strip()
        # Strip accidental markdown fences
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
        return json.loads(text)
    except Exception as e:
        print(f"    LLM extraction failed: {e}")
        return None


# ─── Regex fallback for synthetic PDFs ───

def _extract_line(text: str, pattern: str) -> str | None:
    m = re.search(pattern, text, re.IGNORECASE)
    return m.group(1).strip() if m else None


def _parse_inr(s: str) -> int:
    s = s.replace(",", "").replace("₹", "").replace("¹", "").strip()
    if "cr" in s.lower():
        return int(float(s.lower().replace("cr", "").strip()) * 10_000_000)
    if "l" in s.lower():
        return int(float(s.lower().replace("l", "").strip()) * 100_000)
    return int(float(s))


def extract_contract(text: str) -> dict:
    cost_str = _extract_line(text, r"Sanctioned Cost:\s*INR\s*([\d.,]+\s*Cr)") or "0"
    qty_str = _extract_line(text, r"Sanctioned Quantity:\s*([\d.]+)") or "0"
    unit = _extract_line(text, r"Sanctioned Quantity:\s*[\d.]+\s*(\w+)") or "km"
    gps_raw = _extract_line(text, r"GPS Boundary:\s*(.+)")
    gps = None
    if gps_raw:
        coords = re.findall(r"\[([\d.]+),\s*([\d.]+)]", gps_raw)
        if coords:
            gps = {"type": "LineString", "coordinates": [[float(a), float(b)] for a, b in coords]}

    return {
        "project_name": _extract_line(text, r"Project:\s*(.+)") or "",
        "tender_id": _extract_line(text, r"Tender ID:\s*(.+)") or "",
        "contractor_name": _extract_line(text, r"Contractor:\s*(.+)") or "",
        "sanctioned_quantity": float(qty_str),
        "unit": unit,
        "sanctioned_cost_inr": _parse_inr(cost_str),
        "gps_boundary": gps,
        "start_date": _extract_line(text, r"Start Date:\s*(.+)") or "",
        "deadline": _extract_line(text, r"Completion Deadline:\s*(.+)") or "",
    }


def extract_boq(text: str) -> dict:
    items = []
    # Match: item_name  ₹rate  qty  ₹amount (₹ may appear as ¹ in extracted text)
    for m in re.finditer(
        r"^(.+?)\s+[¹₹]?([\d,]+)\s+([\d.]+)\s+[¹₹]?([\d,]+)\s*$",
        text,
        re.MULTILINE,
    ):
        items.append({
            "item": m.group(1).strip(),
            "unit_rate_inr": int(float(m.group(2).replace(",", ""))),
            "quantity": float(m.group(3).replace(",", "")),
            "line_total_inr": int(float(m.group(4).replace(",", ""))),
        })

    total_str = _extract_line(text, r"BOQ Total:\s*INR\s*([\d,]+)")
    total = int(float(total_str.replace(",", ""))) if total_str else sum(i["line_total_inr"] for i in items)

    return {"line_items": items, "boq_total_inr": total}


def extract_progress_report(text: str) -> dict:
    qty_str = _extract_line(text, r"Claimed Quantity Completed:\s*([\d.]+)") or "0"
    return {
        "reporting_period": _extract_line(text, r"Reporting Period:\s*(.+)") or "",
        "quantity_completed": float(qty_str),
        "unit": _extract_line(text, r"Claimed Quantity Completed:\s*[\d.]+\s*(\w+)") or "km",
        "percent_complete": float(_extract_line(text, r"Percentage Complete:\s*([\d.]+)") or "0"),
        "engineer_name": _extract_line(text, r"Engineer-in-Charge:\s*(.+)") or "",
        "report_date": _extract_line(text, r"Date:\s*(.+)") or "",
    }


def extract_invoice(text: str) -> dict:
    amt_str = _extract_line(text, r"Billed Amount:\s*INR\s*([\d.,]+\s*Cr)") or "0"
    qty_str = _extract_line(text, r"Billed Quantity:\s*([\d.]+)") or "0"
    return {
        "invoice_number": _extract_line(text, r"Invoice Number:\s*(.+)") or "",
        "billed_quantity": float(qty_str),
        "unit": _extract_line(text, r"Billed Quantity:\s*[\d.]+\s*(\w+)") or "km",
        "billed_amount_inr": _parse_inr(amt_str),
        "payment_date": _extract_line(text, r"Payment Date:\s*(.+)") or "",
    }


def extract_inspection_report(text: str) -> dict:
    verified_str = _extract_line(text, r"Physically Verified:\s*([\d.]+)") or "0"
    photo_refs_raw = _extract_line(text, r"Photo References:\s*(.+)") or ""
    photo_refs = [p.strip() for p in photo_refs_raw.split(",") if p.strip()]

    gps_raw = _extract_line(text, r"GPS Coordinates Recorded:\s*(.+)")
    gps_track = []
    if gps_raw:
        coords = re.findall(r"([\d.]+),\s*([\d.]+)", gps_raw)
        gps_track = [[float(a), float(b)] for a, b in coords]

    return {
        "inspection_date": _extract_line(text, r"Inspection Date:\s*(.+)") or "",
        "inspector_name": _extract_line(text, r"Inspector:\s*(.+)") or "",
        "verified_quantity": float(verified_str),
        "unit": _extract_line(text, r"Physically Verified:\s*[\d.]+\s*(\w+)") or "km",
        "gps_track": gps_track,
        "photo_refs": photo_refs,
        "condition_remarks": _extract_line(text, r"Condition Remarks:\s*(.+)") or "",
        "risk_comment": _extract_line(text, r"Risk Comment:\s*(.+)") or "",
    }


FALLBACK_PARSERS = {
    "contract": extract_contract,
    "boq": extract_boq,
    "progress_report": extract_progress_report,
    "invoice": extract_invoice,
    "inspection_report": extract_inspection_report,
}


def extract_structured_data(raw_text: str, doc_type: str) -> dict:
    """Try LLM first, fall back to regex parser."""
    result = extract_with_llm(raw_text, doc_type)
    if result:
        return result

    parser = FALLBACK_PARSERS.get(doc_type)
    if parser:
        return parser(raw_text)

    raise ValueError(f"No extractor available for doc_type: {doc_type}")
