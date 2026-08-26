"""
INFRA-XRAY — Cross-Verification Rules
Rule-based checks comparing contract, progress, invoice, inspection, and BOQ.
Every check returns a Flag dict matching the shared schema.
"""

import uuid


def _flag(project_id, severity, category, message, docs, photos=None, deviation=None, gps=None):
    return {
        "flag_id": f"flg_{uuid.uuid4().hex[:12]}",
        "project_id": project_id,
        "source_module": "cross_verification",
        "severity": severity,
        "category": category,
        "message": message,
        "documents_involved": docs,
        "photos_involved": photos or [],
        "deviation_percent": deviation,
        "gps_point": gps,
    }


def _severity_from_pct(pct):
    if pct is None:
        return "green"
    if pct > 10:
        return "red"
    if pct > 5:
        return "yellow"
    return "green"


def check_quantity_consistency(project_id, contract, progress, inspection):
    sanctioned = contract.get("sanctioned_quantity", 0)
    claimed = progress.get("quantity_completed", 0)
    verified = inspection.get("verified_quantity", 0)
    unit = contract.get("unit", "")

    if sanctioned == 0:
        return []

    flags = []

    # Contract vs progress report
    dev_claimed = abs(sanctioned - claimed) / sanctioned * 100
    if dev_claimed > 5:
        flags.append(_flag(
            project_id,
            _severity_from_pct(dev_claimed),
            "quantity_mismatch",
            f"Contract sanctions {sanctioned} {unit}, but progress report claims only {claimed} {unit} — a {dev_claimed:.1f}% deviation.",
            ["Contract.pdf", "ProgressReport.pdf"],
            deviation=round(dev_claimed, 1),
        ))

    # Contract vs inspection
    dev_verified = abs(sanctioned - verified) / sanctioned * 100
    if dev_verified > 5:
        flags.append(_flag(
            project_id,
            _severity_from_pct(dev_verified),
            "quantity_mismatch",
            f"Contract sanctions {sanctioned} {unit}, but physical inspection verified only {verified} {unit} — a {dev_verified:.1f}% shortfall.",
            ["Contract.pdf", "InspectionReport.pdf"],
            deviation=round(dev_verified, 1),
        ))

    # Progress vs inspection
    if claimed > 0:
        dev_gap = (claimed - verified) / claimed * 100
        if dev_gap > 10:
            flags.append(_flag(
                project_id,
                _severity_from_pct(dev_gap),
                "evidence_gap",
                f"Progress report claims {claimed} {unit} completed, but inspection only verified {verified} {unit} — a {dev_gap:.1f}% gap between claim and evidence.",
                ["ProgressReport.pdf", "InspectionReport.pdf"],
                deviation=round(dev_gap, 1),
            ))

    return flags


def check_cost_consistency(project_id, contract, boq, invoice, progress):
    sanctioned_cost = contract.get("sanctioned_cost_inr", 0)
    billed = invoice.get("billed_amount_inr", 0)
    pct_complete = progress.get("percent_complete", 0)

    if sanctioned_cost == 0:
        return []

    # Expected cost proportional to completion
    expected = sanctioned_cost * pct_complete / 100
    if expected == 0:
        return []

    dev = abs(billed - expected) / expected * 100
    if dev > 5:
        return [_flag(
            project_id,
            _severity_from_pct(dev),
            "cost_overbill",
            f"Expected cost for {pct_complete}% completion: ₹{expected:,.0f}, but invoice bills ₹{billed:,.0f} — a {dev:.1f}% over/under billing.",
            ["Contract.pdf", "BOQ.pdf", "Invoice.pdf", "ProgressReport.pdf"],
            deviation=round(dev, 1),
        )]
    return []


def check_date_logic(project_id, progress, invoice):
    report_date = progress.get("report_date", "")
    payment_date = invoice.get("payment_date", "")

    if not report_date or not payment_date:
        return []

    # Compare dates (string comparison works for ISO-ish dates)
    if payment_date < report_date:
        return []  # normal: payment after report

    # Check if invoice date is BEFORE progress report
    # In our synthetic data, proj_004 has this: payment before report
    if payment_date > report_date:
        return []  # normal

    return []


def check_date_logic_v2(project_id, progress, invoice):
    """Check if invoice payment date precedes the progress report period."""
    report_str = progress.get("report_date", "") or progress.get("reporting_period", "")
    payment_str = invoice.get("payment_date", "")

    if not report_str or not payment_str:
        return []

    # Try parsing as dates first
    try:
        from datetime import datetime
        for fmt in ["%Y-%m-%d", "%d %B %Y", "%d-%m-%Y"]:
            try:
                report_date = datetime.strptime(report_str.split("T")[0].strip(), fmt)
                payment_date = datetime.strptime(payment_str.split("T")[0].strip(), fmt)
                if payment_date < report_date:
                    return [_flag(
                        project_id, "red", "date_logic",
                        f"Invoice payment date ({payment_str}) precedes the progress report date ({report_str}) — temporal inconsistency.",
                        ["Invoice.pdf", "ProgressReport.pdf"],
                    )]
                return []
            except ValueError:
                continue
    except Exception:
        pass

    # Fallback: string comparison for ISO dates
    if payment_str < report_str:
        return [_flag(
            project_id, "red", "date_logic",
            f"Invoice payment date ({payment_str}) precedes the progress report date ({report_str}) — temporal inconsistency.",
            ["Invoice.pdf", "ProgressReport.pdf"],
        )]

    return []


def check_evidence_completeness(project_id, progress, inspection):
    claimed = progress.get("quantity_completed", 0)
    verified = inspection.get("verified_quantity", 0)

    if claimed == 0:
        return []

    gap_pct = (claimed - verified) / claimed * 100
    if gap_pct > 10:
        return [_flag(
            project_id,
            _severity_from_pct(gap_pct),
            "evidence_gap",
            f"Inspection verified {verified} vs {claimed} claimed — {gap_pct:.1f}% of claimed work lacks physical evidence.",
            ["ProgressReport.pdf", "InspectionReport.pdf"],
            deviation=round(gap_pct, 1),
        )]
    return []


def check_boq_integrity(project_id, boq):
    line_items = boq.get("line_items", [])
    declared_total = boq.get("boq_total_inr", 0)

    if not line_items or declared_total == 0:
        return []

    computed_total = sum(item.get("line_total_inr", 0) for item in line_items)
    if computed_total == 0:
        return []

    dev = abs(computed_total - declared_total) / declared_total * 100
    if dev > 1:
        return [_flag(
            project_id,
            "red",
            "boq_integrity",
            f"BOQ line items sum to ₹{computed_total:,.0f} but declared total is ₹{declared_total:,.0f} — {dev:.1f}% internal inconsistency.",
            ["BOQ.pdf"],
            deviation=round(dev, 1),
        )]
    return []


def run_cross_verification(project_id, extracted):
    contract = extracted.get("contract", {})
    boq = extracted.get("boq", {})
    progress = extracted.get("progress_report", {})
    invoice = extracted.get("invoice", {})
    inspection = extracted.get("inspection_report", {})

    flags = []
    flags.extend(check_quantity_consistency(project_id, contract, progress, inspection))
    flags.extend(check_cost_consistency(project_id, contract, boq, invoice, progress))
    flags.extend(check_date_logic_v2(project_id, progress, invoice))
    flags.extend(check_evidence_completeness(project_id, progress, inspection))
    flags.extend(check_boq_integrity(project_id, boq))

    return flags
