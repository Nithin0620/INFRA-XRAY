const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const express = require('express');
const cors = require('cors');

const projectRoutes = require('../src/routes/project.routes');
const copilotRoutes = require('../src/routes/copilot.routes');
const flagRoutes = require('../src/routes/flag.routes');
const qualityRoutes = require('../src/routes/quality.routes');
const feedbackRoutes = require('../src/routes/feedback.routes');

describe('INFRA-XRAY Backend API Tests', () => {
  let app;
  let server;
  let baseUrl;

  before(async () => {
    app = express();
    app.use(cors());
    app.use(express.json());

    const DATA_DIR = path.join(__dirname, '..', '..', 'data');
    app.locals.DATA_DIR = DATA_DIR;

    app.use('/api/projects', projectRoutes);
    app.use('/api/copilot', copilotRoutes);
    app.use('/api/flags', flagRoutes);
    app.use('/api/quality', qualityRoutes);
    app.use('/api/feedback', feedbackRoutes);

    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  test('GET /api/health should return ok status', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'ok');
  });

  test('GET /api/projects should return array of enriched projects', async () => {
    const res = await fetch(`${baseUrl}/api/projects`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data));
    assert.ok(data.length > 0);
    const proj2 = data.find((p) => p.project_id === 'proj_002');
    assert.ok(proj2);
    assert.strictEqual(proj2.project_id, 'proj_002');
    assert.ok(proj2.risk_score >= 0);
  });

  test('GET /api/projects/proj_002 should return detailed project info with flags', async () => {
    const res = await fetch(`${baseUrl}/api/projects/proj_002`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.project_id, 'proj_002');
    assert.ok(data.extracted);
    assert.ok(data.flags);
    assert.ok(Array.isArray(data.flags.cross_verification));
  });

  test('POST /api/copilot/proj_002/checklist should generate inspection checklist', async () => {
    const res = await fetch(`${baseUrl}/api/copilot/proj_002/checklist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.project_id, 'proj_002');
    assert.ok(data.sampling_strategy);
    assert.ok(Array.isArray(data.checklist));
    assert.ok(data.checklist.length > 0);
  });

  test('GET /api/quality should return quality check report', async () => {
    const res = await fetch(`${baseUrl}/api/quality`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.summary || data.projects);
  });

  test('POST /api/feedback/proj_002 should record auditor flag feedback', async () => {
    const res = await fetch(`${baseUrl}/api/feedback/proj_002`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        flag_id: 'flag_test_001',
        action: 'confirmed',
        note: 'Auditor verified mismatch on ground',
      }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.feedback.action, 'confirmed');
  });
});
