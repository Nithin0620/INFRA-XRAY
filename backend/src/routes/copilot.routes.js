const express = require("express");
const router = express.Router();
const { readJSON } = require("../services/data.service");

// POST /api/copilot/:projectId/checklist — generate inspection checklist
router.post("/:projectId/checklist", (req, res) => {
  const DATA_DIR = req.app.locals.DATA_DIR;
  const riskReport = readJSON(DATA_DIR, `verified/${req.params.projectId}_report.json`);
  const project = (readJSON(DATA_DIR, "projects.json") || []).find(
    (p) => p.project_id === req.params.projectId
  );

  if (!riskReport || !project) {
    return res.status(404).json({ error: "Project data not found. Run the processing pipeline first." });
  }

  // Mock copilot response (Phase 8 will add real Anthropic API call)
  const flags = riskReport.flags || [];
  const redFlags = flags.filter((f) => f.severity === "red");
  const yellowFlags = flags.filter((f) => f.severity === "yellow");

  let sampling_strategy, sampling_explanation;
  if (riskReport.overall_score >= 71) {
    sampling_strategy = "full_reinspection";
    sampling_explanation = "Critical risk score — full physical re-inspection recommended across all flagged areas.";
  } else if (riskReport.overall_score >= 46) {
    sampling_strategy = "sample_check";
    sampling_explanation = `High risk — spot-check ${Math.min(50, redFlags.length * 20 + yellowFlags.length * 10)}% of flagged segments.`;
  } else {
    sampling_strategy = "dashboard_monitoring";
    sampling_explanation = "Low-to-medium risk — continue dashboard monitoring with periodic review.";
  }

  const checklist = flags.map((f) => ({
    item: `Verify: ${f.message}`,
    priority: f.severity === "red" ? "high" : "medium",
    reference: f.documents_involved?.join(", ") || f.photos_involved?.join(", ") || "N/A",
  }));

  res.json({
    project_id: req.params.projectId,
    sampling_strategy,
    sampling_explanation,
    checklist,
  });
});

module.exports = router;
