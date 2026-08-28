import { motion } from 'framer-motion';
import {
  Database,
  Search,
  Eye,
  MapPin,
  BarChart3,
  AlertTriangle,
  Bot,
  RefreshCw,
  ArrowRight,
  Brain,
  Shield,
} from 'lucide-react';

const stages = [
  {
    icon: Database,
    label: 'Data Ingestion',
    description: 'PDF documents + site photos collected',
    type: 'input',
  },
  {
    icon: Search,
    label: 'Document Intelligence',
    description: 'OCR + LLM extraction into structured JSON',
    type: 'ai',
  },
  {
    icon: Shield,
    label: 'Evidence Model',
    description: 'Normalized claims, sources, and evidence records',
    type: 'core',
  },
  {
    icon: BarChart3,
    label: 'Cross-Verification',
    description: 'Rule-based document consistency checks',
    type: 'rule',
  },
  {
    icon: Eye,
    label: 'Computer Vision',
    description: 'Road/structure damage detection (CNN placeholder)',
    type: 'cv',
  },
  {
    icon: MapPin,
    label: 'Geospatial',
    description: 'GPS route/boundary alignment verification',
    type: 'geo',
  },
  {
    icon: Brain,
    label: 'Anomaly Engine',
    description: 'IsolationForest + z-score statistical outlier detection',
    type: 'ml',
  },
  {
    icon: AlertTriangle,
    label: 'Risk Scoring',
    description: 'Unified 0-100 score with evidence-backed alerts',
    type: 'core',
  },
  {
    icon: Bot,
    label: 'Inspector Copilot',
    description: 'AI-generated field inspection checklists',
    type: 'ai',
  },
  {
    icon: RefreshCw,
    label: 'Feedback Loop',
    description: 'Inspector validates flags → system learns',
    type: 'human',
  },
];

const typeColors = {
  input: 'from-gray-500/20 to-gray-600/5 border-gray-500/20',
  ai: 'from-purple-500/20 to-purple-600/5 border-purple-500/20',
  core: 'from-brand-500/20 to-brand-600/5 border-brand-500/20',
  rule: 'from-cyan-500/20 to-cyan-600/5 border-cyan-500/20',
  cv: 'from-pink-500/20 to-pink-600/5 border-pink-500/20',
  geo: 'from-green-500/20 to-green-600/5 border-green-500/20',
  ml: 'from-orange-500/20 to-orange-600/5 border-orange-500/20',
  human: 'from-yellow-500/20 to-yellow-600/5 border-yellow-500/20',
};

const typeLabels = {
  input: 'Input',
  ai: 'LLM-Powered',
  core: 'Core',
  rule: 'Deterministic Rules',
  cv: 'Computer Vision',
  geo: 'Geospatial',
  ml: 'Machine Learning',
  human: 'Human-in-the-Loop',
};

export default function About() {
  return (
    <div className="page-container max-w-4xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          How <span className="text-brand-400">INFRA-XRAY</span> Works
        </h1>
        <p className="text-gray-500 mt-2">
          An end-to-end AI-powered pipeline for verifying government infrastructure projects. Every
          alert traces back to specific evidence.
        </p>
      </motion.div>

      {/* Pipeline visualization */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-brand-500/30 via-brand-500/10 to-transparent" />

        <div className="space-y-4">
          {stages.map(({ icon: Icon, label, description, type }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
              className="relative pl-16"
            >
              {/* Node */}
              <div
                className={`absolute left-3 top-3 w-7 h-7 rounded-full bg-gradient-to-br ${typeColors[type]} border flex items-center justify-center`}
              >
                <Icon className="w-3.5 h-3.5 text-gray-300" />
              </div>

              {/* Card */}
              <div className={`glass-card p-4 bg-gradient-to-r ${typeColors[type]}`}>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold text-gray-200">{label}</h3>
                  <span className="text-[10px] uppercase tracking-wider text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
                    {typeLabels[type]}
                  </span>
                </div>
                <p className="text-sm text-gray-400">{description}</p>
              </div>

              {/* Arrow connector (except last) */}
              {i < stages.length - 1 && (
                <div className="absolute left-[18px] top-12 text-gray-700">
                  <ArrowRight className="w-3 h-3 rotate-90" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Tech stack */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="glass-card p-6 mt-10"
      >
        <h2 className="section-title mb-4">Technology Stack</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h3 className="text-gray-500 text-xs uppercase tracking-wider mb-2">Frontend</h3>
            <ul className="space-y-1 text-gray-400">
              <li>React + Vite</li>
              <li>Tailwind CSS</li>
              <li>Framer Motion</li>
              <li>Recharts</li>
              <li>React-Leaflet</li>
              <li>React Flow</li>
            </ul>
          </div>
          <div>
            <h3 className="text-gray-500 text-xs uppercase tracking-wider mb-2">Backend</h3>
            <ul className="space-y-1 text-gray-400">
              <li>Express.js</li>
              <li>REST API</li>
              <li>JSON schemas</li>
            </ul>
          </div>
          <div>
            <h3 className="text-gray-500 text-xs uppercase tracking-wider mb-2">AI / ML</h3>
            <ul className="space-y-1 text-gray-400">
              <li>Anthropic Claude (LLM)</li>
              <li>OpenCV (CV placeholder)</li>
              <li>scikit-learn (IsolationForest)</li>
              <li>geopy (geospatial)</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Roadmap */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="glass-card p-6 mt-6"
      >
        <h2 className="section-title mb-3">Future Roadmap</h2>
        <ul className="space-y-2 text-sm text-gray-400">
          <li className="flex items-start gap-2">
            <span className="text-brand-400 mt-0.5">→</span>
            Swap heuristic CV for trained RDD2022 CNN/YOLO model
          </li>
          <li className="flex items-start gap-2">
            <span className="text-brand-400 mt-0.5">→</span>
            Satellite imagery integration for before/after comparison
          </li>
          <li className="flex items-start gap-2">
            <span className="text-brand-400 mt-0.5">→</span>
            Real-time drone photo ingestion with EXIF extraction
          </li>
          <li className="flex items-start gap-2">
            <span className="text-brand-400 mt-0.5">→</span>
            Feedback loop retraining pipeline
          </li>
        </ul>
      </motion.div>
    </div>
  );
}
