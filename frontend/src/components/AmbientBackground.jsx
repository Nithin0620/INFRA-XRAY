import { memo, useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'motion/react';

function Layer({ mx, my, depth, children, style }) {
  const x = useTransform(mx, (v) => v * depth * 50);
  const y = useTransform(my, (v) => v * depth * 40);
  return (
    <motion.div
      className="absolute inset-0 transform-gpu will-change-transform"
      style={{ x, y, ...style }}
    >
      {children}
    </motion.div>
  );
}

const CUBE_FACES = [
  (s) => `translateZ(${s / 2}px)`,
  (s) => `rotateY(180deg) translateZ(${s / 2}px)`,
  (s) => `rotateY(90deg) translateZ(${s / 2}px)`,
  (s) => `rotateY(-90deg) translateZ(${s / 2}px)`,
  (s) => `rotateX(90deg) translateZ(${s / 2}px)`,
  (s) => `rotateX(-90deg) translateZ(${s / 2}px)`,
];

function Cube3D({ size = 90, className = '', duration = 24, left = '0%', top = '0%', z = 0 }) {
  return (
    <div
      className="absolute transform-gpu"
      style={{
        left,
        top,
        transform: `translateZ(${z}px)`,
        transformStyle: 'preserve-3d',
      }}
    >
      <motion.div
        className="relative"
        style={{ width: size, height: size, transformStyle: 'preserve-3d' }}
        animate={{ rotateX: [0, 360], rotateY: [0, 360], rotateZ: [0, 360] }}
        transition={{ duration, repeat: Infinity, ease: 'linear' }}
      >
        {CUBE_FACES.map((face, i) => (
          <div
            key={i}
            className={`absolute inset-0 border ${className}`}
            style={{ transform: face(size) }}
          />
        ))}
        <div
          className="absolute inset-[16%] border border-dashed"
          style={{ transform: CUBE_FACES[0](size) }}
        />
      </motion.div>
    </div>
  );
}

function GyroRing({ size = 260, className = '', duration = 26, top = '22%', left = '8%' }) {
  return (
    <div
      className="absolute transform-gpu"
      style={{ top, left, transform: 'rotateX(68deg) rotateY(-18deg)' }}
    >
      <motion.div
        className="relative"
        style={{ width: size, height: size, transformStyle: 'preserve-3d' }}
        animate={{ rotateZ: 360 }}
        transition={{ duration, repeat: Infinity, ease: 'linear' }}
      >
        <div className={`absolute inset-0 rounded-full border ${className}`} />
        <span className="absolute left-1/2 top-0 -ml-[5px] -mt-[5px] w-2.5 h-2.5 rounded-full bg-brand-accent/70 shadow-[0_0_12px_2px_rgba(144,88,49,0.5)]" />
        <span className="absolute left-0 top-1/2 -ml-[4px] -mt-[4px] w-2 h-2 rounded-full bg-brand-dark/30" />
      </motion.div>
    </div>
  );
}

function FloatBar({ className = '', duration = 7, top, left, w = 120, h = 18, delay = 0 }) {
  return (
    <motion.div
      className="absolute transform-gpu"
      style={{ top, left, width: w, height: h }}
      animate={{ y: [0, -26, 0], rotate: [0, 6, 0] }}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      <div
        className={`w-full h-full rounded-full ${className}`}
        style={{ transform: 'translateZ(40px)' }}
      />
    </motion.div>
  );
}

function Particles({ count = 18 }) {
  const reduce = useReducedMotion();
  const dots = Array.from({ length: count }, (_, i) => {
    const a = (i * 37 + 11) % 97;
    const b = (i * 53 + 29) % 91;
    return {
      id: i,
      left: `${8 + (a % 84)}%`,
      top: `${5 + (b % 90)}%`,
      size: 1 + (a % 3),
      duration: 9 + (a % 14),
      delay: a % 12,
      opacity: 0.15 + (a % 40) / 100,
      drift: i % 2 === 0 ? 30 : -30,
    };
  });

  if (reduce) return null;
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {dots.map((d) => (
        <motion.span
          key={d.id}
          className="absolute rounded-full bg-brand-accent transform-gpu"
          style={{
            left: d.left,
            top: d.top,
            width: d.size,
            height: d.size,
            opacity: d.opacity,
          }}
          animate={{ y: ['0vh', '-110vh'], x: [0, d.drift] }}
          transition={{ duration: d.duration, repeat: Infinity, ease: 'linear', delay: d.delay }}
        />
      ))}
    </div>
  );
}

function Scanline({ duration = 9, delay = 1.5, className = '' }) {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <motion.div
      className={`absolute left-0 right-0 h-[3px] scanline-grad transform-gpu ${className}`}
      initial={{ top: '-5%', opacity: 0 }}
      animate={{ top: ['-5%', '105%', '105%'], opacity: [0, 1, 0] }}
      transition={{
        duration,
        times: [0, 0.4, 1],
        repeat: Infinity,
        repeatDelay: 4,
        delay,
        ease: 'easeInOut',
      }}
    />
  );
}

