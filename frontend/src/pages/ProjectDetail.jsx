/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  FileText,
  Receipt,
  ClipboardCheck,
  MapPin,
  ChevronDown,
  ChevronUp,
  Bot,
  RefreshCw,
  Shield,
  Layers,
  BarChart2,
  Camera,
  HelpCircle,
  CheckCircle2,
  Download,
} from 'lucide-react';
import { fetchProject, generateChecklist, submitFeedback, fetchFeedback } from '../services/api';
import RiskGauge from '../components/RiskGauge';
import FlagCard from '../components/FlagCard';
import ProjectMap from '../components/ProjectMap';
import EvidenceGraph from '../components/EvidenceGraph';
import ProjectAnalyticsChart from '../components/ProjectAnalyticsChart';
import { formatINR, cn } from '../lib/utils';

const funnelStages = [
  { key: 'contract', label: 'Contract', icon: FileText, color: 'from-blue-500/20 to-blue-600/5' },
  { key: 'boq', label: 'BOQ', icon: Receipt, color: 'from-purple-500/20 to-purple-600/5' },
  {
    key: 'progress_report',
    label: 'Progress',
    icon: ClipboardCheck,
    color: 'from-cyan-500/20 to-cyan-600/5',
  },
  { key: 'invoice', label: 'Invoice', icon: Receipt, color: 'from-yellow-500/20 to-yellow-600/5' },
  {
    key: 'inspection_report',
    label: 'Inspection',
    icon: MapPin,
    color: 'from-green-500/20 to-green-600/5',
  },
];

