import pytest
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from verification.rules import (
    check_quantity_consistency,
    check_cost_consistency,
    check_date_logic_v2,
    check_boq_integrity,
    check_evidence_completeness,
)
from anomaly.engine import merge_flags, calculate_risk_score


def test_quantity_consistency_flags_deviation():
    contract = {"sanctioned_quantity": 10.0, "unit": "km"}
    progress = {"quantity_completed": 9.0, "unit": "km"}
    inspection = {"verified_quantity": 7.8, "unit": "km"}

    flags = check_quantity_consistency("proj_test", contract, progress, inspection)
    assert len(flags) > 0
    # Should detect discrepancy between claimed 9.0 and verified 7.8
    assert any(f["severity"] == "red" for f in flags)


def test_clean_quantity_consistency():
    contract = {"sanctioned_quantity": 10.0, "unit": "km"}
    progress = {"quantity_completed": 10.0, "unit": "km"}
    inspection = {"verified_quantity": 10.0, "unit": "km"}

    flags = check_quantity_consistency("proj_clean", contract, progress, inspection)
    assert len(flags) == 0


def test_cost_consistency_overbilling():
    contract = {"sanctioned_cost_inr": 100000000}
    boq = {"boq_total_inr": 100000000}
    invoice = {"billed_amount_inr": 125000000} # 25% overrun against 100% completion
    progress = {"percent_complete": 100}

    flags = check_cost_consistency("proj_cost", contract, boq, invoice, progress)
    assert len(flags) == 1
    assert flags[0]["severity"] == "red"
    assert flags[0]["deviation_percent"] == 25.0


def test_date_logic_inconsistency():
    progress = {"report_date": "2024-05-15"}
    invoice = {"payment_date": "2024-03-10"} # Payment before progress report!

    flags = check_date_logic_v2("proj_date", progress, invoice)
    assert len(flags) == 1
    assert flags[0]["severity"] == "red"
    assert flags[0]["category"] == "date_logic"


def test_anomaly_risk_scoring():
    red_flag = {
        "flag_id": "f1",
        "severity": "red",
        "category": "quantity_mismatch",
        "message": "Critical shortfall",
        "documents_involved": ["Contract.pdf"],
        "deviation_percent": 22.0,
    }
    yellow_flag = {
        "flag_id": "f2",
        "severity": "yellow",
        "category": "date_issue",
        "message": "Minor date inconsistency",
        "documents_involved": ["ProgressReport.pdf"],
    }

    result = calculate_risk_score([red_flag, yellow_flag])
    assert result["overall_score"] >= 50
    assert result["severity_label"] in ["Critical", "High"]
    assert result["breakdown"]["red_count"] == 1
    assert result["breakdown"]["yellow_count"] == 1


def test_clean_risk_score():
    result = calculate_risk_score([])
    assert result["overall_score"] == 0
    assert result["severity_label"] == "Low"
