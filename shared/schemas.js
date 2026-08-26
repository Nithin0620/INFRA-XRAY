// INFRA-XRAY — Shared JSON Schemas
// Every module MUST output data matching these shapes.
// Frontend reads these. Backend writes these. Python worker emits these.

const PROJECT_CATEGORIES = ["road", "building", "bridge", "pipeline"];
const SEVERITY_LEVELS = ["green", "yellow", "red"];
const RISK_BANDS = { low: [0, 20], medium: [21, 45], high: [46, 70], critical: [71, 100] };
const DOC_TYPES = ["contract", "boq", "progress_report", "invoice", "inspection_report"];
const SOURCE_MODULES = ["cross_verification", "computer_vision", "geospatial", "ml_anomaly"];

// --- Project ---
// shape: data/projects.json (array of these)
const ProjectSchema = {
  project_id: "string — e.g. 'proj_001'",
  project_name: "string — e.g. 'Highway Widening NH-48'",
  state: "string — Indian state name",
  category: "string — one of PROJECT_CATEGORIES",
  sanctioned_amount_inr: "number — total contract value in INR",
  sanctioned_quantity: "number — primary metric (km, sqft, etc.)",
  unit: "string — 'km', 'sqft', 'nos'",
  contractor_name: "string",
  tender_id: "string — e.g. 'RJ/NG/2024/0412'",
  gps_boundary: "object — {type: 'LineString'|'Polygon', coordinates: [[lat, lon], ...]}",
  start_date: "string — ISO date",
  deadline: "string — ISO date",
  documents: {
    contract: "string — relative path to contract PDF",
    boq: "string — relative path to BOQ PDF",
    progress_report: "string — relative path to progress report PDF",
    invoice: "string — relative path to invoice PDF",
    inspection_report: "string — relative path to inspection report PDF",
  },
  photo_folder: "string — relative path to photo directory",
};

// --- Document (extracted structured data) ---
const ContractData = {
  project_name: "string",
  tender_id: "string",
  contractor_name: "string",
  sanctioned_quantity: "number",
  unit: "string",
  sanctioned_cost_inr: "number",
  gps_boundary: "object",
  start_date: "string",
  deadline: "string",
};

const BOQData = {
  line_items: [
    { item: "string", unit_rate_inr: "number", quantity: "number", line_total_inr: "number" },
  ],
  boq_total_inr: "number",
};

const ProgressReportData = {
  reporting_period: "string",
  quantity_completed: "number",
  unit: "string",
  percent_complete: "number",
  engineer_name: "string",
  report_date: "string",
};

const InvoiceData = {
  invoice_number: "string",
  billed_quantity: "number",
  unit: "string",
  billed_amount_inr: "number",
  payment_date: "string",
};

const InspectionReportData = {
  inspection_date: "string",
  inspector_name: "string",
  verified_quantity: "number",
  unit: "string",
  gps_track: "[[lat, lon], ...]",
  photo_refs: "[string]",
  condition_remarks: "string",
  risk_comment: "string",
};

// shape: data/extracted/{project_id}.json
const ExtractedData = {
  project_id: "string",
  contract: ContractData,
  boq: BOQData,
  progress_report: ProgressReportData,
  invoice: InvoiceData,
  inspection_report: InspectionReportData,
  photos: [
    { photo_id: "string", gps_lat: "number", gps_lon: "number", timestamp: "string", filepath: "string", condition_tag: "string" },
  ],
  evidence_records: ["EvidenceRecord[]"],
};

// --- Evidence Record ---
// Every downstream module reads these. The core data unit.
const EvidenceRecord = {
  record_id: "string — unique ID",
  project_id: "string",
  claim: "string — what a document asserts",
  source: "string — which document/page/photo",
  evidence: "string — what supports or contradicts",
  location: "{lat, lon} | null",
  timestamp: "string | null",
  doc_type: "string — one of DOC_TYPES",
};

// --- Flag ---
// Emitted by verification, CV, geospatial, and anomaly modules.
// Every flag MUST trace to a source document/photo/GPS point.
const Flag = {
  flag_id: "string — unique ID",
  project_id: "string",
  source_module: "string — one of SOURCE_MODULES",
  severity: "string — one of SEVERITY_LEVELS",
  category: "string — e.g. 'quantity_mismatch', 'cost_overbill', 'date_logic', 'photo_damage', 'route_deviation'",
  message: "string — specific, human-readable explanation",
  documents_involved: "[string] — file paths or doc references",
  photos_involved: "[string] — photo IDs if applicable",
  deviation_percent: "number | null",
  gps_point: "{lat, lon} | null — specific location if applicable",
};

// --- Risk Report ---
// Output of the anomaly engine. One per project.
const RiskReport = {
  project_id: "string",
  overall_score: "number — 0 to 100",
  severity_label: "string — 'Low' | 'Medium' | 'High' | 'Critical'",
  ml_anomaly_score: "number — 0 to 1",
  flags: "Flag[] — all merged flags",
  breakdown: {
    red_count: "number",
    yellow_count: "number",
    green_count: "number",
    ml_contribution: "number",
  },
};

// --- Feedback ---
const FeedbackRecord = {
  feedback_id: "string",
  project_id: "string",
  flag_id: "string",
  action: "string — 'confirmed' | 'false_positive' | 'needs_evidence'",
  note: "string",
  timestamp: "string — ISO",
};

// --- Copilot Response ---
const CopilotResponse = {
  project_id: "string",
  sampling_strategy: "string — 'full_reinspection' | 'sample_check' | 'dashboard_monitoring'",
  sampling_explanation: "string",
  checklist: "[{item: string, priority: string, reference: string}]",
};

// --- Summary (portfolio view) ---
const SummaryEntry = {
  project_id: "string",
  project_name: "string",
  state: "string",
  category: "string",
  sanctioned_amount_inr: "number",
  risk_score: "number",
  severity_label: "string",
  red_flags: "number",
  yellow_flags: "number",
};

module.exports = {
  PROJECT_CATEGORIES,
  SEVERITY_LEVELS,
  RISK_BANDS,
  DOC_TYPES,
  SOURCE_MODULES,
  ProjectSchema,
  EvidenceRecord,
  Flag,
  RiskReport,
  FeedbackRecord,
  CopilotResponse,
  SummaryEntry,
};
