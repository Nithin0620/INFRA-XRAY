const fs = require('fs');
const path = require('path');

// Helper to read JSON data files
function readJSON(DATA_DIR, filepath) {
  const fullPath = path.join(DATA_DIR, filepath);
  if (!fs.existsSync(fullPath)) return null;
  return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
}

module.exports = { readJSON };
