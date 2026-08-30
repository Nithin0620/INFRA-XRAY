import { motion } from 'motion/react';
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
  Sparkles,
  Radar,
  Cpu,
  Activity,
} from 'lucide-react';
import { FadeUp, Stagger, Item, AnimatedNumber, Tilt, RevealText, CINEMATIC } from '../lib/motion';

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

function CornerBrackets() {
  const corner = 'absolute w-5 h-5 border-brand-accent/60';
  const edges = [
    { pos: 'top-3 left-3 border-t-2 border-l-2', rx: 0, ry: 0 },
    { pos: 'top-3 right-3 border-t-2 border-r-2', rx: 0, ry: 1 },
    { pos: 'bottom-3 left-3 border-b-2 border-l-2', rx: 1, ry: 0 },
    { pos: 'bottom-3 right-3 border-b-2 border-r-2', rx: 1, ry: 1 },
  ];
  return (
    <div className="absolute inset-0 pointer-events-none">
      {edges.map((e, i) => (
        <motion.div
          key={i}
          className={`${corner} ${e.pos}`}
          initial={{ scaleX: 0, scaleY: 0 }}
          animate={{ scaleX: 1, scaleY: 1 }}
          transition={{ duration: 0.5, delay: 0.4 + i * 0.12, ease: CINEMATIC }}
        />
      ))}
    </div>
  );
}

