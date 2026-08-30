/* eslint-disable no-unused-vars */
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { FadeUp } from '../lib/motion';
import {
  MapPin,
  ArrowRight,
  Filter,
  Search,
  Layers,
  AlertTriangle,
  Camera,
  Compass,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import { fetchProjects } from '../services/api';
import { formatINR, categoryIcon, riskScoreColor, severityColor } from '../lib/utils';
import { createProjectIcon, createPhotoIcon } from '../components/ProjectMap';

function MapController({ center, bounds, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    } else if (center) {
      map.flyTo(center, zoom || 6, { duration: 1.2 });
    }
  }, [center, bounds, zoom, map]);
  return null;
}

export default function MapView() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProjects()
      .then((data) => {
        setProjects(data || []);
        if (data && data.length > 0) {
          // Select high risk project by default for flagship view
          const defaultProject = data.find((p) => p.project_id === 'proj_002') || data[0];
          setSelected(defaultProject);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (severityFilter !== 'ALL') {
        if (severityFilter === 'CRITICAL' && p.severity_label !== 'Critical') return false;
        if (severityFilter === 'HIGH' && p.severity_label !== 'High') return false;
        if (severityFilter === 'MODERATE' && p.severity_label !== 'Medium') return false;
        if (severityFilter === 'CLEAN' && p.severity_label !== 'Low') return false;
      }
      if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.project_name?.toLowerCase().includes(q);
        const matchesState = p.state?.toLowerCase().includes(q);
        const matchesContractor = p.contractor_name?.toLowerCase().includes(q);
        if (!matchesName && !matchesState && !matchesContractor) return false;
      }
      return true;
    });
  }, [projects, severityFilter, categoryFilter, searchQuery]);

  // Compute map bounds or center
  const { mapCenter, mapBounds, mapZoom } = useMemo(() => {
    if (selected && selected.gps_boundary?.coordinates?.length > 0) {
      const coords = selected.gps_boundary.coordinates;
      if (coords.length === 1) {
        return { mapCenter: [coords[0][0], coords[0][1]], mapBounds: null, mapZoom: 14 };
      }
      return {
        mapCenter: null,
        mapBounds: coords.map((c) => [c[0], c[1]]),
        mapZoom: 14,
      };
    }
    // Default pan to India center
    return { mapCenter: [22.5937, 78.9629], mapBounds: null, mapZoom: 5 };
  }, [selected]);

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <FadeUp className="mb-6" amount={0.2}>
        <h1 className="text-3xl font-bold tracking-tight">
          Geographic <span className="text-brand-400">Risk</span> Overview
        </h1>
        <p className="text-brand-muted mt-1">
          Interactive geospatial verification of all government infrastructure tenders across India
        </p>
      </FadeUp>

      {/* Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass-card p-4 mb-6 flex flex-wrap items-center gap-4 justify-between"
      >
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-brand-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search project, state..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/80 border border-stone-200 rounded-xl pl-9 pr-4 py-2 text-xs text-brand-text placeholder-stone-400 focus:outline-none focus:border-brand-accent/50 shadow-sm"
            />
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-1 bg-white/80 p-1 rounded-xl border border-stone-200 text-xs shadow-sm">
            {['ALL', 'CRITICAL', 'HIGH', 'CLEAN'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSeverityFilter(lvl)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  severityFilter === lvl
                    ? 'bg-brand-dark text-brand-surface shadow-sm'
                    : 'text-brand-muted hover:text-brand-text'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white/80 border border-stone-200 rounded-xl px-3 py-2 text-xs text-brand-text focus:outline-none focus:border-brand-accent/50 shadow-sm"
          >
            <option value="ALL">All Categories</option>
            <option value="road">Roads</option>
            <option value="bridge">Bridges</option>
            <option value="building">Buildings</option>
            <option value="pipeline">Pipelines</option>
          </select>
        </div>

        <div className="text-xs text-brand-muted flex items-center gap-1.5 font-medium">
          <Layers className="w-4 h-4 text-brand-accent" />
          Showing <span className="text-brand-text font-bold">
            {filteredProjects.length}
          </span> of {projects.length} projects
        </div>
      </motion.div>

      {/* Main Grid: Interactive Map + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 glass-card h-[600px] overflow-hidden relative z-0 flex flex-col shadow-lg border-stone-200"
        >
          <MapContainer
            center={mapCenter || [22.5937, 78.9629]}
            zoom={mapZoom || 5}
            style={{ height: '100%', width: '100%', background: '#f8fafc' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              maxZoom={19}
            />

            <MapController center={mapCenter} bounds={mapBounds} zoom={mapZoom} />

            {/* Render Markers for all visible projects */}
            {filteredProjects.map((p) => {
              const coords = p.gps_boundary?.coordinates || [];
              if (coords.length === 0) return null;
              const isSelected = selected?.project_id === p.project_id;
              const pos = coords[0];
              const isPolygon = p.gps_boundary?.type === 'Polygon';
              const scoreColor = riskScoreColor(p.risk_score);

              return (
                <div key={p.project_id}>
                  {/* Marker Pin */}
                  <Marker
                    position={[pos[0], pos[1]]}
                    icon={createProjectIcon(p.risk_score, isSelected)}
                    eventHandlers={{
                      click: () => setSelected(p),
                    }}
                  >
                    <Popup className="custom-leaflet-popup">
                      <div className="p-2 text-xs">
                        <div className="font-bold text-gray-900 flex items-center gap-1.5">
                          {categoryIcon(p.category)} {p.project_name}
                        </div>
                        <div className="text-gray-600 mt-1">
                          {p.state} · {formatINR(p.sanctioned_amount_inr)}
                        </div>
                        <div
                          className="mt-1.5 flex items-center gap-1 font-semibold"
                          style={{ color: scoreColor }}
                        >
                          Risk: {p.risk_score ?? 'N/A'}/100 ({p.severity_label})
                        </div>
                        <Link
                          to={`/project/${p.project_id}`}
                          className="mt-2 inline-flex items-center gap-1 text-brand-600 font-bold hover:underline"
                        >
                          Open project details <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </Popup>
                  </Marker>

                  {/* Draw Geometry if Selected */}
                  {isSelected && isPolygon && (
                    <Polygon
                      positions={coords}
                      pathOptions={{
                        color: scoreColor,
                        fillColor: scoreColor,
                        fillOpacity: 0.25,
                        weight: 3,
                        dashArray: p.risk_score >= 70 ? '6, 6' : undefined,
                      }}
                    />
                  )}

                  {isSelected && !isPolygon && (
                    <Polyline
                      positions={coords}
                      pathOptions={{
                        color: scoreColor,
                        weight: 4.5,
                        opacity: 0.9,
                        dashArray: p.risk_score >= 70 ? '8, 6' : undefined,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </MapContainer>

          {/* Quick Overlay Footer */}
          {selected && (
            <motion.div
              key={selected.project_id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              className="absolute bottom-4 left-4 right-4 z-10 glass-card p-3.5 flex items-center justify-between backdrop-blur-xl border border-white/80 shadow-md"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs"
                  style={{
                    backgroundColor: `${riskScoreColor(selected.risk_score)}15`,
                    color: riskScoreColor(selected.risk_score),
                    border: `2px solid ${riskScoreColor(selected.risk_score)}`,
                  }}
                >
                  {selected.risk_score ?? '—'}
                </div>
                <div>
                  <div className="text-sm font-bold text-brand-text line-clamp-1">
                    {selected.project_name}
                  </div>
                  <div className="text-xs text-brand-muted">
                    {selected.state} · {formatINR(selected.sanctioned_amount_inr)} ·{' '}
                    {selected.sanctioned_quantity} {selected.unit}
                  </div>
                </div>
              </div>
              <Link
                to={`/project/${selected.project_id}`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-dark hover:bg-[#333] text-brand-surface text-xs font-medium uppercase tracking-[0.04em] transition-all shrink-0 active:scale-95 shadow-sm"
              >
                Inspect Details{' '}
                <motion.span
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </motion.span>
              </Link>
            </motion.div>
          )}
        </motion.div>

        {/* Project List Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3 max-h-[600px] overflow-y-auto pr-1"
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="section-title text-base">
              <motion.span
                className="inline-flex"
                animate={{ rotate: 360 }}
                transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
              >
                <Compass className="w-4 h-4 text-brand-accent" />
              </motion.span>{' '}
              Monitored Projects
            </h2>
            <span className="text-xs text-brand-muted font-mono bg-stone-100 px-2 py-0.5 rounded-full">
              {filteredProjects.length} sites
            </span>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="glass-card p-6 text-center text-xs text-brand-muted">
              No projects matching selected filters.
            </div>
          ) : (
            filteredProjects.map((p, i) => {
              const isSelected = selected?.project_id === p.project_id;
              return (
                <motion.div
                  key={p.project_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.04 }}
                  whileHover={{ y: -3, x: 4, scale: 1.01 }}
                  className={`glass-card p-4 cursor-pointer transition-colors border-2 ${
                    isSelected
                      ? 'border-brand-dark bg-white shadow-md'
                      : 'border-white/80 hover:border-stone-300'
                  }`}
                  onClick={() => setSelected(p)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-brand-text flex items-center gap-1.5 line-clamp-1">
                        {categoryIcon(p.category)} {p.project_name}
                      </div>
                      <div className="text-xs text-brand-muted mt-1">
                        {p.state} · {formatINR(p.sanctioned_amount_inr)}
                      </div>
                    </div>
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{
                        backgroundColor: `${riskScoreColor(p.risk_score)}15`,
                        color: riskScoreColor(p.risk_score),
                        border: `1.5px solid ${riskScoreColor(p.risk_score)}`,
                      }}
                    >
                      {p.risk_score ?? '—'}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className={severityColor(p.severity_label)}>{p.severity_label}</span>
                    <Link
                      to={`/project/${p.project_id}`}
                      className="text-brand-accent hover:underline inline-flex items-center gap-1 font-semibold"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Audit Details <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </motion.div>
              );
            })
          )}
        </motion.div>
      </div>
    </div>
  );
}
