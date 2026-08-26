const express = require("express");
const router = express.Router();
const { readJSON } = require("../services/data.service");

// GET /api/projects — list all projects (summary)
router.get("/", (req, res) => {
  const DATA_DIR = req.app.locals.DATA_DIR;
  const projects = readJSON(DATA_DIR, "projects.json");
  if (!projects) return res.status(404).json({ error: "No projects found. Run data generation first." });

  // Try to enrich with risk scores if available
  const summary = readJSON(DATA_DIR, "verified/summary.json");
  const summaryMap = {};
  if (summary) {
    summary.forEach((s) => { summaryMap[s.project_id] = s; });
  }

  const enriched = projects.map((p) => {
    const risk = summaryMap[p.project_id];
    return {
      ...p,
      risk_score: risk?.overall_score ?? null,
      severity_label: risk?.severity_label ?? "Not assessed",
      red_flags: risk?.breakdown?.red_count ?? 0,
      yellow_flags: risk?.breakdown?.yellow_count ?? 0,
    };
  });

  res.json(enriched);
});

// GET /api/projects/:id — single project detail
router.get("/:id", (req, res) => {
  const DATA_DIR = req.app.locals.DATA_DIR;
  const projects = readJSON(DATA_DIR, "projects.json");
  if (!projects) return res.status(404).json({ error: "No projects found." });

  const project = projects.find((p) => p.project_id === req.params.id);
  if (!project) return res.status(404).json({ error: "Project not found." });

  // Enrich with extracted data, risk report, flags
  const extracted = readJSON(DATA_DIR, `extracted/${req.params.id}.json`);
  const riskReport = readJSON(DATA_DIR, `verified/${req.params.id}_report.json`);
  const crossFlags = readJSON(DATA_DIR, `verified/${req.params.id}_cross_flags.json`);
  const visionFlags = readJSON(DATA_DIR, `verified/${req.params.id}_vision_flags.json`);
  const geoFlags = readJSON(DATA_DIR, `verified/${req.params.id}_geo_flags.json`);

  res.json({
    ...project,
    extracted: extracted || null,
    risk_report: riskReport || null,
    flags: {
      cross_verification: crossFlags || [],
      computer_vision: visionFlags || [],
      geospatial: geoFlags || [],
    },
  });
});

// GET /api/projects/:id/map — project map data
router.get("/:id/map", (req, res) => {
  const DATA_DIR = req.app.locals.DATA_DIR;
  const projects = readJSON(DATA_DIR, "projects.json");
  const project = projects?.find((p) => p.project_id === req.params.id);
  if (!project) return res.status(404).json({ error: "Project not found." });

  const extracted = readJSON(DATA_DIR, `extracted/${req.params.id}.json`);
  const riskReport = readJSON(DATA_DIR, `verified/${req.params.id}_report.json`);

  res.json({
    project_id: req.params.id,
    gps_boundary: project.gps_boundary,
    photos: extracted?.photos || [],
    risk_score: riskReport?.overall_score ?? null,
    severity_label: riskReport?.severity_label ?? "Not assessed",
  });
});

module.exports = router;
