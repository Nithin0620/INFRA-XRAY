const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const { setupWebSocket } = require('./routes/websocket');
const projectRoutes = require('./routes/project.routes');
const evidenceRoutes = require('./routes/evidence.routes');
const flagRoutes = require('./routes/flag.routes');
const copilotRoutes = require('./routes/copilot.routes');
const feedbackRoutes = require('./routes/feedback.routes');
const qualityRoutes = require('./routes/quality.routes');
const uploadRoutes = require('./routes/upload.routes');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// Initialize WebSocket
setupWebSocket(server);

// Middleware
app.use(cors());
app.use(express.json());

// Data directory path (shared with scripts)
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
app.locals.DATA_DIR = DATA_DIR;

// Serve static data assets (PDF documents, site photos)
app.use('/data', express.static(DATA_DIR));

// Routes
app.use('/api/projects', projectRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/flags', flagRoutes);
app.use('/api/copilot', copilotRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/quality', qualityRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', '..', 'frontend', 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'frontend', 'dist', 'index.html'));
  });
}

server.listen(PORT, () => {
  console.log(`INFRA-XRAY API & WebSocket running on http://localhost:${PORT}`);
});
