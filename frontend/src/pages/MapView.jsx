import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, ArrowRight } from "lucide-react";
import { fetchProjects } from "../services/api";
import { formatINR, categoryIcon, riskScoreColor } from "../lib/utils";

export default function MapView() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchProjects()
      .then(setProjects)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Geographic <span className="text-brand-400">Risk</span> Overview
        </h1>
        <p className="text-gray-500 mt-1">Portfolio-level view of all infrastructure projects</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map placeholder — will be replaced with Leaflet in Phase 8 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 glass-card min-h-[500px] flex items-center justify-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-brand-900/20 via-transparent to-brand-900/10" />
          <div className="text-center z-10">
            <MapPin className="w-12 h-12 text-brand-400/50 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Interactive map will be rendered here</p>
            <p className="text-gray-600 text-xs mt-1">React-Leaflet integration coming in Phase 8</p>
          </div>

          {/* Mini project cards overlaid on map area */}
          <div className="absolute bottom-4 left-4 right-4 flex gap-2 overflow-x-auto pb-2">
            {projects.map((p) => {
              const coords = p.gps_boundary?.coordinates;
              const center = coords?.[Math.floor(coords.length / 2)];
              return (
                <button
                  key={p.project_id}
                  onClick={() => setSelected(p)}
                  className={`shrink-0 glass-card px-3 py-2 text-left text-xs transition-all hover:bg-white/[0.06] ${
                    selected?.project_id === p.project_id ? "border-brand-500/40 bg-brand-500/5" : ""
                  }`}
                >
                  <div className="font-medium text-gray-300 flex items-center gap-1.5">
                    {categoryIcon(p.category)} {p.project_name.split(",")[0]}
                  </div>
                  <div className="text-gray-500 mt-0.5">
                    {p.state} · Risk: {p.risk_score ?? "—"}
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Project list sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          <h2 className="section-title">
            <MapPin className="w-4 h-4 text-brand-400" /> Projects
          </h2>
          {projects.map((p, i) => (
            <motion.div
              key={p.project_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.05 }}
              className={`glass-card p-4 cursor-pointer transition-all hover:bg-white/[0.04] ${
                selected?.project_id === p.project_id ? "border-brand-500/40 bg-brand-500/5" : ""
              }`}
              onClick={() => setSelected(p)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-200 flex items-center gap-1.5">
                    {categoryIcon(p.category)} {p.project_name.split(",")[0]}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {p.state} · {formatINR(p.sanctioned_amount_inr)}
                  </div>
                </div>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    backgroundColor: `${riskScoreColor(p.risk_score)}20`,
                    color: riskScoreColor(p.risk_score),
                  }}
                >
                  {p.risk_score ?? "—"}
                </div>
              </div>
              {p.gps_boundary?.coordinates?.[0] && (
                <div className="text-[10px] text-gray-600 font-mono mt-2">
                  [{p.gps_boundary.coordinates[0].join(", ")}]
                </div>
              )}
              <Link
                to={`/project/${p.project_id}`}
                className="text-xs text-brand-400 hover:text-brand-300 mt-2 inline-flex items-center gap-1"
              >
                View details <ArrowRight className="w-3 h-3" />
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
