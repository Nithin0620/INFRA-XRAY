# INFRA-XRAY — Build Plan

## Architecture

```
React (Vite + Tailwind)  →  Express API  →  Data files (JSON)
                                    ↓
                              Python Worker (Phase 3+)
                              CV / ML / Geo / Extraction
```

## Phase Progress

| Phase | Name | Status | Notes |
|-------|------|--------|-------|
| 1 | Foundation + Scaffold + Synthetic Data | ✅ DONE | Express API, React UI, data generator |
| 2 | Data Quality Checker | ✅ DONE | Python: pdfplumber + Pillow validation, quality_report.json, /api/quality |
| 3 | Document Extraction Pipeline | ✅ DONE | pdfplumber + regex fallback + Anthropic LLM, Evidence Records |
| 4 | Cross-Verification Engine | ✅ DONE | Rule-based: quantity, cost, date, evidence, BOQ checks |
| 5 | Computer Vision Module | ✅ DONE | Heuristic damage classifier (OpenCV + Pillow fallback) |
| 6 | Geospatial Verification | ✅ DONE | GPS boundary/route checks |
| 7 | Anomaly Engine + Risk Scoring | ✅ DONE | Flag merge + weighted scoring 0-100 |
| 8 | React UI Polish + Leaflet + React Flow | ✅ DONE | Full interactive React-Leaflet map, React Flow evidence graph, Recharts |
| 9 | AI Copilot + Feedback + Demo Polish | ✅ DONE | Anthropic Claude Copilot + contextual fallback, WebSocket pipeline streaming, test suites |


## Key Decisions

- **React + Express** instead of Python/Streamlit (UI quality upgrade)
- **Python worker** for heavy AI/ML (CV, extraction, anomaly) — keeps Node.js lean
- **Shared JSON schemas** in `shared/schemas.js` — frontend/backend contract
- **Dark theme** with glassmorphism cards, Framer Motion animations
- **Phase 8** is the big UI upgrade: Leaflet maps, React Flow evidence graph, Recharts

## Running

```bash
# Generate synthetic data
cd scripts && npm install && node generate_synthetic_data.js

# Run quality check (Python)
cd python-worker && python -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python run_quality_check.py

# Run document extraction (Python)
cd python-worker && .venv/bin/python run_extraction.py

# Run verification pipeline (Phases 4-7)
cd python-worker && .venv/bin/python verification/run_verification.py
.venv/bin/python vision/run_vision_check.py
.venv/bin/python geospatial/run_geo_check.py
.venv/bin/python anomaly/run_anomaly_engine.py

# Backend
cd backend && npm install && npm run dev

# Frontend
cd frontend && npm install && npm run dev
```

## File Structure

```
INFRA-XRAY/
├── frontend/          React + Vite + Tailwind
├── backend/           Express API server
├── shared/            JSON schemas (contract)
├── scripts/           Data generation scripts
├── python-worker/     AI/ML/Geo processing (Phase 2+)
│   ├── quality_checker.py    File validation module
│   ├── run_quality_check.py  Orchestrator → quality_report.json
│   ├── pdf_reader.py         PDF text extraction (pdfplumber)
│   ├── llm_extractor.py      Anthropic LLM + regex fallback parser
│   ├── photo_metadata.py     Photo sidecar reader
│   ├── evidence_model.py     Evidence Record generator
│   ├── run_extraction.py     Orchestrator → data/extracted/{id}.json
│   ├── verification/
│   │   ├── rules.py              Cross-verification rule engine
│   │   └── run_verification.py   → data/verified/{id}_cross_flags.json
│   ├── vision/
│   │   ├── damage_detector.py    Heuristic CV damage classifier
│   │   └── run_vision_check.py   → data/verified/{id}_vision_flags.json
│   ├── geospatial/
│   │   ├── geo_checks.py         GPS boundary/route checks
│   │   └── run_geo_check.py      → data/verified/{id}_geo_flags.json
│   ├── anomaly/
│   │   ├── engine.py             Flag merge + risk scoring
│   │   └── run_anomaly_engine.py → data/verified/{id}_report.json + summary.json
│   ├── requirements.txt      pdfplumber, Pillow, anthropic
│   └── .venv/                Python virtual environment
├── data/              Generated data (raw_docs, raw_photos, extracted, verified, feedback)
├── PLAN.md            This file
└── .env               Secrets (not committed)
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/projects | List all projects with risk scores |
| GET | /api/projects/:id | Project detail + extracted data + flags |
| GET | /api/projects/:id/map | Map data for a project |
| GET | /api/evidence/:projectId | Evidence records |
| GET | /api/flags/:projectId | All flags for a project |
| GET | /api/flags | Portfolio-level all flags |
| POST | /api/copilot/:projectId/checklist | Generate inspection checklist |
| POST | /api/feedback/:projectId | Submit flag feedback |
| GET | /api/feedback/:projectId | Get feedback for a project |
| GET | /api/quality | Full quality report (all projects) |
| GET | /api/quality/:projectId | Quality result for one project |

## The 6 Projects

| ID | Project | State | Type | Intended Finding |
|----|---------|-------|------|-----------------|
| proj_001 | Highway Widening NH-48 | Rajasthan | road | ALL CLEAN |
| proj_002 | Rural Road PMGSY | Bihar | road | MAJOR MISMATCH (flagship demo) |
| proj_003 | School Building | MP | building | COST OVERBILLING (18%) |
| proj_004 | Bridge over Mahanadi | Odisha | bridge | DATE INCONSISTENCY |
| proj_005 | Water Pipeline | UP | pipeline | MODERATE MISMATCH (400m deviation) |
| proj_006 | Govt Office Building | Punjab | building | CLEAN |
