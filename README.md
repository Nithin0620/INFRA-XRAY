# INFRA-XRAY
> **AI-Powered Infrastructure Evidence Verification Platform**

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)]()
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)]()
[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)]()
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)]()

INFRA-XRAY is a comprehensive, AI-powered platform designed to verify infrastructure projects, detect anomalies, and ensure transparency in public works.

*(Insert Demo GIF/Screenshot of Dashboard here)*

## Table of Contents
1. [Problem & Solution](#problem--solution)
2. [Key Features](#key-features)
3. [What Makes INFRA-XRAY Different?](#what-makes-infra-xray-different)
4. [Architecture & Pipeline](#architecture--pipeline)
5. [How It Works (Example Investigation)](#how-it-works-example-investigation)
6. [Risk Scoring](#risk-scoring)
7. [Tech Stack](#tech-stack)
8. [Project Structure](#project-structure)
9. [Setup & Installation](#setup--installation)
10. [Data Architecture](#data-architecture)
11. [Testing](#testing)
12. [Limitations & Roadmap](#limitations--roadmap)
13. [Security & Privacy](#security--privacy)
14. [Contributing & License](#contributing--license)

---

## Problem & Solution

### 🔴 The Problem
Infrastructure evidence is highly fragmented across paper contracts, PDF invoices, handwritten inspection reports, disjointed site photos, and unverified GPS data. Manually cross-verifying these sources for thousands of projects is nearly impossible, error-prone, and slow, creating loopholes for fraud, overbilling, and delayed timelines.

### 🟢 The Solution
INFRA-XRAY automates this by combining multiple evidence sources into a single, unified verification pipeline. By employing AI for unstructured document extraction alongside deterministic rules for financial and geospatial cross-checking, INFRA-XRAY surfaces actionable discrepancies and calculates risk scores instantly.

## Key Features

*   **Multimodal Document Extraction:** Parses Contracts, BOQs, Invoices, and Inspection Reports using LLMs or regex fallbacks.
*   **Automated Cross-Verification:** Validates claimed progress against verified quantities and financial billing.
*   **Geospatial Verification:** Confirms GPS coordinates from photos and reports fall within contracted project boundaries.
*   **Computer Vision Integration:** Detects damage or anomalies in site photos.
*   **Explainable Risk Scoring (0-100):** Aggregates detected red and yellow flags into a single priority score.
*   **Evidence Traceability:** Every anomaly links directly back to the source document or image that generated it.
*   **AI Copilot:** Generates dynamic, context-aware physical inspection checklists for field auditors based on current project anomalies.

## What Makes INFRA-XRAY Different?
*   **Deterministic + AI:** We don't rely purely on LLM "vibes." We use AI to extract data, but hard logic (math, geofencing) to verify it.
*   **Source-Level Traceability:** Trust is paramount for auditing. Every flagged issue points back to a specific line item in a specific PDF.
*   **Explainable Risk:** A clear breakdown of why a project scored a 95/100 risk, not just a black-box decision.

## Architecture & Pipeline

### System Architecture
```text
[ Raw Evidence: PDFs, JPGs, GPS ]
          │
          ▼
[ Phase 1: Python Data Quality Checker ]
          │
          ▼
[ Phase 2: AI Document Extractor (Claude/Regex) ] ---> (Structured JSON)
          │
          ▼
[ Phase 3: Verification Modules ]
  ├─ Cross-Verification (Math/Logic)
  ├─ Computer Vision (Damage)
  └─ Geospatial (Boundaries)
          │
          ▼
[ Phase 4: Anomaly Engine & Risk Scorer ] ---> (Flags & Scores)
          │
          ▼
[ Node.js/Express API Backend ]
          │
          ▼
[ React/Vite Frontend Dashboard ]
```

## How It Works (Example Investigation)
Consider **Project 002 (Rural Road)**:
1.  **Contract:** States the sanctioned road length is **10 km**.
2.  **Progress Report:** Contractor claims **9 km** is complete.
3.  **Invoice:** Contractor bills for **9 km**.
4.  **Inspection Report / Site Photos:** Field inspector verifies only **7.8 km** is paved.

**INFRA-XRAY Action:** The Verification Pipeline catches the 1.2 km discrepancy. The Anomaly Engine generates a **Critical Red Flag (22% shortfall)** and adjusts the project's overall Risk Score to 100/100, prioritizing it on the dashboard.

## Risk Scoring

Individual anomalies contribute to the final 0–100 project risk score.

| Severity | Weight | Example Anomaly |
| :--- | :--- | :--- |
| **Critical** | 50 points | 22% shortfall in verified vs. claimed quantity. |
| **High** | 30 points | Billed amount exceeds sanctioned budget limit. |
| **Medium** | 15 points | GPS coordinates fall outside project boundary. |
| **Low** | 5 points | Minor date inconsistency in progress reports. |

## Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React, Vite, Tailwind CSS | High-performance SPA dashboard and UI styling. |
| **Data Viz** | Recharts, React-Leaflet | Graphing risk metrics and visualizing geospatial project boundaries. |
| **Backend** | Node.js, Express.js | Lightweight API server connecting the frontend to the data pipeline. |
| **AI/Worker** | Python 3 | Heavy lifting for file parsing, extraction, and anomaly logic. |
| **Extraction** | Anthropic Claude API | Intelligent parsing of unstructured PDFs. |

*Engineering Decision:* Node.js was chosen for the API for its fast, non-blocking I/O (ideal for a dashboard), while Python was chosen for the worker due to its superior ecosystem for data processing, PDF parsing, and ML integrations.

## Project Structure
```text
INFRA-XRAY/
├── frontend/                 # React UI, Components, Pages
├── backend/                  # Express API, Routes, Services
├── python-worker/            # The Verification Pipeline Engine
│   ├── verification/         # Deterministic cross-checks
│   ├── vision/               # Image processing checks
│   ├── geospatial/           # GPS/Boundary logic
│   └── anomaly/              # Risk scoring engine
├── scripts/                  # Synthetic data generation
└── data/                     # Generated PDFs, JSON schemas, Flags
```

## Setup & Installation

### Quick Start
```bash
# 1. Clone the repository
git clone https://github.com/your-username/INFRA-XRAY.git
cd INFRA-XRAY

# 2. Configure Environment (Copy example and add API key if using Claude)
cp .env.example .env

# 3. Install ALL dependencies
pnpm run setup

# 4. Generate synthetic PDFs and photos
pnpm run generate-data

# 5. Run the Python Verification Pipeline
cd python-worker
# Activate your venv here, then run:
pip install -r requirements.txt
python run_quality_check.py
python run_extraction.py
python verification/run_verification.py
python vision/run_vision_check.py
python geospatial/run_geo_check.py
python anomaly/run_anomaly_engine.py
cd ..

# 6. Start the Application
pnpm run dev
```
*Frontend runs on `http://localhost:5173`, Backend runs on `http://localhost:3001`.*

## Data Architecture
INFRA-XRAY currently uses a file-based JSON schema in the `data/` directory to act as a database, facilitating easy setup without external dependencies.
*   `projects.json`: Core project metadata (Foreign key target).
*   `extracted/{id}.json`: The structured data pulled from PDFs.
*   `{id}_flags.json`: The specific anomalies found.
*   `{id}_report.json`: The aggregated risk score.

*Migration Path:* This structure is designed to be easily migrated to **PostgreSQL**, where `projects` would be a table, and extracted data/flags would live in relational tables with foreign keys linking back to the specific evidence documents (stored in S3).

## Testing
Currently, the system is designed as a proof-of-concept.
To manually verify the pipeline:
1. Run `python run_quality_check.py` to ensure all generated test PDFs are valid.
2. Check `data/anomaly/summary.json` to verify that `proj_002` correctly received a high risk score based on the synthetic mismatch injected.

*(Future Roadmap includes Jest for Frontend/Backend unit tests and PyTest for pipeline deterministic logic).*

## Limitations & Roadmap

### Limitations
*   Currently uses synthetic data generated via `pdfkit`.
*   File-based JSON storage is not scalable for production concurrency.
*   Computer Vision currently relies on metadata/mock flags rather than a full deep-learning classification model.

### Roadmap
*   **Q3:** Implement PostgreSQL and Prisma ORM.
*   **Q3:** Add Authentication and Role-Based Access Control (RBAC).
*   **Q4:** Integrate real-world infrastructure datasets.
*   **Q4:** Upgrade computer vision with a custom-trained YOLO model for damage detection.

## Security & Privacy
Since infrastructure data can be sensitive, future production iterations must implement:
*   End-to-end encryption for uploaded Contracts/Invoices.
*   Secure secrets management for API keys (currently local `.env`).
*   Audit logs detailing who viewed which project's evidence.

## Contributing & License
**Contributing:** We welcome PRs! Please create a branch off `main`, ensure the python pipeline runs successfully against your changes, and submit a PR for review.
**License:** MIT License. See `LICENSE` for details.

---
**Credits:** Created by [Jules] - AI Engineer.
