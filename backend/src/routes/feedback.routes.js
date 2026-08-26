const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const { readJSON } = require("../services/data.service");

// POST /api/feedback/:projectId — submit feedback for a flag
router.post("/:projectId", (req, res) => {
  const DATA_DIR = req.app.locals.DATA_DIR;
  const { flag_id, action, note } = req.body;

  if (!flag_id || !action) {
    return res.status(400).json({ error: "flag_id and action are required." });
  }

  const feedbackDir = path.join(DATA_DIR, "feedback");
  fs.mkdirSync(feedbackDir, { recursive: true });

  const feedbackFile = path.join(feedbackDir, `${req.params.projectId}_feedback.json`);
  const existing = fs.existsSync(feedbackFile) ? JSON.parse(fs.readFileSync(feedbackFile, "utf-8")) : [];

  const record = {
    feedback_id: `fb_${Date.now()}`,
    project_id: req.params.projectId,
    flag_id,
    action,
    note: note || "",
    timestamp: new Date().toISOString(),
  };

  existing.push(record);
  fs.writeFileSync(feedbackFile, JSON.stringify(existing, null, 2));

  res.json({ success: true, feedback: record });
});

// GET /api/feedback/:projectId — get all feedback for a project
router.get("/:projectId", (req, res) => {
  const DATA_DIR = req.app.locals.DATA_DIR;
  const feedbackFile = path.join(DATA_DIR, "feedback", `${req.params.projectId}_feedback.json`);

  if (!fs.existsSync(feedbackFile)) {
    return res.json({ project_id: req.params.projectId, feedback: [] });
  }

  const feedback = JSON.parse(fs.readFileSync(feedbackFile, "utf-8"));
  res.json({ project_id: req.params.projectId, feedback });
});

module.exports = router;
