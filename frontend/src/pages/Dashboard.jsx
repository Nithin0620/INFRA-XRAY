import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { AlertTriangle, TrendingUp, IndianRupee, FolderOpen, ArrowRight } from 'lucide-react';
import { fetchProjects } from '../services/api';
import { formatINR, severityColor, categoryIcon } from '../lib/utils';
import { FadeUp, Stagger, Item, AnimatedNumber, RevealText } from '../lib/motion';

const reticleDuration = 26;
const reticlePulse = 3;

function MetricsRow({ projects, criticalCount, totalValue, avgRisk }) {
  return (
    <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Item className="metric-card">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-brand-accent">
            <FolderOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="metric-value">
              <AnimatedNumber value={projects.length} />
            </div>
            <div className="metric-label">Total Projects</div>
          </div>
        </div>
      </Item>

      <Item className="metric-card">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 text-rose-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="metric-value text-rose-600">
              <AnimatedNumber value={criticalCount} />
            </div>
            <div className="metric-label">Flagged Projects</div>
          </div>
        </div>
      </Item>

      <Item className="metric-card">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-700">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <div className="metric-value text-brand-dark">
              <AnimatedNumber value={totalValue} format={(v) => formatINR(v)} />
            </div>
            <div className="metric-label">Total Value</div>
          </div>
        </div>
      </Item>

      <Item className="metric-card">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center border border-stone-200 text-stone-700">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="metric-value">
              <AnimatedNumber value={avgRisk} format={(v) => Math.round(v)} />
              <span className="text-lg text-brand-muted font-semibold">/100</span>
            </div>
            <div className="metric-label">Avg Risk Score</div>
          </div>
        </div>
      </Item>
    </Stagger>
  );
}

