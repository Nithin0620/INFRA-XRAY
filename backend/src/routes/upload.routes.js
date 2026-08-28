const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { readJSON } = require('../services/data.service');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const DATA_DIR = req.app.locals.DATA_DIR;
    const projectId = req.params.id || req.body.project_id;
    const uploadDir = path.join(DATA_DIR, 'uploads', projectId);

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Preserve original filename
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and images allowed.'));
    }
  },
});

// POST /api/projects — create new project
router.post('/', (req, res) => {
  const DATA_DIR = req.app.locals.DATA_DIR;
  const { project_name, state, type, contractor, description, gps_boundary } = req.body;

  if (!project_name || !state || !type) {
    return res.status(400).json({ error: 'project_name, state, and type are required' });
  }

  // Read existing projects
  const projectsPath = path.join(DATA_DIR, 'projects.json');
  let projects = [];
  if (fs.existsSync(projectsPath)) {
    projects = JSON.parse(fs.readFileSync(projectsPath, 'utf-8'));
  }

  // Generate new project ID
  const maxId = projects.reduce((max, p) => {
    const num = parseInt(p.project_id.replace('proj_', ''));
    return num > max ? num : max;
  }, 0);
  const newId = `proj_${String(maxId + 1).padStart(3, '0')}`;

  // Create new project
  const newProject = {
    project_id: newId,
    project_name,
    state,
    type,
    contractor: contractor || 'Unknown',
    description: description || '',
    gps_boundary: gps_boundary || [],
    created_at: new Date().toISOString(),
    status: 'uploaded',
  };

  // Add to projects array
  projects.push(newProject);

  // Save updated projects.json
  fs.writeFileSync(projectsPath, JSON.stringify(projects, null, 2));

  // Create project directories
  const projectDirs = [
    path.join(DATA_DIR, 'raw_docs', newId),
    path.join(DATA_DIR, 'raw_photos', newId),
    path.join(DATA_DIR, 'extracted'),
    path.join(DATA_DIR, 'verified'),
  ];

  projectDirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  res.status(201).json({
    message: 'Project created successfully',
    project_id: newId,
    project: newProject,
  });
});

// POST /api/projects/:id/upload — upload documents
router.post('/:id/upload', upload.array('files', 20), (req, res) => {
  const DATA_DIR = req.app.locals.DATA_DIR;
  const projectId = req.params.id;

  // Check if project exists
  const projects = readJSON(DATA_DIR, 'projects.json');
  const project = projects?.find((p) => p.project_id === projectId);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  // Categorize files
  const pdfs = req.files.filter((f) => f.originalname.toLowerCase().endsWith('.pdf'));
  const photos = req.files.filter((f) => /\.(jpg|jpeg|png|gif)$/i.test(f.originalname));

  // Move files to appropriate directories

  pdfs.forEach((file) => {
    const destPath = path.join(DATA_DIR, 'raw_docs', projectId, file.filename);
    fs.renameSync(file.path, destPath);
  });

  photos.forEach((file) => {
    const destPath = path.join(DATA_DIR, 'raw_photos', projectId, file.filename);
    fs.renameSync(file.path, destPath);
  });

  // Update project status
  const projectsPath = path.join(DATA_DIR, 'projects.json');
  const updatedProjects = projects.map((p) => {
    if (p.project_id === projectId) {
      return { ...p, status: 'uploaded', uploaded_at: new Date().toISOString() };
    }
    return p;
  });
  fs.writeFileSync(projectsPath, JSON.stringify(updatedProjects, null, 2));

  res.json({
    message: 'Files uploaded successfully',
    project_id: projectId,
    files: {
      pdfs: pdfs.map((f) => f.filename),
      photos: photos.map((f) => f.filename),
      total: req.files.length,
    },
  });
});

