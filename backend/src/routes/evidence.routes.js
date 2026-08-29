const express = require('express');
const router = express.Router();
const { readJSON } = require('../services/data.service');

// GET /api/evidence/:projectId — evidence records for a project
router.get('/:projectId', (req, res) => {
  const DATA_DIR = req.app.locals.DATA_DIR;
  const extracted = readJSON(DATA_DIR, `extracted/${req.params.projectId}.json`);
  if (!extracted)
    return res.status(404).json({ error: 'No extracted data found for this project.' });

  res.json({
    project_id: req.params.projectId,
    evidence_records: extracted.evidence_records || [],
    documents: {
      contract: extracted.contract || null,
      boq: extracted.boq || null,
      progress_report: extracted.progress_report || null,
      invoice: extracted.invoice || null,
      inspection_report: extracted.inspection_report || null,
    },
    photos: extracted.photos || [],
  });
});

module.exports = router;
