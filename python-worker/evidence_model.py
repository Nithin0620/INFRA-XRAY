"""
INFRA-XRAY — Evidence Model
Generates normalized EvidenceRecord entries from extracted document data.
Every downstream module reads these. The core data unit.
"""

import uuid


def _record(project_id: str, claim: str, source: str, evidence: str,
            location: dict | None, timestamp: str | None, doc_type: str) -> dict:
    return {
        "record_id": f"ev_{uuid.uuid4().hex[:12]}",
        "project_id": project_id,
        "claim": claim,
        "source": source,
        "evidence": evidence,
        "location": location,
        "timestamp": timestamp,
        "doc_type": doc_type,
    }


def generate_evidence_records(project_id: str, extracted: dict) -> list[dict]:
    records = []
    contract = extracted.get("contract", {})
    boq = extracted.get("boq", {})
    progress = extracted.get("progress_report", {})
    invoice = extracted.get("invoice", {})
    inspection = extracted.get("inspection_report", {})
    photos = extracted.get("photos", [])

    # Contract claims
    if contract:
        records.append(_record(
            project_id,
            f"Contract sanctions {contract.get('sanctioned_quantity', 0)} {contract.get('unit', '')} at INR {contract.get('sanctioned_cost_inr', 0):,.0f}",
            "Contract.pdf",
            f"Tender {contract.get('tender_id', 'N/A')}, contractor: {contract.get('contractor_name', 'N/A')}",
            contract.get("gps_boundary", {}).get("coordinates", [None])[0] if contract.get("gps_boundary") else None,
            contract.get("start_date"),
            "contract",
        ))

    # Progress claims
    if progress:
        loc = None
        if inspection.get("gps_track"):
            loc = inspection["gps_track"][0] if inspection["gps_track"] else None
            loc = {"lat": loc[0], "lon": loc[1]} if loc else None
        records.append(_record(
            project_id,
            f"Progress report claims {progress.get('quantity_completed', 0)} {progress.get('unit', '')} completed ({progress.get('percent_complete', 0)}%)",
            "ProgressReport.pdf",
            f"Engineer: {progress.get('engineer_name', 'N/A')}, period: {progress.get('reporting_period', 'N/A')}",
            loc,
            progress.get("report_date"),
            "progress_report",
        ))

    # Invoice claims
    if invoice:
        records.append(_record(
            project_id,
            f"Invoice bills {invoice.get('billed_quantity', 0)} {invoice.get('unit', '')} for INR {invoice.get('billed_amount_inr', 0):,.0f}",
            "Invoice.pdf",
            f"Invoice {invoice.get('invoice_number', 'N/A')}, payment date: {invoice.get('payment_date', 'N/A')}",
            None,
            invoice.get("payment_date"),
            "invoice",
        ))

    # Inspection verification
    if inspection:
        gps = inspection.get("gps_track", [[None, None]])[0] if inspection.get("gps_track") else None
        loc = {"lat": gps[0], "lon": gps[1]} if gps and len(gps) >= 2 else None
        records.append(_record(
            project_id,
            f"Physical inspection verifies {inspection.get('verified_quantity', 0)} {inspection.get('unit', '')}",
            "InspectionReport.pdf",
            f"Inspector: {inspection.get('inspector_name', 'N/A')}, remarks: {inspection.get('condition_remarks', 'N/A')}",
            loc,
            inspection.get("inspection_date"),
            "inspection_report",
        ))

    # Photo evidence
    for photo in photos:
        records.append(_record(
            project_id,
            f"Site photo {photo.get('photo_id', 'N/A')} tagged as: {photo.get('condition_tag', 'unknown')}",
            photo.get("filepath", "N/A"),
            f"Photo condition: {photo.get('condition_tag', 'unknown')}",
            {"lat": photo.get("gps_lat"), "lon": photo.get("gps_lon")} if photo.get("gps_lat") else None,
            photo.get("timestamp"),
            "photos",
        ))

    return records
