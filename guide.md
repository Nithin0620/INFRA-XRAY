# INFRA-XRAY — Complete Setup & Run Guide

## What is INFRA-XRAY?

An AI-powered infrastructure verification platform that cross-checks government project documents (contracts, BOQs, progress reports, invoices, inspection reports) and site photos to detect mismatches between claimed work, paid work, and actual evidence.

Every alert traces back to a specific document, photo, or GPS point.

---

## Prerequisites

- **Node.js** v18+ (`node --version`)
- **Python** 3.12+ (`python3 --version`)
- **npm** (comes with Node.js)
- Optional: Anthropic API key (for LLM-powered extraction; regex fallback works without it)

---

## Quick Start (Full Pipeline)

```bash
# Clone/navigate to project
cd /home/nithin/Projects/INFRA-XRAY

# 1. Generate synthetic data (30 PDFs + 22 photos)
cd scripts && npm install && node generate_synthetic_data.js && cd ..

# 2. Set up Python environment
cd python-worker
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cd ..

# 3. Run full pipeline
cd python-worker
.venv/bin/python run_quality_check.py
.venv/bin/python run_extraction.py
.venv/bin/python verification/run_verification.py
.venv/bin/python vision/run_vision_check.py
.venv/bin/python geospatial/run_geo_check.py
.venv/bin/python anomaly/run_anomaly_engine.py
cd ..

# 4. Start servers (2 terminals)
# Terminal 1:
cd backend && npm install && npm run dev

# Terminal 2:
cd frontend && npm install && npm run dev
```

Open **http://localhost:5173**

---

## Step-by-Step Explanation

### Step 1: Generate Synthetic Data

```bash
cd scripts
npm install
node generate_synthetic_data.js
```

**What it does:** Creates 6 fictional Indian infrastructure projects with realistic PDF documents.

**Output:**
```
data/
├── projects.json           # Master index of all 6 projects
├── ground_truth.json       # Hidden reference (for demo narration)
├── raw_docs/
│   ├── proj_001/           # 5 PDFs per project
│   │   ├── Contract.pdf
│   │   ├── BOQ.pdf
│   │   ├── ProgressReport.pdf
│   │   ├── Invoice.pdf
│   │   └── InspectionReport.pdf
│   ├── proj_002/
│   └── ... (6 projects × 5 PDFs = 30 PDFs)
└── raw_photos/
    ├── proj_001/           # 3-4 photos per project
    │   ├── IMG_2041.jpg
    │   ├── IMG_2042.jpg
    │   ├── photos_meta.json
    │   └── ...
    └── ... (22 photos total)
```

**The 6 Projects:**

| ID | Project | State | Type | Intended Finding |
|----|---------|-------|------|-----------------|
| proj_001 | Highway Widening NH-48 | Rajasthan | road | ALL CLEAN |
| proj_002 | Rural Road PMGSY | Bihar | road | MAJOR MISMATCH (22% shortfall) |
| proj_003 | School Building | MP | building | COST OVERBILLING (18%) |
| proj_004 | Bridge over Mahanadi | Odisha | bridge | DATE INCONSISTENCY |
| proj_005 | Water Pipeline | UP | pipeline | MODERATE MISMATCH (400m deviation) |
| proj_006 | Govt Office Building | Punjab | building | CLEAN |

---

### Step 2: Data Quality Check

```bash
cd python-worker
.venv/bin/python run_quality_check.py
```

**What it does:** Validates every file before extraction runs.

**Checks:**
- PDFs: opens without error, has extractable text
- Photos: valid image format, has GPS/timestamp metadata
- Duplicates: MD5 hash detection within each project
- Format mismatches: file extension vs actual content

**Output:** `data/quality_report.json`

**Expected result:**
```
Total: 52 files | 52 OK | 0 warnings | 0 errors | All ready: YES
```

---

### Step 3: Document Extraction

```bash
.venv/bin/python run_extraction.py
```

**What it does:** Reads each PDF, extracts structured data, generates Evidence Records.

**Two modes:**
- **With Anthropic API key:** Sends text to Claude, gets structured JSON
- **Without API key (demo mode):** Regex parser for synthetic PDFs