// POST /api/projects/:id/process — trigger Python pipeline
router.post('/:id/process', (req, res) => {
  const DATA_DIR = req.app.locals.DATA_DIR;
  const projectId = req.params.id;

  // Check if project exists
  const projects = readJSON(DATA_DIR, 'projects.json');
  const project = projects?.find((p) => p.project_id === projectId);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  // Check if files exist
  const docsDir = path.join(DATA_DIR, 'raw_docs', projectId);
  const photosDir = path.join(DATA_DIR, 'raw_photos', projectId);

  const hasDocs = fs.existsSync(docsDir) && fs.readdirSync(docsDir).length > 0;
  const hasPhotos = fs.existsSync(photosDir) && fs.readdirSync(photosDir).length > 0;

  if (!hasDocs && !hasPhotos) {
    return res.status(400).json({ error: 'No documents uploaded for this project' });
  }

  // Update project status to processing
  const projectsPath = path.join(DATA_DIR, 'projects.json');
  const updatedProjects = projects.map((p) => {
    if (p.project_id === projectId) {
      return { ...p, status: 'processing', processed_at: new Date().toISOString() };
    }
    return p;
  });
  fs.writeFileSync(projectsPath, JSON.stringify(updatedProjects, null, 2));

  // Spawn Python pipeline in background
  const { spawn } = require('child_process');
  const pythonDir = path.join(DATA_DIR, '..', 'python-worker');

  // Run quality check first
  const qualityCheck = spawn('python3', ['run_quality_check.py'], {
    cwd: pythonDir,
    env: { ...process.env, PROJECT_ID: projectId },
  });

  qualityCheck.stdout.on('data', (data) => {
    console.log(`Quality check: ${data}`);
  });

  qualityCheck.stderr.on('data', (data) => {
    console.error(`Quality check error: ${data}`);
  });

  qualityCheck.on('close', (code) => {
    console.log(`Quality check exited with code ${code}`);

    // Run extraction
    const extraction = spawn('python3', ['run_extraction.py'], {
      cwd: pythonDir,
      env: { ...process.env, PROJECT_ID: projectId },
    });

    extraction.stdout.on('data', (data) => {
      console.log(`Extraction: ${data}`);
    });

    extraction.stderr.on('data', (data) => {
      console.error(`Extraction error: ${data}`);
    });

    extraction.on('close', (extractionCode) => {
      console.log(`Extraction exited with code ${extractionCode}`);

      // Run verification
      const verification = spawn('python3', ['verification/run_verification.py'], {
        cwd: pythonDir,
        env: { ...process.env, PROJECT_ID: projectId },
      });

      verification.stdout.on('data', (data) => {
        console.log(`Verification: ${data}`);
      });

      verification.stderr.on('data', (data) => {
        console.error(`Verification error: ${data}`);
      });

      verification.on('close', (verifyCode) => {
        console.log(`Verification exited with code ${verifyCode}`);

        // Update project status to completed
        const finalProjects = JSON.parse(fs.readFileSync(projectsPath, 'utf-8'));
        const finalUpdated = finalProjects.map((p) => {
          if (p.project_id === projectId) {
            return { ...p, status: 'completed', completed_at: new Date().toISOString() };
          }
          return p;
        });
        fs.writeFileSync(projectsPath, JSON.stringify(finalUpdated, null, 2));
      });
    });
  });

  res.json({
    message: 'Pipeline started',
    project_id: projectId,
    status: 'processing',
  });
});

// GET /api/projects/:id/status — processing status
router.get('/:id/status', (req, res) => {
  const DATA_DIR = req.app.locals.DATA_DIR;
  const projectId = req.params.id;

  const projects = readJSON(DATA_DIR, 'projects.json');
  const project = projects?.find((p) => p.project_id === projectId);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  // Check what data exists
  const hasExtracted = fs.existsSync(path.join(DATA_DIR, 'extracted', `${projectId}.json`));
  const hasReport = fs.existsSync(path.join(DATA_DIR, 'verified', `${projectId}_report.json`));
  const hasCrossFlags = fs.existsSync(
    path.join(DATA_DIR, 'verified', `${projectId}_cross_flags.json`)
  );

  res.json({
    project_id: projectId,
    status: project.status || 'unknown',
    has_extracted: hasExtracted,
    has_report: hasReport,
    has_cross_flags: hasCrossFlags,
    created_at: project.created_at,
    uploaded_at: project.uploaded_at,
    processed_at: project.processed_at,
    completed_at: project.completed_at,
  });
});

module.exports = router;
