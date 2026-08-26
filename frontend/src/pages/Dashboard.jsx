import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  TrendingUp,
  IndianRupee,
  FolderOpen,
  ArrowRight,
} from "lucide-react";
import { fetchProjects } from "../services/api";
import { formatINR, severityColor, categoryIcon } from "../lib/utils";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState("risk_score");
  const [sortDir, setSortDir] = useState("desc");

  useEffect(() => {
    fetchProjects()
      .then(setProjects)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const sorted = [...projects].sort((a, b) => {
    const aVal = a[sortKey] ?? -1;
    const bVal = b[sortKey] ?? -1;
    return sortDir === "desc" ? bVal - aVal : aVal - bVal;
  });

  const totalValue = projects.reduce((s, p) => s + (p.sanctioned_amount_inr || 0), 0);
  const criticalCount = projects.filter((p) => p.severity_label === "Critical" || p.severity_label === "High").length;
  const avgRisk = projects.length
    ? Math.round(projects.reduce((s, p) => s + (p.risk_score || 0), 0) / projects.length)
    : 0;

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold tracking-tight">
          Infrastructure <span className="text-brand-400">Verification</span> Dashboard
        </h1>
        <p className="text-gray-500 mt-1">
          AI-powered cross-verification of government infrastructure projects
        </p>
      </motion.div>

      {/* Metrics */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        <motion.div variants={item} className="metric-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <div className="metric-value">{projects.length}</div>
              <div className="metric-label">Total Projects</div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={item} className="metric-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <div className="metric-value text-red-400">{criticalCount}</div>
              <div className="metric-label">Flagged Projects</div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={item} className="metric-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <div className="metric-value text-yellow-400">{formatINR(totalValue)}</div>
              <div className="metric-label">Total Value</div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={item} className="metric-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <div className="metric-value">{avgRisk}</div>
              <div className="metric-label">Avg Risk Score</div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Projects Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card overflow-hidden"
      >
        <div className="p-5 border-b border-white/5">
          <h2 className="section-title">Projects</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-gray-500 text-xs uppercase tracking-wider">
                {[
                  { key: "project_name", label: "Project" },
                  { key: "state", label: "State" },
                  { key: "category", label: "Type" },
                  { key: "sanctioned_amount_inr", label: "Value" },
                  { key: "risk_score", label: "Risk" },
                  { key: "severity_label", label: "Severity" },
                ].map(({ key, label }) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    className="px-5 py-3 text-left cursor-pointer hover:text-gray-300 transition-colors select-none"
                  >
                    {label}
                    {sortKey === key && (
                      <span className="ml-1">{sortDir === "desc" ? "↓" : "↑"}</span>
                    )}
                  </th>
                ))}
                <th className="px-5 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, i) => (
                <motion.tr
                  key={p.project_id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                  className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{categoryIcon(p.category)}</span>
                      <div>
                        <Link
                          to={`/project/${p.project_id}`}
                          className="font-medium text-gray-200 hover:text-brand-400 transition-colors line-clamp-1"
                        >
                          {p.project_name}
                        </Link>
                        <div className="text-xs text-gray-500 font-mono">{p.tender_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-400">{p.state}</td>
                  <td className="px-5 py-4">
                    <span className="text-xs bg-white/5 px-2 py-1 rounded-full text-gray-300 capitalize">
                      {p.category}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-300 font-medium">
                    {formatINR(p.sanctioned_amount_inr)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${p.risk_score || 0}%`,
                            backgroundColor:
                              (p.risk_score || 0) >= 71
                                ? "#dc2626"
                                : (p.risk_score || 0) >= 46
                                ? "#ea580c"
                                : (p.risk_score || 0) >= 21
                                ? "#eab308"
                                : "#16a34a",
                          }}
                        />
                      </div>
                      <span className="text-sm font-mono text-gray-400">{p.risk_score ?? "—"}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={severityColor(p.severity_label)}>
                      {p.severity_label}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <Link
                      to={`/project/${p.project_id}`}
                      className="text-gray-500 hover:text-brand-400 transition-colors focus-visible:ring-2 focus-visible:outline-none rounded"
                      aria-label={`View details for ${p.project_name}`}
                      title={`View details for ${p.project_name}`}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
