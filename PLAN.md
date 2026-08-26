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
| 2 | Data Quality Checker | ⬜ TODO | Python worker for ingestion validation |
| 3 | Document Extraction Pipeline | ⬜ TODO | pdfplumber + Anthropic LLM extraction |
| 4 | Cross-Verification Engine | ⬜ TODO | Rule-based flag checks (parallel with 5,6) |
| 5 | Computer Vision Module | ⬜ TODO | Heuristic damage detection placeholder (parallel) |
| 6 | Geospatial Verification | ⬜ TODO | GPS route/boundary checks (parallel) |
| 7 | Anomaly Engine + Risk Scoring | ⬜ TODO | IsolationForest + unified scoring |
| 8 | React UI Polish + Leaflet + React Flow | ⬜ TODO | Full interactive maps, evidence graph, animations |
| 9 | AI Copilot + Feedback + Demo Polish | ⬜ TODO | Anthropic copilot, feedback loop, final UI |

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

## The 6 Projects

| ID | Project | State | Type | Intended Finding |
|----|---------|-------|------|-----------------|
| proj_001 | Highway Widening NH-48 | Rajasthan | road | ALL CLEAN |
| proj_002 | Rural Road PMGSY | Bihar | road | MAJOR MISMATCH (flagship demo) |
| proj_003 | School Building | MP | building | COST OVERBILLING (18%) |
| proj_004 | Bridge over Mahanadi | Odisha | bridge | DATE INCONSISTENCY |
| proj_005 | Water Pipeline | UP | pipeline | MODERATE MISMATCH (400m deviation) |
| proj_006 | Govt Office Building | Punjab | building | CLEAN |