function AmbientBackground() {
  const reduce = useReducedMotion();

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 50, damping: 22 });
  const sy = useSpring(my, { stiffness: 50, damping: 22 });

  const sceneRotX = useTransform(sy, (v) => v * 5);
  const sceneRotY = useTransform(sx, (v) => v * 7);

  const rafRef = useRef(null);

  useEffect(() => {
    if (reduce) return;
    const onMove = (e) => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        mx.set(e.clientX / window.innerWidth - 0.5);
        my.set(e.clientY / window.innerHeight - 0.5);
        rafRef.current = null;
      });
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [reduce, mx, my]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute inset-0 bg-[#fbfbfa]" />

      {/* ===== 3D WORLD ===== */}
      <div className="perspective-3d absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute inset-0 transform-gpu will-change-transform"
          style={{
            transformStyle: 'preserve-3d',
            rotateX: reduce ? 0 : sceneRotX,
            rotateY: reduce ? 0 : sceneRotY,
          }}
        >
          {/* Neon gradient blobs at different parallax depths */}
          <Layer mx={sx} my={sy} depth={1.2}>
            <div className="absolute -top-[15%] -left-[10%] w-[650px] h-[650px] rounded-full bg-gradient-to-tr from-amber-100/60 via-orange-50/40 to-transparent blur-2xl transform-gpu" />
          </Layer>
          <Layer mx={sx} my={sy} depth={0.6}>
            <div className="absolute top-[35%] -right-[15%] w-[700px] h-[700px] rounded-full bg-gradient-to-bl from-brand-accent/20 via-stone-200/60 to-transparent blur-2xl transform-gpu" />
          </Layer>
          <Layer mx={sx} my={sy} depth={1.8}>
            <div className="absolute -bottom-[20%] left-[25%] w-[600px] h-[600px] rounded-full bg-gradient-to-t from-stone-300/40 via-amber-50/30 to-transparent blur-xl transform-gpu" />
          </Layer>

          {/* 3D gyroscope rings */}
          <Layer mx={sx} my={sy} depth={0.9}>
            <GyroRing
              size={300}
              top="8%"
              left="6%"
              className="border-brand-accent/20"
              duration={30}
            />
          </Layer>
          <Layer mx={sx} my={sy} depth={1.4}>
            <GyroRing
              size={150}
              top="78%"
              left="44%"
              className="border-brand-dark/15"
              duration={18}
            />
          </Layer>

          {/* Wireframe cubes */}
          <Layer mx={sx} my={sy} depth={1.0}>
            <Cube3D
              size={96}
              left="16%"
              top="18%"
              z={60}
              className="border-brand-accent/30 rounded-xl"
              duration={28}
            />
          </Layer>
          <Layer mx={sx} my={sy} depth={1.6}>
            <Cube3D
              size={56}
              left="84%"
              top="64%"
              z={110}
              className="border-brand-dark/20 rounded-lg"
              duration={20}
            />
          </Layer>
          <Layer mx={sx} my={sy} depth={2.0}>
            <Cube3D
              size={40}
              left="72%"
              top="12%"
              z={140}
              className="border-stone-400/50 rounded-lg"
              duration={16}
            />
          </Layer>

          {/* Floating glass prisms */}
          <Layer mx={sx} my={sy} depth={1.3}>
            <FloatBar
              className="bg-gradient-to-r from-brand-accent/10 via-brand-accent/30 to-transparent border border-brand-accent/20"
              top="58%"
              left="10%"
              w={150}
              h={14}
            />
          </Layer>
          <Layer mx={sx} my={sy} depth={0.7}>
            <FloatBar
              className="bg-gradient-to-l from-brand-dark/10 to-transparent border border-brand-dark/15"
              top="74%"
              left="70%"
              w={110}
              h={12}
              duration={8}
              delay={1.2}
            />
          </Layer>

          {/* Holographic floor grid */}
          <motion.div
            className="absolute inset-0 transform-gpu will-change-transform"
            style={{ transform: 'translateY(20vh)', transformStyle: 'preserve-3d' }}
          >
            <div className="absolute left-1/2 top-1/2 w-[240vw] h-[240vh] -translate-x-1/2 -translate-y-1/2 grid-floor" />
          </motion.div>

          {/* Particles */}
          <Particles />
        </motion.div>
      </div>

      {/* Blueprint micro-dot matrix */}
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage: 'radial-gradient(#905831 0.75px, transparent 0.75px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Cinematic scanlines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <Scanline duration={10} delay={2} />
        <Scanline duration={16} delay={7} className="opacity-40" />
      </div>
    </div>
  );
}

export default memo(AmbientBackground);