function getStageValue(stage, extracted) {
  if (!extracted) return null;
  const d = extracted[stage];
  if (!d) return null;
  switch (stage) {
    case 'contract':
      return `${d.sanctioned_quantity} ${d.unit}`;
    case 'boq':
      return formatINR(d.boq_total_inr);
    case 'progress_report':
      return `${d.quantity_completed} ${d.unit} (${d.percent_complete}%)`;
    case 'invoice':
      return formatINR(d.billed_amount_inr);
    case 'inspection_report':
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
  const [activeTab, setActiveTab] = useState('graph'); // 'graph' | 'analytics' | 'map' | 'photos'

  useEffect(() => {
    Promise.all([fetchProject(id), fetchFeedback(id)])
      .then(([proj, fb]) => {
        setProject(proj);
        const map = {};
        (fb.feedback || []).forEach((f) => {
          map[f.flag_id] = f.action;
        });
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
        <p className="text-brand-muted">Project not found.</p>
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
      source_module: 'ml_anomaly',
      severity: riskReport.ml_anomaly_score > 0.7 ? 'red' : 'yellow',
      category: 'statistical_outlier',
      message: `Statistical anomaly detected (score: ${(riskReport.ml_anomaly_score * 100).toFixed(0)}%). Unusual pattern across portfolio metrics.`,
      documents_involved: [],
      deviation_percent: null,
    });
  }

  const redFlags = allFlags.filter((f) => f.severity === 'red');
  const yellowFlags = allFlags.filter((f) => f.severity === 'yellow');
  const photos = extracted?.photos || [];

  return (
    <div className="page-container">
      {/* Back link */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-brand-muted hover:text-brand-text transition-colors mb-6"
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
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-brand-muted">
              <span className="font-mono bg-brand-50 px-2 py-0.5 rounded">{project.tender_id}</span>
              <span>{project.state}</span>
              <span className="capitalize bg-brand-50 px-2 py-0.5 rounded-full text-xs">
                {project.category}
              </span>
              <span>{project.contractor_name}</span>
            </div>
            <div className="mt-2 text-sm text-brand-muted">
              Sanctioned:{' '}
              <span className="text-brand-text font-medium">
                {formatINR(project.sanctioned_amount_inr)}
              </span>
              {' · '}
              {project.sanctioned_quantity} {project.unit}
            </div>
          </div>
          {riskReport && (
            <RiskGauge score={riskReport.overall_score} severity={riskReport.severity_label} />
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
            <Shield className="w-5 h-5 text-brand-400" /> Evidence Timeline Funnel
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
                  className={cn('rounded-xl p-4 border border-brand-50 bg-gradient-to-b', color)}
                >
                  <Icon className="w-4 h-4 text-brand-muted mb-2" />
                  <div className="text-xs text-brand-muted uppercase tracking-wider mb-1">
                    {label}
                  </div>
                  <div className="text-sm font-semibold text-brand-text">
                    {value || <span className="text-gray-600">Not processed</span>}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Deep Audit Exploration Tabs */}
      <div className="mb-6">
        <div className="flex items-center gap-2 border-b border-brand-100 pb-2 mb-4 overflow-x-auto">
          {[
            { id: 'graph', label: 'Evidence Graph (React Flow)', icon: Layers },
            { id: 'analytics', label: 'Financial & Quantity Audits', icon: BarChart2 },
            { id: 'map', label: 'Geospatial Alignment & Site Photos', icon: MapPin },
          ].map(({ id: tabId, label, icon: Icon }) => (
            <button
              key={tabId}
              onClick={() => setActiveTab(tabId)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                activeTab === tabId
                  ? 'bg-brand-600 text-brand-text shadow-lg shadow-brand-600/20'
                  : 'text-brand-muted hover:text-brand-text hover:bg-brand-50'
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* Tab 1: Evidence Graph */}
        {activeTab === 'graph' && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
            <EvidenceGraph project={project} extracted={extracted} flags={allFlags} />
          </motion.div>
        )}

        {/* Tab 2: Financial & Quantity Audit Charts */}
        {activeTab === 'analytics' && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
            <ProjectAnalyticsChart project={project} extracted={extracted} />
          </motion.div>
        )}

        {/* Tab 3: Geospatial Map & Photos */}
        {activeTab === 'map' && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <ProjectMap project={project} photos={photos} height="480px" />

            {/* Photos Strip */}
            {photos.length > 0 && (
              <div className="glass-card p-5">
                <h3 className="text-sm font-semibold text-brand-text mb-3 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-brand-400" /> Geotagged Site Evidence Photos (
                  {photos.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {photos.map((ph, idx) => {
                    const isDefect =
                      ph.condition_tag === 'pothole' || ph.condition_tag === 'cracking';
                    return (
                      <div
                        key={ph.photo_id || idx}
                        className="rounded-xl border border-brand-100 bg-white/40 overflow-hidden group"
                      >
                        <div className="h-32 bg-white overflow-hidden relative">
                          <img
                            src={`http://localhost:3001/data/${ph.filepath}`}
                            alt={ph.photo_id}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                          <span
                            className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold ${
                              isDefect
                                ? 'bg-red-500/90 text-brand-text'
                                : 'bg-green-500/90 text-brand-text'
                            }`}
                          >
                            {ph.condition_tag?.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="p-3 text-xs">
                          <div className="font-bold text-brand-text">{ph.photo_id}</div>
                          <div className="text-[10px] text-brand-muted font-mono mt-0.5">
                            {ph.gps_lat?.toFixed(4)}, {ph.gps_lon?.toFixed(4)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Flags */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <button
          onClick={() => setExpandedFlags(!expandedFlags)}
          className="section-title mb-4 hover:text-brand-text transition-colors"
        >
          {expandedFlags ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          Detected Forensic Flags ({allFlags.length})
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
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-3 overflow-hidden"
            >
              {allFlags.length === 0 ? (
                <div className="glass-card p-8 text-center text-brand-muted">
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">
            <Bot className="w-5 h-5 text-brand-400" /> AI Inspector Copilot
          </h2>
          {copilot?.llm_generated && (
            <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">
              Anthropic Claude Live Intelligence
            </span>
          )}
        </div>

        {!copilot && (
          <button
            onClick={handleCopilot}
            disabled={copilotLoading}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all',
              'bg-brand-600 hover:bg-brand-500 text-brand-text shadow-lg shadow-brand-600/20',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {copilotLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Analyzing Project Evidence...
              </>
            ) : (
              <>
                <Bot className="w-4 h-4" /> Generate Field Inspection Action Plan
              </>
            )}
          </button>
        )}

        {copilot && (
          <div className="space-y-5">
            {/* Sampling strategy */}
            <div
              className={cn(
                'p-4 rounded-xl border',
                copilot.sampling_strategy === 'full_reinspection'
                  ? 'bg-red-500/5 border-red-500/20'
                  : copilot.sampling_strategy === 'sample_check'
                    ? 'bg-yellow-500/5 border-yellow-500/20'
                    : 'bg-green-500/5 border-green-500/20'
              )}
            >
              <div className="text-xs uppercase tracking-wider text-brand-muted mb-1">
                Recommended Sampling Strategy
              </div>
              <div className="font-semibold text-brand-text capitalize">
                {copilot.sampling_strategy.replace(/_/g, ' ')}
              </div>
              <p className="text-sm text-brand-muted mt-1">{copilot.sampling_explanation}</p>
            </div>

            {/* Contractor Inquiries */}
            {copilot.contractor_inquiries?.length > 0 && (
              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                <h3 className="text-xs uppercase tracking-wider text-blue-400 font-semibold mb-2 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4" /> Evidence Discrepancy Inquiries for Contractor
                </h3>
                <ul className="space-y-1.5">
                  {copilot.contractor_inquiries.map((inq, idx) => (
                    <li key={idx} className="text-xs text-brand-text flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span>{inq}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Checklist */}
            {copilot.checklist?.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-brand-muted mb-2">
                  Ground Inspection Tasks
                </h3>
                <div className="space-y-2">
                  {copilot.checklist.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3.5 rounded-lg bg-white/[0.02] border border-brand-50"
                    >
                      <div
                        className={cn(
                          'mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
                          item.priority === 'high'
                            ? 'bg-red-500/10 text-red-400'
                            : 'bg-yellow-500/10 text-yellow-400'
                        )}
                      >
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-brand-text">{item.item}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-brand-muted">
                          <span className="font-mono text-brand-muted">Ref: {item.reference}</span>
                          {item.verification_method && (
                            <span className="text-brand-400/90 font-medium">
                              Method: {item.verification_method}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleCopilot}
              className="text-xs text-brand-muted hover:text-brand-text transition-colors flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Regenerate Plan
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
