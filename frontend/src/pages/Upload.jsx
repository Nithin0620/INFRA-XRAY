import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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

const API = 'http://localhost:3001/api';

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

  // Step tracking
  const [step, setStep] = useState(1); // 1: Create project, 2: Upload files, 3: Processing

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
      setStep(2);
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

      setStep(3);
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
      ws = new WebSocket('ws://localhost:3001/ws');
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
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Upload <span className="text-brand-400">Documents</span>
        </h1>
        <p className="text-brand-muted mt-1">
          Upload infrastructure project documents for AI-powered verification
        </p>
      </motion.div>

      {/* Step Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-4 mb-8"
      >
        {[
          { num: 1, label: 'Create Project' },
          { num: 2, label: 'Upload Files' },
          { num: 3, label: 'Process' },
        ].map(({ num, label }) => (
          <div key={num} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                step >= num ? 'bg-brand-500 text-brand-text' : 'bg-gray-800 text-brand-muted'
              }`}
            >
              {step > num ? <CheckCircle className="w-5 h-5" /> : num}
            </div>
            <span className={`text-sm ${step >= num ? 'text-brand-text' : 'text-brand-muted'}`}>
              {label}
            </span>
            {num < 3 && (
              <div className={`w-12 h-0.5 ${step > num ? 'bg-brand-500' : 'bg-gray-800'}`} />
            )}
          </div>
        ))}
      </motion.div>

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
      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <h2 className="section-title mb-6">Project Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Project Name */}
            <div className="md:col-span-2">
              <label
                htmlFor="projectName"
                className="block text-sm font-medium text-brand-muted mb-2"
              >
                Project Name *
              </label>
              <input
                id="projectName"
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g., Highway Widening NH-48"
                className="w-full px-4 py-3 bg-brand-500 border border-brand-100 rounded-xl text-brand-text placeholder-gray-600 focus:outline-none focus:border-brand-500/50 transition-colors"
              />
            </div>

            {/* Project Type */}
            <div>
              <label
                htmlFor="projectType"
                className="block text-sm font-medium text-brand-muted mb-2"
              >
                Project Type *
              </label>
              <select
                id="projectType"
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                className="w-full px-4 py-3 bg-brand-500 border border-brand-100 rounded-xl text-brand-text focus:outline-none focus:border-brand-500/50 transition-colors"
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
              <label htmlFor="state" className="block text-sm font-medium text-brand-muted mb-2">
                State *
              </label>
              <select
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-4 py-3 bg-brand-500 border border-brand-100 rounded-xl text-brand-text focus:outline-none focus:border-brand-500/50 transition-colors"
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
                className="block text-sm font-medium text-brand-muted mb-2"
              >
                Contractor
              </label>
              <input
                id="contractor"
                type="text"
                value={contractor}
                onChange={(e) => setContractor(e.target.value)}
                placeholder="e.g., L&T Infrastructure"
                className="w-full px-4 py-3 bg-brand-500 border border-brand-100 rounded-xl text-brand-text placeholder-gray-600 focus:outline-none focus:border-brand-500/50 transition-colors"
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-brand-muted mb-2"
              >
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the project..."
                rows={3}
                className="w-full px-4 py-3 bg-brand-500 border border-brand-100 rounded-xl text-brand-text placeholder-gray-600 focus:outline-none focus:border-brand-500/50 transition-colors resize-none"
              />
            </div>
          </div>

          {/* Next Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={createProject}
              disabled={uploading || !projectName.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-brand-text rounded-xl font-medium transition-colors"
            >
              {uploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Next: Upload Files
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}

      {/* Step 2: Upload Files */}
      {step === 2 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <h2 className="section-title mb-6">Upload Documents</h2>

          {/* Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
              dragActive
                ? 'border-brand-500 bg-brand-500/5'
                : 'border-brand-100 hover:border-white/20'
            }`}
          >
            <Upload className="w-12 h-12 text-brand-muted mx-auto mb-4" />
            <p className="text-brand-muted mb-2">
              Drag & drop files here, or{' '}
              <label className="text-brand-400 hover:text-brand-300 cursor-pointer underline focus-within:ring-2 focus-within:ring-brand-500 focus-within:ring-offset-2 focus-within:ring-offset-gray-900 focus-within:outline-none rounded px-0.5">
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
            <p className="text-xs text-gray-600">PDF, JPG, PNG — Max 50MB per file</p>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-medium text-brand-muted">
                Selected Files ({files.length})
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-brand-500 rounded-lg">
                    {file.type.includes('pdf') ? (
                      <FileText className="w-5 h-5 text-red-400" />
                    ) : (
                      <Image className="w-5 h-5 text-blue-400" />
                    )}
                    <span className="text-sm text-brand-text flex-1 truncate">{file.name}</span>
                    <span className="text-xs text-brand-muted">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-brand-muted hover:text-red-400 transition-colors"
                      aria-label="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-brand-text rounded-xl font-medium transition-colors"
            >
              Back
            </button>
            <button
              onClick={uploadFiles}
              disabled={uploading || files.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-brand-text rounded-xl font-medium transition-colors"
            >
              {uploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Upload & Process
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}

      {/* Step 3: Processing */}
      {step === 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 text-center max-w-2xl mx-auto"
        >
          {processing ? (
            <>
              <Loader2 className="w-12 h-12 text-brand-400 mx-auto mb-4 animate-spin" />
              <h2 className="text-xl font-semibold text-brand-text mb-1">
                {pipelineStage || 'Processing Documents'}
              </h2>
              <p className="text-sm text-brand-muted mb-6">{status}</p>

              {/* Progress Bar */}
              <div className="w-full bg-white rounded-full h-3 mb-6 p-0.5 border border-brand-100 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-600 to-cyan-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(10, (pipelineStep / pipelineTotalSteps) * 100)}%`,
                  }}
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
                  <div
                    key={s.step}
                    className={`p-2 rounded-lg border text-xs flex items-center gap-2 ${
                      pipelineStep >= s.step
                        ? 'bg-brand-500/10 border-brand-500/30 text-brand-300'
                        : 'bg-white/[0.02] border-brand-50 text-gray-600'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                        pipelineStep >= s.step
                          ? 'bg-brand-500 text-brand-text'
                          : 'bg-gray-800 text-brand-muted'
                      }`}
                    >
                      {s.step}
                    </div>
                    <span className="truncate">{s.name}</span>
                  </div>
                ))}
              </div>

              {/* Live Output Log */}
              {pipelineLogs.length > 0 && (
                <div className="bg-white/60 border border-brand-100 rounded-xl p-3 text-left font-mono text-[11px] text-brand-muted max-h-36 overflow-y-auto">
                  <div className="text-[10px] uppercase text-gray-600 mb-1">
                    Live Execution Stream:
                  </div>
                  {pipelineLogs.map((log, i) => (
                    <div key={i} className="truncate text-brand-text">
                      &gt; {log}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <CheckCircle className="w-14 h-14 text-green-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-brand-text mb-2">Verification Complete!</h2>
              <p className="text-brand-muted mb-6">
                {status || 'Redirecting to project details...'}
              </p>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}
