const express = require("express");
const router = express.Router();
const { readJSON } = require("../services/data.service");

// GET /api/flags/:projectId — all flags for a project
router.get("/:projectId", (req, res) => {
  const DATA_DIR = req.app.locals.DATA_DIR;
  const crossFlags = readJSON(DATA_DIR, `verified/${req.params.projectId}_cross_flags.json`) || [];
  const visionFlags = readJSON(DATA_DIR, `verified/${req.params.projectId}_vision_flags.json`) || [];
  const geoFlags = readJSON(DATA_DIR, `verified/${req.params.projectId}_geo_flags.json`) || [];
  const riskReport = readJSON(DATA_DIR, `verified/${req.params.projectId}_report.json`);

  const allFlags = [
    ...crossFlags.map((f) => ({ ...f, source_module: "cross_verification" })),
    ...visionFlags.map((f) => ({ ...f, source_module: "computer_vision" })),
    ...geoFlags.map((f) => ({ ...f, source_module: "geospatial" })),
  ];

  // Add ML anomaly flags if present
  if (riskReport?.ml_anomaly_score > 0.5) {
    allFlags.push({
      flag_id: `${req.params.projectId}_ml_001`,
      project_id: req.params.projectId,
      source_module: "ml_anomaly",
      severity: riskReport.ml_anomaly_score > 0.7 ? "red" : "yellow",
      category: "statistical_outlier",
      message: `This project is a statistical outlier across the portfolio (anomaly score: ${(riskReport.ml_anomaly_score * 100).toFixed(0)}%). Combined metrics suggest unusual patterns.`,
      documents_involved: [],
      photos_involved: [],
      deviation_percent: null,
    });
  }

  res.json({
    project_id: req.params.projectId,
    flags: allFlags,
    risk_score: riskReport?.overall_score ?? null,
    severity_label: riskReport?.severity_label ?? "Not assessed",
  });
});

// GET /api/flags — all flags across all projects (for portfolio view)
router.get("/", (req, res) => {
  const DATA_DIR = req.app.locals.DATA_DIR;
  const projects = readJSON(DATA_DIR, "projects.json");
  if (!projects) return res.status(404).json({ error: "No projects found." });

  const allFlags = [];
  for (const p of projects) {
    const crossFlags = readJSON(DATA_DIR, `verified/${p.project_id}_cross_flags.json`) || [];
    const visionFlags = readJSON(DATA_DIR, `verified/${p.project_id}_vision_flags.json`) || [];
    const geoFlags = readJSON(DATA_DIR, `verified/${p.project_id}_geo_flags.json`) || [];
    allFlags.push(
      ...crossFlags.map((f) => ({ ...f, source_module: "cross_verification" })),
      ...visionFlags.map((f) => ({ ...f, source_module: "computer_vision" })),
      ...geoFlags.map((f) => ({ ...f, source_module: "geospatial" }))
    );
  }

  res.json({ total: allFlags.length, flags: allFlags });
});

module.exports = router;