function StateTicker({ states }) {
  if (states.length === 0) return null;
  const list = [...states, ...states];
  return (
    <div className="relative overflow-hidden py-3 mb-8 select-none">
      <motion.div
        className="flex gap-10 whitespace-nowrap w-max"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
      >
        {list.map((s, i) => (
          <div
            key={i}
            className="flex items-center gap-10 text-[11px] font-mono uppercase tracking-[0.25em] text-brand-muted"
          >
            <span>{s}</span>
            <span className="text-brand-accent/60">◆</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

function Reticle() {
  return (
    <div className="hidden lg:flex flex-col items-end justify-start">
      <div className="relative w-44 h-44 opacity-[0.16]">
        <motion.div
          className="absolute inset-0 rounded-full border border-brand-accent/40"
          style={{ borderStyle: 'dashed' }}
          animate={{ rotate: 360 }}
          transition={{ duration: reticleDuration, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute inset-4 rounded-full border border-brand-accent/30"
          animate={{ rotate: -360 }}
          transition={{ duration: reticleDuration * 0.6, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute inset-0 rounded-full border border-brand-accent/20"
          animate={{ scale: [1, 1.12, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: reticlePulse, repeat: Infinity, ease: 'easeInOut' }}
        />
        <span className="absolute left-1/2 top-0 -translate-x-1/2 w-px h-full bg-brand-accent/40" />
        <span className="absolute top-1/2 left-0 -translate-y-1/2 h-px w-full bg-brand-accent/40" />
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-brand-accent"
          animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }}
          transition={{ duration: reticlePulse, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      <motion.span
        className="text-[10px] font-mono uppercase tracking-[0.3em] text-brand-muted mt-2"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        ● Scanning portfolio
      </motion.span>
    </div>
  );
}

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState('risk_score');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => {
    fetchProjects()
      .then(setProjects)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const sorted = [...projects].sort((a, b) => {
    const aVal = a[sortKey] ?? -1;
    const bVal = b[sortKey] ?? -1;
    return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
  });

  const totalValue = projects.reduce((s, p) => s + (p.sanctioned_amount_inr || 0), 0);
  const criticalCount = projects.filter(
    (p) => p.severity_label === 'Critical' || p.severity_label === 'High'
  ).length;
  const avgRisk = projects.length
    ? Math.round(projects.reduce((s, p) => s + (p.risk_score || 0), 0) / projects.length)
    : 0;

  const states = [...new Set(projects.map((p) => p.state).filter(Boolean))];

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <motion.div
            className="w-10 h-10 rounded-full border-2 border-brand-500 border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
          />
          <motion.p
            className="text-sm text-brand-muted"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          >
            Loading projects...
          </motion.p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Cinematic Hero */}
      <section className="relative mb-10">
        <div className="relative z-10 flex items-start justify-between gap-8">
          <div>
            <Stagger className="flex flex-wrap items-center gap-2 mb-4" gap={0.05}>
              {['AI Forensic Engine', 'Live Evidence Graph', 'Tender Compliance'].map((chip) => (
                <Item
                  key={chip}
                  className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted bg-white/70 border border-stone-200 rounded-full px-3 py-1.5 backdrop-blur-md"
                >
                  <span className="text-brand-accent mr-1">●</span>
                  {chip}
                </Item>
              ))}
            </Stagger>

            <h1 className="hero-headline">
              <span className="block">
                <RevealText text="Infrastructure" delay={0.05} />
              </span>
              <span className="block text-brand-accent">
                <RevealText text="Verification" delay={0.25} />
              </span>
            </h1>

            <motion.p
              className="subtitle mt-4 text-brand-muted"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
            >
              AI-powered cross-verification of public infrastructure tenders & evidence
            </motion.p>

            <motion.div
              className="mt-6 flex flex-wrap items-center gap-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85, duration: 0.6 }}
            >
              <motion.div whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <Link to="/map" className="btn-primary flex items-center gap-2">
                  Explore Risk Map <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
              <motion.div whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <Link
                  to="/upload"
                  className="glass-btn w-auto px-6 text-xs font-semibold uppercase tracking-wider text-brand-dark flex items-center"
                >
                  Upload Evidence
                </Link>
              </motion.div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <Reticle />
          </motion.div>
        </div>
      </section>

      <StateTicker states={states} />

      {/* Metrics */}
      <MetricsRow
        projects={projects}
        criticalCount={criticalCount}
        totalValue={totalValue}
        avgRisk={avgRisk}
      />

      {/* Portfolio Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Risk Distribution Chart */}
        <FadeUp delay={0.15} className="glass-card p-6 lg:col-span-1 flex flex-col justify-between">
          <div className="mb-2">
            <h3 className="text-base font-bold text-brand-text">Portfolio Risk Distribution</h3>
            <p className="text-xs text-brand-muted">Tenders categorized by severity level</p>
          </div>
          <div className="h-52 w-full flex items-center justify-center">
            <div className="w-full space-y-3">
              {[
                {
                  label: 'Critical Risk (71-100)',
                  count: projects.filter((p) => (p.risk_score || 0) >= 71).length,
                  color: 'bg-rose-500',
                  textColor: 'text-rose-600',
                },
                {
                  label: 'High Risk (46-70)',
                  count: projects.filter(
                    (p) => (p.risk_score || 0) >= 46 && (p.risk_score || 0) < 71
                  ).length,
                  color: 'bg-amber-500',
                  textColor: 'text-amber-600',
                },
                {
                  label: 'Moderate Risk (21-45)',
                  count: projects.filter(
                    (p) => (p.risk_score || 0) >= 21 && (p.risk_score || 0) < 46
                  ).length,
                  color: 'bg-amber-400',
                  textColor: 'text-amber-700',
                },
                {
                  label: 'Low / Clean (0-20)',
                  count: projects.filter((p) => (p.risk_score || 0) < 21).length,
                  color: 'bg-emerald-500',
                  textColor: 'text-emerald-600',
                },
              ].map((item, i) => {
                const pct = projects.length ? (item.count / projects.length) * 100 : 0;
                return (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1 font-medium">
                      <span className="text-brand-muted">{item.label}</span>
                      <span className={`font-bold font-mono ${item.textColor}`}>
                        {item.count} ({Math.round(pct)}%)
                      </span>
                    </div>
                    <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden border border-stone-200/50">
                      <motion.div
                        className={`h-full rounded-full ${item.color}`}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${pct}%` }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.9,
                          delay: 0.15 + i * 0.1,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </FadeUp>

        {/* Project Comparison Bar Chart */}
        <FadeUp delay={0.25} className="glass-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-base font-bold text-brand-text">
                Sanctioned Value vs Risk Severity
              </h3>
              <p className="text-xs text-brand-muted">
                Comparing financial exposure against verified risk
              </p>
            </div>
            <motion.span
              className="text-[11px] font-medium text-brand-accent bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2.6, repeat: Infinity }}
            >
              ● High Risk = Immediate Audit
            </motion.span>
          </div>

          <div className="h-52 w-full">
            <div className="h-full flex items-end gap-3 pt-6 pb-2 px-2 overflow-x-auto">
              {projects.map((p, i) => {
                const maxVal = Math.max(...projects.map((x) => x.sanctioned_amount_inr || 1));
                const heightPercent = Math.max(
                  15,
                  Math.round(((p.sanctioned_amount_inr || 0) / maxVal) * 100)
                );
                const isCrit = (p.risk_score || 0) >= 71;
                const isHigh = (p.risk_score || 0) >= 46 && (p.risk_score || 0) < 71;

                return (
                  <motion.div
                    key={p.project_id}
                    className="flex-1 min-w-[70px] flex flex-col items-center gap-2 group cursor-pointer"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 + i * 0.05, duration: 0.5 }}
                  >
                    <Link
                      to={`/project/${p.project_id}`}
                      className="flex flex-col items-center gap-2 w-full"
                    >
                      <span className="text-[10px] font-mono text-brand-muted group-hover:text-brand-text transition-colors">
                        {formatINR(p.sanctioned_amount_inr)}
                      </span>
                      <div className="w-full bg-stone-100 rounded-t-xl overflow-hidden flex items-end h-28 border border-stone-200 group-hover:border-brand-dark/40 transition-all">
                        <motion.div
                          className={`w-full rounded-t transition-all duration-500 ${
                            isCrit
                              ? 'bg-rose-500/85 group-hover:bg-rose-500'
                              : isHigh
                                ? 'bg-amber-500/85 group-hover:bg-amber-500'
                                : 'bg-stone-700/85 group-hover:bg-brand-dark'
                          }`}
                          initial={{ height: 0 }}
                          whileInView={{ height: `${heightPercent}%` }}
                          viewport={{ once: true }}
                          transition={{
                            duration: 0.8,
                            delay: 0.2 + i * 0.05,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                        />
                      </div>
                      <div className="text-center">
                        <div className="text-[11px] font-bold text-brand-text truncate max-w-[75px]">
                          {p.project_id}
                        </div>
                        <div
                          className="text-[10px] font-bold font-mono"
                          style={{ color: isCrit ? '#dc2626' : isHigh ? '#ea580c' : '#16a34a' }}
                        >
                          Risk: {p.risk_score ?? '—'}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </FadeUp>
      </div>

      {/* Projects Table */}
      <FadeUp
        delay={0.2}
        amount={0.1}
        className="glass-card overflow-hidden shadow-lg border border-stone-200"
      >
        <div className="p-6 border-b border-stone-200/60 bg-white/40 flex items-center justify-between">
          <h2 className="section-title text-base font-bold text-brand-text">
            Monitored Infrastructure Projects
          </h2>
          <span className="text-xs text-brand-muted font-medium bg-stone-100 px-3 py-1 rounded-full">
            {sorted.length} Entries
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200/60 bg-stone-50/50 text-brand-muted text-xs uppercase tracking-wider font-semibold">
                {[
                  { key: 'project_name', label: 'Project' },
                  { key: 'state', label: 'State' },
                  { key: 'category', label: 'Type' },
                  { key: 'sanctioned_amount_inr', label: 'Value' },
                  { key: 'risk_score', label: 'Risk' },
                  { key: 'severity_label', label: 'Severity' },
                ].map(({ key, label }) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    className="px-6 py-3.5 text-left cursor-pointer hover:text-brand-dark transition-colors select-none"
                  >
                    <motion.span whileHover={{ x: 2 }} className="inline-block">
                      {label}
                      {sortKey === key && (
                        <span className="ml-1 text-brand-accent">
                          {sortDir === 'desc' ? '↓' : '↑'}
                        </span>
                      )}
                    </motion.span>
                  </th>
                ))}
                <th className="px-6 py-3.5 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, i) => (
                <motion.tr
                  key={p.project_id}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{ delay: 0.35 + i * 0.04, duration: 0.5 }}
                  className="border-b border-stone-200/40 hover:bg-white/90 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <motion.span
                        className="text-xl"
                        whileHover={{ rotate: [0, -12, 12, 0], scale: 1.15 }}
                        transition={{ duration: 0.45 }}
                      >
                        {categoryIcon(p.category)}
                      </motion.span>
                      <div>
                        <Link
                          to={`/project/${p.project_id}`}
                          className="font-semibold text-brand-text hover:text-brand-accent transition-colors line-clamp-1"
                        >
                          {p.project_name}
                        </Link>
                        <div className="text-xs text-brand-muted font-mono">{p.tender_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-brand-muted font-medium">{p.state}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs bg-stone-100 border border-stone-200 px-2.5 py-1 rounded-full text-brand-text capitalize font-medium">
                      {p.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-brand-text font-bold">
                    {formatINR(p.sanctioned_amount_inr)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-2 bg-stone-200 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          initial={{ width: 0 }}
                          whileInView={{ width: `${p.risk_score || 0}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, delay: 0.35 + i * 0.04 }}
                          style={{
                            backgroundColor:
                              (p.risk_score || 0) >= 71
                                ? '#dc2626'
                                : (p.risk_score || 0) >= 46
                                  ? '#ea580c'
                                  : (p.risk_score || 0) >= 21
                                    ? '#eab308'
                                    : '#16a34a',
                          }}
                        />
                      </div>
                      <span className="text-sm font-mono font-bold text-brand-text">
                        {p.risk_score ?? '—'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={severityColor(p.severity_label)}>{p.severity_label}</span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      to={`/project/${p.project_id}`}
                      className="glass-btn !w-8 !h-8 text-stone-500 hover:text-brand-dark transition-colors"
                      aria-label={`View details for ${p.project_name}`}
                      title={`View details for ${p.project_name}`}
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </FadeUp>
    </div>
  );
}
