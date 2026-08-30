import { motion, animate, useMotionValue, useSpring } from 'motion/react';
import { useEffect, useRef } from 'react';

export const CINEMATIC = [0.22, 1, 0.36, 1];

export function Tilt({ children, className, max = 8 }) {
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 220, damping: 20 });
  const sry = useSpring(ry, { stiffness: 220, damping: 20 });

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * max);
    rx.set(-py * max);
  };
  const reset = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.div
      className={className}
      onMouseMove={onMove}
      onMouseLeave={reset}
      style={{
        rotateX: srx,
        rotateY: sry,
        transformPerspective: 900,
        transformStyle: 'preserve-3d',
      }}
    >
      {children}
    </motion.div>
  );
}

export function FadeUp({ children, delay = 0, y = 24, amount = 0.25, once = true, className }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount }}
      transition={{ duration: 0.7, ease: CINEMATIC, delay }}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({ children, gap = 0.07, delay = 0, amount = 0.2, className }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: gap, delayChildren: delay } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function Item({ children, y = 22, className }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y },
        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: CINEMATIC } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedNumber({ value, format = (v) => v, duration = 1.2, className }) {
  const ref = useRef(null);
  const formatRef = useRef(format);
  formatRef.current = format;
  const mv = useMotionValue(0);

  useEffect(() => {
    const controls = animate(mv, value, { duration, ease: CINEMATIC });
    const unsubscribe = mv.on('change', (v) => {
      if (ref.current) ref.current.textContent = formatRef.current(v);
    });
    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [value, duration, mv]);

  return (
    <span ref={ref} className={className}>
      {format(0)}
    </span>
  );
}

export function RevealText({ text, className, delay = 0, once = true }) {
  const words = text.split(' ');
  return (
    <motion.span
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount: 0.6 }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.06, delayChildren: delay } },
      }}
    >
      {words.map((w, i) => (
        <motion.span
          key={i}
          variants={{
            hidden: { opacity: 0, y: '0.4em', rotateX: -40 },
            show: {
              opacity: 1,
              y: 0,
              rotateX: 0,
              transition: { duration: 0.6, ease: CINEMATIC },
            },
          }}
          style={{ display: 'inline-block', transformStyle: 'preserve-3d' }}
        >
          {w}
          {'\u00A0'}
        </motion.span>
      ))}
    </motion.span>
  );
}