**Extracts 5 document types:**
- Contract → project name, sanctioned quantity, cost, GPS boundary
- BOQ → line items with unit rates and quantities
- Progress Report → claimed completion percentage
- Invoice → billed amount, payment date
- Inspection Report → verified quantity, GPS track, photo references

**Output:** `data/extracted/{project_id}.json` (6 files)

**Sample output (proj_002 — Bihar mismatch):**
```json
{
  "contract": {"sanctioned_quantity": 10.0, "unit": "km"},
  "progress_report": {"quantity_completed": 9.0, "percent_complete": 90.0},
  "invoice": {"billed_quantity": 9.0, "billed_amount_inr": 175000000},
  "inspection_report": {"verified_quantity": 7.8, "unit": "km"},
  "evidence_records": [...]
}
```

---

### Step 4: Verification Pipeline (Phases 4-7)

Run all four verification modules:

```bash
# Cross-verification (rule-based checks)
.venv/bin/python verification/run_verification.py

# Computer vision (photo damage detection)
.venv/bin/python vision/run_vision_check.py

# Geospatial (GPS route/boundary checks)
.venv/bin/python geospatial/run_geo_check.py

# Anomaly engine (merge flags + risk scoring)
.venv/bin/python anomaly/run_anomaly_engine.py
```

**What each does:**

| Module | Checks | Output |
|--------|--------|--------|
| Cross-Verification | Quantity consistency, cost consistency, date logic, evidence completeness, BOQ integrity | `{id}_cross_flags.json` |
| Computer Vision | Photo damage classification, evidence contradiction | `{id}_vision_flags.json` |
| Geospatial | Boundary containment, route alignment, photo geotags | `{id}_geo_flags.json` |
| Anomaly Engine | Merges all flags, computes risk score 0-100 | `{id}_report.json` + `summary.json` |

**Expected results:**

| Project | Risk Score | Severity | Red Flags | Yellow Flags |
|---------|-----------|----------|-----------|--------------|
| proj_002 (Bihar) | 100 | Critical | 4 | 1 |
| proj_004 (Odisha) | 100 | Critical | 3 | 0 |
| proj_005 (UP) | 100 | Critical | 2 | 0 |
| proj_003 (MP) | 72 | Critical | 1 | 1 |
| proj_001 (Rajasthan) | 1 | Low | 0 | 0 |
| proj_006 (Punjab) | 1 | Low | 0 | 0 |

---

### Step 5: Backend API

```bash
cd ../backend
npm install
npm run dev
```

**Runs on:** `http://localhost:3001`

**API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/health | Health check |
| GET | /api/projects | List all projects with risk scores |
| GET | /api/projects/:id | Project detail + extracted data + flags |
| GET | /api/projects/:id/map | Map data for a project |
| GET | /api/evidence/:projectId | Evidence records |
| GET | /api/flags/:projectId | All flags for a project |
| GET | /api/flags | Portfolio-level all flags |
| GET | /api/quality | Full quality report |
| GET | /api/quality/:projectId | Quality result for one project |
| POST | /api/copilot/:projectId/checklist | Generate inspection checklist |
| POST | /api/feedback/:projectId | Submit flag feedback |
| GET | /api/feedback/:projectId | Get feedback for a project |

**Test it:**
```bash
curl http://localhost:3001/api/projects | python3 -m json.tool
curl http://localhost:3001/api/projects/proj_002 | python3 -m json.tool
```

---

### Step 6: Frontend

```bash
cd ../frontend
npm install
npm run dev
```

**Runs on:** `http://localhost:5173`

**Pages:**
- **Dashboard** — Sortable project table, metrics cards (total projects, flagged count, total value, avg risk)
- **Project Detail** — Evidence timeline funnel, flags with severity badges, risk gauge, AI copilot section
- **Map View** — Geographic overview with project sidebar
- **About** — Full pipeline visualization, tech stack, roadmap

---

## Triggering the Pipeline from UI

Currently the pipeline runs from the command line. To trigger it from the UI, you would need to add a `POST /api/pipeline/run` endpoint to the Express server that spawns the Python scripts.