function GearGraphic() {
  return (
    <div className="relative w-64 h-64 hidden md:block">
      {/* Radar sweep */}
      <motion.div
        className="absolute inset-0 rounded-full border border-brand-accent/30"
        animate={{ rotate: 360 }}
        transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
        style={{
          background:
            'conic-gradient(from 0deg, rgba(244,162,97,0.18), transparent 22%, transparent 100%)',
        }}
      />
      {/* Static rings */}
      <div className="absolute inset-6 rounded-full border border-dashed border-brand-accent/40" />
      <div className="absolute inset-14 rounded-full border border-brand-accent/20" />
      {/* Cross spokes */}
      <motion.div
        className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-brand-accent/40 to-transparent"
        animate={{ rotate: [0, 180, 360] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '50% 50%' }}
      />
      <motion.div
        className="absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-brand-accent/40 to-transparent"
        animate={{ rotate: [0, 180, 360] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '50% 50%' }}
      />
      {/* Center 3D cube */}
      <div className="absolute inset-0 flex items-center justify-center perspective-3d">
        <motion.div
          className="w-24 h-24 relative"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateX: [0, 360], rotateY: [0, 360] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
        >
          {[
            'translateZ(48px)',
            'rotateY(180deg) translateZ(48px)',
            'rotateY(90deg) translateZ(48px)',
            'rotateY(-90deg) translateZ(48px)',
            'rotateX(90deg) translateZ(48px)',
            'rotateX(-90deg) translateZ(48px)',
          ].map((t, i) => (
            <div
              key={i}
              className="absolute inset-0 border border-brand-accent/50 rounded-lg flex items-center justify-center"
              style={{ transform: t }}
            >
              <Radar className="w-6 h-6 text-brand-accent/60" />
            </div>
          ))}
        </motion.div>
      </div>
      {/* Blinking status */}
      <motion.div
        className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 backdrop-blur border border-brand-accent/30"
        animate={{ opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 2.2, repeat: Infinity }}
      >
        <motion.span
          className="w-1.5 h-1.5 rounded-full bg-emerald-400"
          animate={{ scale: [1, 1.5, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
        <span className="text-[10px] font-mono uppercase tracking-widest text-stone-200">
          System Online
        </span>
      </motion.div>
    </div>
  );
}

function ModuleMarquee() {
  const list = [...stages, ...stages];
  return (
    <div className="relative overflow-hidden py-2 -mx-2">
      <motion.div
        className="flex gap-3 whitespace-nowrap w-max"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 34, repeat: Infinity, ease: 'linear' }}
      >
        {list.map(({ icon: Icon, label }, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider text-brand-muted bg-white/70 border border-stone-200 backdrop-blur-md"
          >
            <Icon className="w-3.5 h-3.5 text-brand-accent" />
            {label}
            <span className="text-brand-accent/50">✦</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

export default function About() {
  return (
    <div className="page-container max-w-5xl">
      {/* ===== Cinematic Hero Panel ===== */}
      <section className="relative overflow-hidden rounded-[44px] border border-stone-800 shadow-2xl mb-10">
        {/* Dark film base */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#141414] via-[#1c1a17] to-[#0c0b09]" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'radial-gradient(rgba(244,162,97,0.25) 0.6px, transparent 0.6px)',
            backgroundSize: '26px 26px',
          }}
        />

        <CornerBrackets />

        <div className="relative z-10 grid md:grid-cols-[1fr_auto] items-center gap-10 p-8 sm:p-12">
          <div>
            <Stagger className="flex items-center gap-2 mb-5" gap={0.08}>
              <Item className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-accent/15 border border-brand-accent/40 text-brand-accent text-[11px] font-bold uppercase tracking-[0.2em]">
                <Sparkles className="w-3 h-3" /> AI Evidence Pipeline
              </Item>
              <Item className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-stone-300 text-[11px] font-bold uppercase tracking-[0.2em]">
                <Activity className="w-3 h-3" /> 10 Modules Online
              </Item>
            </Stagger>

            <h1 className="text-[clamp(36px,6vw,64px)] font-medium tracking-[-0.04em] leading-[1.0] text-[#fafafa]">
              <span className="block">
                <RevealText text="HOW" delay={0.1} className="text-[#fafafa]" />
              </span>
              <span className="block">
                <RevealText text="INFRA-XRAY" delay={0.25} className="text-brand-accent" />
              </span>
              <span className="block text-stone-400">
                <RevealText text="VERIFIES" delay={0.4} />
              </span>
            </h1>

            <motion.p
              className="text-stone-300 mt-6 max-w-xl leading-relaxed"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.7, ease: CINEMATIC }}
            >
              An end-to-end AI-powered pipeline for verifying government infrastructure projects.
              Every{' '}
              <span className="text-brand-accent font-semibold">alert traces back to evidence</span>{' '}
              — from a sanctioned PDF to a geotagged site photo.
            </motion.p>

            <motion.div
              className="mt-8 flex flex-wrap gap-4"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.95, duration: 0.7, ease: CINEMATIC }}
            >
              <span className="flex items-center gap-2 text-xs font-mono text-stone-400">
                <motion.span
                  className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                  animate={{ opacity: [1, 0.2, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
                DATA: {stages.length} STAGES ACTIVE
              </span>
              <span className="flex items-center gap-2 text-xs font-mono text-stone-400">
                <motion.span
                  className="w-1.5 h-1.5 rounded-full bg-brand-accent"
                  animate={{ opacity: [1, 0.2, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                />
                TRACEABILITY: 100%
              </span>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.8, ease: CINEMATIC }}
          >
            <GearGraphic />
          </motion.div>
        </div>

        {/* Bottom module ticker */}
        <div className="relative z-10 border-t border-white/10 bg-black/30 backdrop-blur px-6 py-3">
          <ModuleMarquee />
        </div>
      </section>

      {/* ===== Stats Band ===== */}
      <Stagger className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12" gap={0.12}>
        {[
          { value: stages.length, suffix: '', label: 'Automated Stages', sub: 'end-to-end' },
          { value: 4, suffix: '+', label: 'AI / ML Engines', sub: 'LLM · Vision · ML · Geo' },
          { value: 3, suffix: '', label: 'Verification Domains', sub: 'doc · spatial · financial' },
          { value: 100, suffix: '%', label: 'Evidence-Traced', sub: 'every flag → source' },
        ].map(({ value, suffix, label, sub }) => (
          <Item key={label} className="glass-card p-5 text-center">
            <div className="text-3xl font-bold tracking-tight text-brand-dark">
              <AnimatedNumber value={value} format={(v) => Math.round(v) + suffix} />
            </div>
            <div className="text-sm font-semibold text-brand-text mt-1">{label}</div>
            <div className="text-[11px] text-brand-muted mt-0.5 font-mono">{sub}</div>
          </Item>
        ))}
      </Stagger>

      {/* ===== Pipeline Section ===== */}
      <div className="mb-14">
        <FadeUp amount={0.1} className="mb-8 flex items-center gap-3">
          <h2 className="text-2xl font-bold tracking-tight text-brand-text">
            The Verification Pipeline
          </h2>
          <span className="text-xs font-mono bg-brand-accent/10 text-brand-accent border border-brand-accent/25 px-3 py-1 rounded-full uppercase tracking-wider">
            watch it build
          </span>
        </FadeUp>

        <div className="relative">
          {/* Energy rail */}
          <motion.div
            className="absolute left-6 top-0 bottom-0 w-[2px] rounded-full bg-gradient-to-b from-brand-accent/40 via-brand-accent/20 to-transparent origin-top"
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 1.6, ease: CINEMATIC }}
          />
          {/* Traveling pulse */}
          <motion.span
            className="absolute left-[19px] top-0 w-3 h-3 -ml-[5px] rounded-full bg-brand-accent shadow-[0_0_14px_3px_rgba(244,162,97,0.6)]"
            animate={{ top: ['0%', '100%'], opacity: [0, 1, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          />

          <Stagger className="space-y-5" gap={0.14} amount={0.06}>
            {stages.map(({ icon: Icon, label, description, type }, i) => (
              <Item key={label} className="relative pl-16">
                {/* Node */}
                <motion.div
                  className={`absolute left-3 top-3 w-7 h-7 rounded-full bg-gradient-to-br ${typeColors[type]} border flex items-center justify-center z-10`}
                  whileHover={{ scale: 1.3, rotate: 360 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                >
                  <Icon className="w-3.5 h-3.5 text-stone-200" />
                </motion.div>

                {/* Card with 3D tilt */}
                <Tilt max={5} className={`glass-card p-4 bg-gradient-to-r ${typeColors[type]}`}>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="text-2xl font-black text-brand-accent/70 font-mono tracking-tighter">
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <h3 className="font-semibold text-[#1a1a1a]">{label}</h3>
                    <span className="ml-auto text-[10px] uppercase tracking-wider text-brand-muted bg-white/5 px-2 py-0.5 rounded-full border border-stone-200">
                      {typeLabels[type]}
                    </span>
                  </div>
                  <p className="text-sm text-brand-muted">{description}</p>
                </Tilt>

                {/* Arrow connector (except last) */}
                {i < stages.length - 1 && (
                  <motion.div
                    className="absolute left-[18px] top-12 text-brand-accent"
                    animate={{ y: [0, 5, 0], opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.18 }}
                  >
                    <ArrowRight className="w-3 h-3 rotate-90" />
                  </motion.div>
                )}
              </Item>
            ))}
          </Stagger>
        </div>
      </div>

      {/* ===== Tech Stack ===== */}
      <FadeUp className="glass-card p-6" amount={0.08}>
        <div className="flex items-center gap-3 mb-6">
          <Cpu className="w-5 h-5 text-brand-accent" />
          <h2 className="section-title">Technology Stack</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5 text-sm">
          {[
            {
              title: 'Frontend',
              items: [
                'React + Vite',
                'Tailwind CSS',
                'Motion (motion.dev)',
                'Recharts',
                'React-Leaflet',
                'React Flow',
              ],
            },
            {
              title: 'Backend',
              items: ['Express.js', 'REST API', 'JSON schemas'],
            },
            {
              title: 'AI / ML',
              items: [
                'Anthropic Claude (LLM)',
                'OpenCV (CV placeholder)',
                'scikit-learn (IsolationForest)',
                'geopy (geospatial)',
              ],
            },
          ].map((group, gi) => (
            <motion.div
              key={group.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: gi * 0.1, duration: 0.5, ease: CINEMATIC }}
            >
              <h3 className="text-brand-muted text-xs uppercase tracking-wider mb-3 border-b border-stone-200 pb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-accent" /> {group.title}
              </h3>
              <ul className="space-y-2">
                {group.items.map((item) => (
                  <li key={item} className="text-brand-muted flex items-center gap-2 group/item">
                    <motion.span className="text-brand-accent/60 group-hover/item:translate-x-1 inline-block transition-transform">
                      →
                    </motion.span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </FadeUp>

      {/* ===== Roadmap ===== */}
      <FadeUp className="glass-card p-6 mt-6" amount={0.08}>
        <div className="flex items-center gap-3 mb-5">
          <Radar className="w-5 h-5 text-brand-accent" />
          <h2 className="section-title">Future Roadmap</h2>
        </div>
        <div className="space-y-3">
          {[
            'Swap heuristic CV for trained RDD2022 CNN/YOLO model',
            'Satellite imagery integration for before/after comparison',
            'Real-time drone photo ingestion with EXIF extraction',
            'Feedback loop retraining pipeline',
          ].map((item, i) => (
            <motion.div
              key={item}
              className="flex items-start gap-3 p-3 rounded-xl border border-stone-200/60 bg-white/40"
              initial={{ opacity: 0, x: -18 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ delay: i * 0.08, duration: 0.45, ease: CINEMATIC }}
              whileHover={{ x: 6, borderColor: 'rgba(144,88,49,0.4)' }}
            >
              <motion.span
                className="w-7 h-7 rounded-lg bg-brand-accent/10 text-brand-accent border border-brand-accent/25 flex items-center justify-center text-xs font-bold font-mono shrink-0"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                {i + 1}
              </motion.span>
              <span className="text-sm text-brand-text font-medium">{item}</span>
            </motion.div>
          ))}
        </div>
      </FadeUp>
    </div>
  );
}
