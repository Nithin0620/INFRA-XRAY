import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { FadeUp, Stagger, Item, CINEMATIC } from '../lib/motion';
import {
  Upload,
  FileText,
  Image,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  ArrowRight,
} from 'lucide-react';
import axios from 'axios';
import { BASE_URL, WS_BASE_URL } from '../services/api';

const API = BASE_URL;

const PROJECT_TYPES = ['road', 'bridge', 'building', 'pipeline', 'dam', 'other'];
const STATES = [
  'Andhra Pradesh',
  'Bihar',
  'Chhattisgarh',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Tamil Nadu',
  'Telangana',
  'Uttar Pradesh',
  'West Bengal',
];

export default function UploadPage() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  // Step tracking
  const [step, setStep] = useState(1); // 1: Create project, 2: Upload files, 3: Processing
  const [dir, setDir] = useState(1);

  const go = (next) => {
    setDir(next > step ? 1 : -1);
    setStep(next);
  };

  const stepVariants = {
    enter: (d) => ({ opacity: 0, x: reduce ? 40 : d * 60, scale: 0.985 }),
    center: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: { duration: 0.45, ease: CINEMATIC },
    },
    exit: (d) => ({
      opacity: 0,
      x: reduce ? -40 : d * -60,
      scale: 0.985,
      transition: { duration: 0.3, ease: CINEMATIC },
    }),
  };

  // Project form
  const [projectName, setProjectName] = useState('');
  const [projectType, setProjectType] = useState('road');
  const [state, setState] = useState('Maharashtra');
  const [contractor, setContractor] = useState('');
  const [description, setDescription] = useState('');

  // File upload
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  // Processing
  const [projectId, setProjectId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  // Handle drag events
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...droppedFiles]);
  }, []);

  // Handle file input
  const handleFileInput = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  // Remove file
  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Create project
  const createProject = async () => {
    if (!projectName.trim()) {
      setError('Project name is required');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const response = await axios.post(`${API}/upload`, {
        project_name: projectName,
        type: projectType,
        state,
        contractor,
        description,
      });

      setProjectId(response.data.project_id);
      go(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project');
    } finally {
      setUploading(false);
    }
  };

  // Upload files
  const uploadFiles = async () => {
    if (files.length === 0) {
      setError('Please select files to upload');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      await axios.post(`${API}/upload/${projectId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      go(3);
      startProcessing();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  // Pipeline detailed progress state
  const [pipelineStep, setPipelineStep] = useState(0);
  const [pipelineTotalSteps, setPipelineTotalSteps] = useState(6);
  const [pipelineStage, setPipelineStage] = useState('');
  const [pipelineLogs, setPipelineLogs] = useState([]);

  // Start processing pipeline
  const startProcessing = async () => {
    setProcessing(true);
    setStatus('Initializing pipeline...');
    setPipelineStep(0);
    setPipelineLogs([]);

    // Connect to WebSocket for live event streaming
    let ws;
    try {
      ws = new WebSocket(WS_BASE_URL);
      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'subscribe', projectId }));
      };
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'pipeline_progress' && data.projectId === projectId) {
            if (data.stage) setPipelineStage(data.stage);
            if (data.step) setPipelineStep(data.step);
            if (data.totalSteps) setPipelineTotalSteps(data.totalSteps);
            if (data.message) setStatus(data.message);
            if (data.log) {
              setPipelineLogs((prev) => [...prev.slice(-30), data.log]);
            }
            if (data.status === 'completed') {
              setStatus('All verification stages complete!');
              setProcessing(false);
              setTimeout(() => {
                navigate(`/project/${projectId}`);
              }, 1500);
            }
          }
        } catch (e) {
          console.error('Error handling WS message:', e);
        }
      };
    } catch (wsErr) {
      console.warn('WebSocket connection failed, falling back to polling:', wsErr);
    }

    try {
      await axios.post(`${API}/upload/${projectId}/process`);

      // Fallback Polling in case WebSocket is closed or blocked
      const pollInterval = setInterval(async () => {
        try {
          const response = await axios.get(`${API}/upload/${projectId}/status`);
          const projectStatus = response.data.status;

          if (projectStatus === 'completed') {
            clearInterval(pollInterval);
            if (ws && ws.readyState === WebSocket.OPEN) ws.close();
            setStatus('Processing complete!');
            setProcessing(false);
            setTimeout(() => {
              navigate(`/project/${projectId}`);
            }, 1500);
          } else if (projectStatus === 'failed') {
            clearInterval(pollInterval);
            if (ws && ws.readyState === WebSocket.OPEN) ws.close();
            setStatus('Processing failed. Please try again.');
            setProcessing(false);
          }
        } catch (err) {
          console.error('Status check failed:', err);
        }
      }, 3000);
    } catch (err) {
      setError('Failed to start processing');
      setProcessing(false);
    }
  };

  return (
    <div className="page-container max-w-4xl mx-auto">
      {/* Header */}
      <FadeUp className="mb-8" amount={0.1}>
        <h1 className="text-3xl font-bold tracking-tight">
          Upload <span className="text-brand-400">Documents</span>
        </h1>
        <p className="text-brand-muted mt-1">
          Upload infrastructure project documents for AI-powered verification
        </p>
      </FadeUp>

      {/* Step Indicator */}
      <Stagger className="flex items-center gap-4 mb-8" gap={0.15} amount={0.1}>
        {[
          { num: 1, label: 'Create Project' },
          { num: 2, label: 'Upload Files' },
          { num: 3, label: 'Process' },
        ].map(({ num, label }) => (
          <Item key={num} className="flex items-center gap-2">
            <motion.div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step >= num
                  ? 'bg-brand-dark text-brand-surface shadow-sm'
                  : 'bg-stone-200 text-stone-500'
              }`}
              animate={step >= num ? { scale: [1, 1.15, 1] } : { scale: 1 }}
              transition={{
                duration: 0.4,
                repeat: step === num ? Infinity : 0,
                repeatDelay: 1.6,
                repeatType: 'mirror',
              }}
            >
              {step > num ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : num}
            </motion.div>
            <span
              className={`text-xs uppercase font-semibold tracking-wider ${step >= num ? 'text-brand-text' : 'text-brand-muted'}`}
            >
              {label}
            </span>
            {num < 3 && (
              <motion.div
                className={`w-12 h-0.5 origin-left ${step > num ? 'bg-brand-dark' : 'bg-stone-200'}`}
                animate={{ scaleX: step > num ? 1 : 0.3 }}
                transition={{ duration: 0.4 }}
              />
            )}
          </Item>
        ))}
      </Stagger>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-300">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-300"
              aria-label="Dismiss error"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step 1: Create Project */}
      <AnimatePresence mode="wait" custom={dir} initial={false}>
        {step === 1 && (
          <motion.div
            key="step-create"
            custom={dir}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="glass-card p-8 shadow-xl"
          >
            <h2 className="section-title mb-6">Project Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Project Name */}
              <div className="md:col-span-2">
                <label
                  htmlFor="projectName"
                  className="block text-xs font-semibold uppercase tracking-wider text-brand-muted mb-2"
                >
                  Project Name *
                </label>
                <input
                  id="projectName"
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g., Highway Widening NH-48"
                  className="w-full px-4 py-3 bg-white/80 border border-stone-200 rounded-2xl text-brand-text placeholder-stone-400 focus:outline-none focus:border-brand-accent/50 transition-colors shadow-sm"
                />
              </div>

              {/* Project Type */}
              <div>
                <label
                  htmlFor="projectType"
                  className="block text-xs font-semibold uppercase tracking-wider text-brand-muted mb-2"
                >
                  Project Type *
                </label>
                <select
                  id="projectType"
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value)}
                  className="w-full px-4 py-3 bg-white/80 border border-stone-200 rounded-2xl text-brand-text focus:outline-none focus:border-brand-accent/50 transition-colors shadow-sm"
                >
                  {PROJECT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* State */}
              <div>
                <label
                  htmlFor="state"
                  className="block text-xs font-semibold uppercase tracking-wider text-brand-muted mb-2"
                >
                  State *
                </label>
                <select
                  id="state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-4 py-3 bg-white/80 border border-stone-200 rounded-2xl text-brand-text focus:outline-none focus:border-brand-accent/50 transition-colors shadow-sm"
                >
                  {STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Contractor */}
              <div>
                <label
                  htmlFor="contractor"
                  className="block text-xs font-semibold uppercase tracking-wider text-brand-muted mb-2"
                >
                  Contractor
                </label>
                <input
                  id="contractor"
                  type="text"
                  value={contractor}
                  onChange={(e) => setContractor(e.target.value)}
                  placeholder="e.g., L&T Infrastructure"
                  className="w-full px-4 py-3 bg-white/80 border border-stone-200 rounded-2xl text-brand-text placeholder-stone-400 focus:outline-none focus:border-brand-accent/50 transition-colors shadow-sm"
                />
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-xs font-semibold uppercase tracking-wider text-brand-muted mb-2"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the project..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white/80 border border-stone-200 rounded-2xl text-brand-text placeholder-stone-400 focus:outline-none focus:border-brand-accent/50 transition-colors resize-none shadow-sm"
                />
              </div>
            </div>

            {/* Next Button */}
            <div className="mt-8 flex justify-end">
              <button
                onClick={createProject}
                disabled={uploading || !projectName.trim()}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Next: Upload Files
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Upload Files */}
        {step === 2 && (
          <motion.div
            key="step-upload"
            custom={dir}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="glass-card p-8 shadow-xl"
          >
            <h2 className="section-title mb-6">Upload Documents</h2>

            {/* Drop Zone */}
            <motion.div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all bg-white/40 ${
                dragActive
                  ? 'border-brand-accent bg-brand-accent/5'
                  : 'border-stone-300 hover:border-brand-accent/50'
              }`}
            >
              <motion.div
                animate={dragActive ? { y: [-4, 4, -4], scale: 1.1 } : { y: [0, -8, 0] }}
                transition={{
                  duration: dragActive ? 0.6 : 2.4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="inline-block"
              >
                <Upload className="w-12 h-12 text-brand-accent" />
              </motion.div>
              <p className="text-brand-text font-medium mb-2">
                Drag & drop files here, or{' '}
                <label className="text-brand-accent hover:underline cursor-pointer font-semibold rounded px-0.5">
                  browse
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileInput}
                    className="sr-only"
                  />
                </label>
              </p>
              <p className="text-xs text-brand-muted">PDF, JPG, PNG — Max 50MB per file</p>
            </motion.div>

            {/* File List */}
            {files.length > 0 && (
              <div className="mt-6 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                  Selected Files ({files.length})
                </h3>
                <AnimatePresence initial={false} className="space-y-2 max-h-64 overflow-y-auto">
                  {files.map((file, index) => (
                    <motion.div
                      key={`${file.name}-${index}`}
                      layout
                      initial={{ opacity: 0, y: -10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 40, height: 0, marginBottom: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                      className="flex items-center gap-3 p-3.5 bg-white/80 border border-stone-200 rounded-2xl shadow-sm"
                    >
                      {file.type.includes('pdf') ? (
                        <FileText className="w-5 h-5 text-rose-500" />
                      ) : (
                        <Image className="w-5 h-5 text-brand-accent" />
                      )}
                      <span className="text-sm font-medium text-brand-text flex-1 truncate">
                        {file.name}
                      </span>
                      <span className="text-xs font-mono text-brand-muted">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-stone-400 hover:text-rose-600 transition-colors p-1"
                        aria-label="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Actions */}
            <div className="mt-8 flex justify-between items-center">
              <motion.button
                whileHover={{ x: -4 }}
                onClick={() => go(1)}
                className="px-6 py-3 bg-stone-100 hover:bg-stone-200 text-brand-dark rounded-full font-medium text-xs uppercase tracking-wider transition-colors"
              >
                Back
              </motion.button>
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={uploadFiles}
                disabled={uploading || files.length === 0}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Upload & Process
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Processing */}
        {step === 3 && (
          <motion.div
            key="step-process"
            custom={dir}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="glass-card p-8 text-center max-w-2xl mx-auto shadow-xl"
          >
            {processing ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                  className="w-12 h-12 text-brand-accent mx-auto mb-4"
                >
                  <Loader2 className="w-12 h-12" />
                </motion.div>
                <motion.h2
                  className="text-xl font-bold text-brand-text mb-1"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  {pipelineStage || 'Processing Documents'}
                </motion.h2>
                <p className="text-sm text-brand-muted mb-6">{status}</p>

                {/* Progress Bar */}
                <div className="w-full bg-stone-100 rounded-full h-3 mb-6 p-0.5 border border-stone-200 overflow-hidden">
                  <motion.div
                    className="h-full bg-brand-dark rounded-full"
                    animate={{
                      width: `${Math.max(10, (pipelineStep / pipelineTotalSteps) * 100)}%`,
                    }}
                    transition={{ type: 'spring', stiffness: 90, damping: 20 }}
                  />
                </div>

                {/* Stage Indicators */}
                <div className="grid grid-cols-3 gap-2 mb-6 text-left">
                  {[
                    { step: 1, name: 'Quality Check' },
                    { step: 2, name: 'Doc Extraction' },
                    { step: 3, name: 'Cross-Verification' },
                    { step: 4, name: 'Computer Vision' },
                    { step: 5, name: 'Geospatial Alignment' },
                    { step: 6, name: 'Anomaly & Risk' },
                  ].map((s) => (
                    <motion.div
                      key={s.step}
                      animate={
                        pipelineStep === s.step
                          ? {
                              scale: [1, 1.04, 1],
                              boxShadow: [
                                '0 0 0 rgba(144,88,49,0)',
                                '0 4px 18px rgba(144,88,49,0.25)',
                                '0 0 0 rgba(144,88,49,0)',
                              ],
                            }
                          : { scale: 1 }
                      }
                      transition={{ duration: 1.4, repeat: pipelineStep === s.step ? Infinity : 0 }}
                      className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 transition-all ${
                        pipelineStep >= s.step
                          ? 'bg-amber-50/80 border-amber-300 text-brand-text font-semibold shadow-sm'
                          : 'bg-white/60 border-stone-200 text-stone-400'
                      }`}
                    >
                      <motion.div
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                          pipelineStep >= s.step
                            ? 'bg-brand-dark text-brand-surface'
                            : 'bg-stone-200 text-stone-500'
                        }`}
                        animate={pipelineStep === s.step ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        {s.step}
                      </motion.div>
                      <span className="truncate">{s.name}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Live Output Log */}
                {pipelineLogs.length > 0 && (
                  <div className="bg-stone-50/90 border border-stone-200 rounded-2xl p-4 text-left font-mono text-[11px] text-stone-600 max-h-36 overflow-y-auto">
                    <div className="text-[10px] uppercase font-semibold text-brand-muted mb-1 tracking-wider">
                      Live Execution Stream:
                    </div>
                    <AnimatePresence initial={false}>
                      {pipelineLogs.map((log, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="truncate text-brand-text"
                        >
                          &gt; {log}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </>
            ) : (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
              >
                <CheckCircle className="w-14 h-14 text-emerald-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-brand-text mb-2">Verification Complete!</h2>
                <p className="text-brand-muted mb-6 font-medium">
                  {status || 'Redirecting to project details...'}
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
