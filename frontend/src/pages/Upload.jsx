import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  Image,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  ArrowRight,
} from "lucide-react";
import axios from "axios";

const API = "http://localhost:3001/api";

const PROJECT_TYPES = ["road", "bridge", "building", "pipeline", "dam", "other"];
const STATES = [
  "Andhra Pradesh", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Odisha", "Punjab", "Rajasthan",
  "Tamil Nadu", "Telangana", "Uttar Pradesh", "West Bengal",
];

export default function UploadPage() {
  const navigate = useNavigate();

  // Step tracking
  const [step, setStep] = useState(1); // 1: Create project, 2: Upload files, 3: Processing

  // Project form
  const [projectName, setProjectName] = useState("");
  const [projectType, setProjectType] = useState("road");
  const [state, setState] = useState("Maharashtra");
  const [contractor, setContractor] = useState("");
  const [description, setDescription] = useState("");

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
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
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
      setError("Project name is required");
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
      setError(err.response?.data?.error || "Failed to create project");
    } finally {
      setUploading(false);
    }
  };

  // Upload files
  const uploadFiles = async () => {
    if (files.length === 0) {
      setError("Please select files to upload");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });

      await axios.post(`${API}/upload/${projectId}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setStep(3);
      startProcessing();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to upload files");
    } finally {
      setUploading(false);
    }
  };

  // Start processing pipeline
  const startProcessing = async () => {
    setProcessing(true);
    setStatus("Starting pipeline...");

    try {
      await axios.post(`${API}/upload/${projectId}/process`);
      setStatus("Processing started. This may take a few minutes...");

      // Poll for status
      const pollInterval = setInterval(async () => {
        try {
          const response = await axios.get(`${API}/upload/${projectId}/status`);
          const projectStatus = response.data.status;

          if (projectStatus === "completed") {
            clearInterval(pollInterval);
            setStatus("Processing complete!");
            setTimeout(() => {
              navigate(`/project/${projectId}`);
            }, 1500);
          } else if (projectStatus === "failed") {
            clearInterval(pollInterval);
            setStatus("Processing failed. Please try again.");
            setProcessing(false);
          }
        } catch (err) {
          console.error("Status check failed:", err);
        }
      }, 3000);
    } catch (err) {
      setError("Failed to start processing");
      setProcessing(false);
    }
  };

  return (
    <div className="page-container max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold tracking-tight">
          Upload <span className="text-brand-400">Documents</span>
        </h1>
        <p className="text-gray-500 mt-1">
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
          { num: 1, label: "Create Project" },
          { num: 2, label: "Upload Files" },
          { num: 3, label: "Process" },
        ].map(({ num, label }) => (
          <div key={num} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                step >= num
                  ? "bg-brand-500 text-white"
                  : "bg-gray-800 text-gray-500"
              }`}
            >
              {step > num ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                num
              )}
            </div>
            <span
              className={`text-sm ${
                step >= num ? "text-gray-200" : "text-gray-500"
              }`}
            >
              {label}
            </span>
            {num < 3 && (
              <div
                className={`w-12 h-0.5 ${
                  step > num ? "bg-brand-500" : "bg-gray-800"
                }`}
              />
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
              <label htmlFor="projectName" className="block text-sm font-medium text-gray-400 mb-2">
                Project Name *
              </label>
              <input
                id="projectName"
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g., Highway Widening NH-48"
                className="w-full px-4 py-3 bg-gray-900/50 border border-white/10 rounded-xl text-gray-200 placeholder-gray-600 focus:outline-none focus:border-brand-500/50 transition-colors"
              />
            </div>

            {/* Project Type */}
            <div>
              <label htmlFor="projectType" className="block text-sm font-medium text-gray-400 mb-2">
                Project Type *
              </label>
              <select
                id="projectType"
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900/50 border border-white/10 rounded-xl text-gray-200 focus:outline-none focus:border-brand-500/50 transition-colors"
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
              <label htmlFor="state" className="block text-sm font-medium text-gray-400 mb-2">
                State *
              </label>
              <select
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900/50 border border-white/10 rounded-xl text-gray-200 focus:outline-none focus:border-brand-500/50 transition-colors"
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
              <label htmlFor="contractor" className="block text-sm font-medium text-gray-400 mb-2">
                Contractor
              </label>
              <input
                id="contractor"
                type="text"
                value={contractor}
                onChange={(e) => setContractor(e.target.value)}
                placeholder="e.g., L&T Infrastructure"
                className="w-full px-4 py-3 bg-gray-900/50 border border-white/10 rounded-xl text-gray-200 placeholder-gray-600 focus:outline-none focus:border-brand-500/50 transition-colors"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-400 mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the project..."
                rows={3}
                className="w-full px-4 py-3 bg-gray-900/50 border border-white/10 rounded-xl text-gray-200 placeholder-gray-600 focus:outline-none focus:border-brand-500/50 transition-colors resize-none"
              />
            </div>
          </div>

          {/* Next Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={createProject}
              disabled={uploading || !projectName.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
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
                ? "border-brand-500 bg-brand-500/5"
                : "border-white/10 hover:border-white/20"
            }`}
          >
            <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">
              Drag & drop files here, or{" "}
              <label htmlFor="file-upload" className="text-brand-400 hover:text-brand-300 cursor-pointer underline">
                browse
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </label>
            </p>
            <p className="text-xs text-gray-600">
              PDF, JPG, PNG — Max 50MB per file
            </p>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-medium text-gray-400">
                Selected Files ({files.length})
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg"
                  >
                    {file.type.includes("pdf") ? (
                      <FileText className="w-5 h-5 text-red-400" />
                    ) : (
                      <Image className="w-5 h-5 text-blue-400" />
                    )}
                    <span className="text-sm text-gray-300 flex-1 truncate">
                      {file.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-gray-500 hover:text-red-400 transition-colors"
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
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-medium transition-colors"
            >
              Back
            </button>
            <button
              onClick={uploadFiles}
              disabled={uploading || files.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-brand-500 hover:bg-brand-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
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
          className="glass-card p-6 text-center"
        >
          {processing ? (
            <>
              <Loader2 className="w-16 h-16 text-brand-400 mx-auto mb-6 animate-spin" />
              <h2 className="text-xl font-semibold text-gray-200 mb-2">
                Processing Documents
              </h2>
              <p className="text-gray-400">{status}</p>
              <div className="mt-6 w-full max-w-xs mx-auto">
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-brand-500"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 30, ease: "linear" }}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-6" />
              <h2 className="text-xl font-semibold text-gray-200 mb-2">
                Processing Complete!
              </h2>
              <p className="text-gray-400 mb-6">
                Redirecting to project details...
              </p>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}
