import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  FileText,
  Receipt,
  ClipboardCheck,
  Camera,
  MapPin,
  ChevronDown,
  ChevronUp,
  Bot,
  RefreshCw,
  Shield,
} from "lucide-react";
import { fetchProject, generateChecklist, submitFeedback, fetchFeedback } from "../services/api";
import RiskGauge from "../components/RiskGauge";
import FlagCard from "../components/FlagCard";
import { formatINR, cn } from "../lib/utils";

const funnelStages = [
  { key: "contract", label: "Contract", icon: FileText, color: "from-blue-500/20 to-blue-600/5" },
  { key: "boq", label: "BOQ", icon: Receipt, color: "from-purple-500/20 to-purple-600/5" },
  { key: "progress_report", label: "Progress", icon: ClipboardCheck, color: "from-cyan-500/20 to-cyan-600/5" },
  { key: "invoice", label: "Invoice", icon: Receipt, color: "from-yellow-500/20 to-yellow-600/5" },
  { key: "inspection_report", label: "Inspection", icon: MapPin, color: "from-green-500/20 to-green-600/5" },
];

function getStageValue(stage, extracted) {
  if (!extracted) return null;
  const d = extracted[stage];
  if (!d) return null;
  switch (stage) {
    case "contract":
      return `${d.sanctioned_quantity} ${d.unit}`;
    case "boq":
      return formatINR(d.boq_total_inr);
    case "progress_report":
      return `${d.quantity_completed} ${d.unit} (${d.percent_complete}%)`;
    case "invoice":
      return formatINR(d.billed_amount_inr);
    case "inspection_report":
      return `${d.verified_quantity} ${d.unit}`;
    default:
      return null;
  }
}

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copilot, setCopilot] = useState(null);
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [feedbackMap, setFeedbackMap] = useState({});
  const [expandedFlags, setExpandedFlags] = useState(true);

  useEffect(() => {
    Promise.all([fetchProject(id), fetchFeedback(id)])
      .then(([proj, fb]) => {
        setProject(proj);
        const map = {};
        (fb.feedback || []).forEach((f) => { map[f.flag_id] = f.action; });
        setFeedbackMap(map);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleFeedback = async (flagId, action) => {
    try {
      await submitFeedback(id, { flag_id: flagId, action });
      setFeedbackMap((prev) => ({ ...prev, [flagId]: action }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopilot = async () => {
    setCopilotLoading(true);
    try {
      const data = await generateChecklist(id);
      setCopilot(data);
    } catch (e) {
      console.error(e);
    } finally {
      setCopilotLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="page-container text-center py-20">
        <p className="text-gray-500">Project not found.</p>
        <Link to="/" className="text-brand-400 hover:underline mt-2 inline-block">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const extracted = project.extracted;
  const riskReport = project.risk_report;
  const allFlags = [
    ...(project.flags?.cross_verification || []),
    ...(project.flags?.computer_vision || []),
    ...(project.flags?.geospatial || []),
  ];
  // Add ML anomaly flag if score is high
  if (riskReport?.ml_anomaly_score > 0.5) {
    allFlags.push({
      flag_id: `${id}_ml_001`,
      source_module: "ml_anomaly",
      severity: riskReport.ml_anomaly_score > 0.7 ? "red" : "yellow",
      category: "statistical_outlier",
      message: `Statistical anomaly detected (score: ${(riskReport.ml_anomaly_score * 100).toFixed(0)}%). Unusual pattern across portfolio metrics.`,
      documents_involved: [],
      deviation_percent: null,
    });
  }

  const redFlags = allFlags.filter((f) => f.severity === "red");
  const yellowFlags = allFlags.filter((f) => f.severity === "yellow");

  return (
    <div className="page-container">
      {/* Back link */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 mb-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{project.project_name}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-400">
              <span className="font-mono bg-white/5 px-2 py-0.5 rounded">{project.tender_id}</span>
              <span>{project.state}</span>
              <span className="capitalize bg-white/5 px-2 py-0.5 rounded-full text-xs">{project.category}</span>
              <span>{project.contractor_name}</span>
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Sanctioned: <span className="text-gray-300 font-medium">{formatINR(project.sanctioned_amount_inr)}</span>
              {" · "}
              {project.sanctioned_quantity} {project.unit}
            </div>
          </div>
          {riskReport && (
            <RiskGauge
              score={riskReport.overall_score}
              severity={riskReport.severity_label}
            />
          )}
        </div>
      </motion.div>

      {/* Evidence Funnel */}
      {extracted && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <h2 className="section-title mb-4">
            <Shield className="w-5 h-5 text-brand-400" /> Evidence Timeline
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {funnelStages.map(({ key, label, icon: Icon, color }, i) => {
              const value = getStageValue(key, extracted);
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15 + i * 0.05 }}
                  className={cn(
                    "rounded-xl p-4 border border-white/5 bg-gradient-to-b",
                    color
                  )}
                >
                  <Icon className="w-4 h-4 text-gray-400 mb-2" />
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</div>
                  <div className="text-sm font-semibold text-gray-200">
                    {value || <span className="text-gray-600">Not processed</span>}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Flags */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <button
          onClick={() => setExpandedFlags(!expandedFlags)}
          className="section-title mb-4 hover:text-white transition-colors"
        >
          {expandedFlags ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          Flags ({allFlags.length})
          {redFlags.length > 0 && (
            <span className="ml-2 text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full">
              {redFlags.length} critical
            </span>
          )}
          {yellowFlags.length > 0 && (
            <span className="ml-1 text-xs bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded-full">
              {yellowFlags.length} warnings
            </span>
          )}
        </button>
        <AnimatePresence>
          {expandedFlags && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-3 overflow-hidden"
            >
              {allFlags.length === 0 ? (
                <div className="glass-card p-8 text-center text-gray-500">
                  No flags detected — project appears clean.
                </div>
              ) : (
                allFlags.map((flag, i) => (
                  <motion.div
                    key={flag.flag_id || i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <FlagCard
                      flag={flag}
                      onFeedback={handleFeedback}
                      feedbackStatus={feedbackMap[flag.flag_id]}
                    />
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* AI Inspector Copilot */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6 mb-6"
      >
        <h2 className="section-title mb-4">
          <Bot className="w-5 h-5 text-brand-400" /> AI Inspector Copilot
        </h2>

        {!copilot && (
          <button
            onClick={handleCopilot}
            disabled={copilotLoading}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all",
              "bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/20",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {copilotLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Generating...
              </>
            ) : (
              <>
                <Bot className="w-4 h-4" /> Generate Inspection Checklist
              </>
            )}
          </button>
        )}

        {copilot && (
          <div className="space-y-4">
            {/* Sampling strategy */}
            <div
              className={cn(
                "p-4 rounded-xl border",
                copilot.sampling_strategy === "full_reinspection"
                  ? "bg-red-500/5 border-red-500/20"
                  : copilot.sampling_strategy === "sample_check"
                  ? "bg-yellow-500/5 border-yellow-500/20"
                  : "bg-green-500/5 border-green-500/20"
              )}
            >
              <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">
                Recommended Action
              </div>
              <div className="font-semibold text-gray-200 capitalize">
                {copilot.sampling_strategy.replace(/_/g, " ")}
              </div>
              <p className="text-sm text-gray-400 mt-1">{copilot.sampling_explanation}</p>
            </div>

            {/* Checklist */}
            {copilot.checklist?.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Inspection Checklist</h3>
                <div className="space-y-2">
                  {copilot.checklist.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5"
                    >
                      <div
                        className={cn(
                          "mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                          item.priority === "high"
                            ? "bg-red-500/10 text-red-400"
                            : "bg-yellow-500/10 text-yellow-400"
                        )}
                      >
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-sm text-gray-300">{item.item}</p>
                        <p className="text-xs text-gray-500 mt-0.5 font-mono">
                          Ref: {item.reference}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleCopilot}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Regenerate
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
