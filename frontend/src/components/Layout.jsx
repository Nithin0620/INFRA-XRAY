import { useState, useCallback, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Map, Info, Upload } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import AmbientBackground from './AmbientBackground';
import { CINEMATIC } from '../lib/motion';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/upload', label: 'Upload', icon: Upload },
  { to: '/map', label: 'Map View', icon: Map },
  { to: '/about', label: 'About', icon: Info },
];

function CinematicIntro({ onDone }) {
  const reduce = useReducedMotion();

  useEffect(() => {
    const t = setTimeout(onDone, reduce ? 900 : 2900);
    return () => clearTimeout(t);
  }, [reduce, onDone]);

  const title = 'INFRA-XRAY';
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: '#0a0a0a' }}
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: CINEMATIC }}
    >
      {/* Letterbox bars */}
      <motion.div
        className="absolute inset-x-0 top-0 h-[16vh] bg-black"
        initial={{ y: '-100%' }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: CINEMATIC }}
        style={{ borderBottom: '1px solid rgba(144,88,49,0.25)' }}
      />
      <motion.div
        className="absolute inset-x-0 bottom-0 h-[16vh] bg-black"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: CINEMATIC }}
        style={{ borderTop: '1px solid rgba(144,88,49,0.25)' }}
      />

      {/* Center piece */}
      <div className="relative z-10 text-center px-6">
        <motion.div
          className="flex items-end justify-center gap-[0.08em] font-display text-[clamp(34px,6vw,64px)] text-brand-surface tracking-tight"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.09, delayChildren: 0.9 } },
          }}
        >
          {title.split('').map((ch, i) => (
            <motion.span
              key={i}
              variants={{
                hidden: { opacity: 0, y: '0.6em', rotateX: -60 },
                show: {
                  opacity: 1,
                  y: 0,
                  rotateX: 0,
                  transition: { duration: 0.55, ease: CINEMATIC },
                },
              }}
              style={{ transformStyle: 'preserve-3d' }}
              className={ch === '-' ? 'text-brand-accent' : undefined}
            >
              {ch}
            </motion.span>
          ))}
        </motion.div>

        <motion.div
          className="mx-auto mt-3 h-[2px] bg-gradient-to-r from-transparent via-brand-accent to-transparent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.7, ease: CINEMATIC, delay: 1.5 }}
        />

        <motion.p
          className="mt-3 text-[11px] sm:text-xs uppercase tracking-[0.35em] text-stone-400"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.75, ease: CINEMATIC }}
        >
          Infrastructure Evidence Verification
        </motion.p>
      </div>

      {/* Sweeping light */}
      <motion.div
        className="absolute inset-0 scanline-grad"
        initial={{ x: '-100%', opacity: 0 }}
        animate={{ x: ['-100%', '100%'], opacity: [0, 0.5, 0] }}
        transition={{ duration: 1.4, delay: 0.3, ease: 'easeInOut' }}
      />
    </motion.div>
  );
}

function AnimatedNavLink({ to, label, end }) {
  return (
    <motion.div whileHover={{ y: -1 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
      <NavLink
        to={to}
        end={end}
        aria-label={label}
        title={label}
        className={({ isActive }) =>
          `nav-link transition-colors duration-200 py-1 relative ${
            isActive
              ? 'text-brand-dark font-semibold'
              : 'text-brand-text opacity-70 hover:opacity-100 hover:text-brand-accent'
          }`
        }
      >
        {({ isActive }) => (
          <>
            {label}
            {isActive && (
              <motion.span
                layoutId="nav-underline"
                className="absolute left-0 right-0 -bottom-0.5 h-[2px] rounded-full bg-brand-accent"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </>
        )}
      </NavLink>
    </motion.div>
  );
}

export default function Layout() {
  const reduce = useReducedMotion();
  const location = useLocation();
  const [introGone, setIntroGone] = useState(() => sessionStorage.getItem('xray_intro') === '1');

  const finishIntro = useCallback(() => {
    sessionStorage.setItem('xray_intro', '1');
    setIntroGone(true);
  }, []);

  return (
    <div className="min-h-screen flex flex-col relative bg-[#ffffff] text-brand-text selection:bg-brand-accent/20">
      <AmbientBackground />

      {/* Readability Gradient */}
      <div className="readability-gradient z-0"></div>

      {/* Cinematic first-load intro */}
      <AnimatePresence>
        {!introGone && <CinematicIntro key="intro" onDone={finishIntro} />}
      </AnimatePresence>

      {/* Top Nav - Clean Frosted Liquid Glass Header */}
      <motion.header
        initial={reduce ? false : { y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: CINEMATIC, delay: 0.2 }}
        className="sticky top-0 z-50 bg-white/70 backdrop-blur-[20px] border-b border-stone-200/50 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
            <NavLink
              to="/"
              className="flex items-center gap-3 group transition-transform hover:scale-105 active:scale-95"
            >
              <div className="flex items-center gap-2">
                <motion.div
                  className="w-8 h-8 rounded-full border-2 border-brand-dark flex items-center justify-center font-display font-bold text-sm bg-brand-surface shadow-inner"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
                >
                  X
                </motion.div>
                <span className="brand-logo text-brand-dark tracking-tight">
                  INFRA<span className="text-brand-accent">XRAY</span>
                </span>
              </div>
            </NavLink>
          </motion.div>

          <nav className="flex items-center gap-8">
            {navItems.map(({ to, label }) => (
              <AnimatedNavLink key={to} to={to} label={label} end={to === '/'} />
            ))}
          </nav>
        </div>
      </motion.header>

      {/* Main Content with cinematic page transitions */}
      <main className="flex-1 relative z-10">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 16, scale: 0.992 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.992 }}
            transition={{ duration: 0.3, ease: CINEMATIC }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="py-8 text-center text-sm text-brand-muted relative z-10 font-sans font-medium border-t border-stone-200/40 mt-12 bg-white/40 backdrop-blur-md"
      >
        <motion.span
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          INFRA-XRAY — AI-Powered Infrastructure Evidence Verification
        </motion.span>
      </motion.footer>
    </div>
  );
}
