const express = require('express');
const router = express.Router();
const { readJSON } = require('../services/data.service');

// GET /api/quality — full quality report
router.get('/', (req, res) => {
  const DATA_DIR = req.app.locals.DATA_DIR;
  const report = readJSON(DATA_DIR, 'quality_report.json');
  if (!report)
    return res
      .status(404)
      .json({ error: 'No quality report found. Run the quality checker first.' });
  res.json(report);
});

// GET /api/quality/:projectId — quality result for one project
router.get('/:projectId', (req, res) => {
  const DATA_DIR = req.app.locals.DATA_DIR;
  const report = readJSON(DATA_DIR, 'quality_report.json');
  if (!report) return res.status(404).json({ error: 'No quality report found.' });

  const project = report.projects.find((p) => p.project_id === req.params.projectId);
  if (!project) return res.status(404).json({ error: 'Project not found in quality report.' });

  res.json(project);
});

module.exports = router;