**For the hackathon demo:** Pre-run the pipeline before the demo. The UI just displays the pre-computed results. This is more reliable and avoids API key issues during the live demo.

**If you want UI-triggered pipeline (Phase 9):** Add this endpoint to `backend/src/server.js`:

```javascript
const { execSync } = require("child_process");

app.post("/api/pipeline/run", (req, res) => {
  const workerDir = path.join(__dirname, "..", "..", "python-worker");
  try {
    execSync(`${workerDir}/.venv/bin/python run_quality_check.py`, { cwd: workerDir });
    execSync(`${workerDir}/.venv/bin/python run_extraction.py`, { cwd: workerDir });
    execSync(`${workerDir}/.venv/bin/python verification/run_verification.py`, { cwd: workerDir });
    execSync(`${workerDir}/.venb/bin/python vision/run_vision_check.py`, { cwd: workerDir });
    execSync(`${workerDir}/.venv/bin/python geospatial/run_geo_check.py`, { cwd: workerDir });
    execSync(`${workerDir}/.venv/bin/python anomaly/run_anomaly_engine.py`, { cwd: workerDir });
    res.json({ success: true, message: "Pipeline completed" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
```

---

## Environment Variables

Create `.env` in project root:

```
ANTHROPIC_API_KEY=your_key_here    # Optional: enables LLM extraction
PORT=3001                          # Backend port
NODE_ENV=development
```

Without `ANTHROPIC_API_KEY`, extraction uses regex fallback (works for demo).

---

## Project Structure

```
INFRA-XRAY/
├── frontend/                 React + Vite + Tailwind
│   ├── src/
│   │   ├── components/       Layout, RiskGauge, FlagCard
│   │   ├── pages/            Dashboard, ProjectDetail, MapView, About
│   │   ├── services/         api.js (Axios client)
│   │   └── lib/              utils.js (formatINR, severityColor)
│   └── package.json
├── backend/                  Express API server
│   ├── src/
│   │   ├── server.js         Main server
│   │   ├── routes/           6 route files
│   │   └── services/         data.service.js
│   └── package.json
├── shared/                   JSON schemas (contract)
│   └── schemas.js
├── scripts/                  Data generation
│   └── generate_synthetic_data.js
├── python-worker/            AI/ML/Geo processing
│   ├── quality_checker.py    Phase 2
│   ├── pdf_reader.py         Phase 3
│   ├── llm_extractor.py      Phase 3
│   ├── photo_metadata.py     Phase 3
│   ├── evidence_model.py     Phase 3
│   ├── run_extraction.py     Phase 3
│   ├── verification/         Phase 4
│   ├── vision/               Phase 5
│   ├── geospatial/           Phase 6
│   ├── anomaly/              Phase 7
│   └── requirements.txt
├── data/                     Generated + processed data
├── PLAN.md                   Build progress tracker
├── guide.md                  This file
└── .env                      Secrets (not committed)
```

---

## Troubleshooting

**"No projects found" error:**
Run the data generator first: `node scripts/generate_synthetic_data.js`

**"No extracted data" error:**
Run extraction first: `cd python-worker && .venv/bin/python run_extraction.py`

**Port 3001 already in use:**
Kill existing process: `kill $(lsof -t -i:3001)`

**Python module not found:**
Ensure venv is activated: `cd python-worker && .venv/bin/python <script>`

**Frontend shows "Not processed":**
Run the full pipeline (Steps 1-4) before starting the frontend.

---

## Demo Script (For Hackathon Judges)

1. Show Dashboard — 6 projects, risk scores visible
2. Click proj_002 (Bihar) — flagship mismatch case
3. Show evidence funnel: Contract 10km → Progress 9km → Invoice ₹17.5Cr → Inspection 7.8km
4. Show flags: 22% shortfall, cost mismatch, date issues
5. Show risk gauge: 100/100 Critical
6. Click "Generate Inspection Checklist" — AI copilot response
7. Mark a flag as "Confirmed" — feedback loop demo
8. Show Map View — geographic overview
9. Show About page — full pipeline visualization
10. Mention: "Every flag traces to a specific document or GPS point"
