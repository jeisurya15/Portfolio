import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { stack } from '../content.js';
import { useReducedMotion } from '../hooks/useReducedMotion.js';
import { lockScroll, onFrame } from '../lib/scroll.js';

/**
 * The toolkit as a grid of floating glass boxes. Each box is backlit in its
 * own colour; inside, the tools' logos orbit a small moon, passing in front
 * of it and behind. Clicking a box morphs it into a detail panel (shared
 * layout animation) with every tool, its logo and a note.
 */

const DEVICON = 'https://cdn.jsdelivr.net/gh/devicons/devicon@v2.16.0/icons/';
const EASE = [0.22, 1, 0.36, 1];

// ------------------------------------------------------------------ logos

const GLYPHS = {
  schema: <path d="M4 5h6v4H4zM14 15h6v4h-6zM14 5h6v4h-6zM7 9v4h10v2M17 9v6" />,
  jwt: <path d="M12 3v5M12 16v5M3 12h5M16 12h5M5.6 5.6l3.5 3.5M14.9 14.9l3.5 3.5M5.6 18.4l3.5-3.5M14.9 9.1l3.5-3.5" />,
  lock: <path d="M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3M12 14.5v2.5" />,
  shield: <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6zM9 12l2 2 4-4" />,
  gauge: <path d="M4 16a8 8 0 1 1 16 0M12 16l4-5M8 16h8" />,
  chili: <path d="M7 17c5 1 10-3 11-9M18 8c0-2 1-3 2-3M7 17c-2 0-3-1-3-2 2 0 5-2 7-5" />,
  cubes: <path d="M12 3l7 4v8l-7 4-7-4V7zM12 11l7-4M12 11L5 7M12 11v8" />,
  tree: <path d="M12 4v4M6 14v-2h12v2M12 8v4M4 14h4v4H4zM16 14h4v4h-4zM10 3h4v4h-4z" />,
  cylinder: <path d="M5 6c0-1.7 3.1-3 7-3s7 1.3 7 3v12c0 1.7-3.1 3-7 3s-7-1.3-7-3zM5 6c0 1.7 3.1 3 7 3s7-1.3 7-3M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3" />,
  check: <path d="M4 12l5 5L20 6" />,
};

function Glyph({ name, accent }) {
  return (
    <svg viewBox="0 0 24 24" className="size-full" aria-hidden="true">
      <circle cx="12" cy="12" r="11.5" fill={`${accent}22`} stroke={`${accent}99`} strokeWidth="0.8" />
      <g
        fill="none"
        stroke={accent}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="translate(4.8 4.8) scale(0.6)"
      >
        {GLYPHS[name] ?? GLYPHS.check}
      </g>
    </svg>
  );
}

/** A tool's logo from Devicon, or a drawn badge if there is none (or it fails to load). */
function Logo({ item, accent }) {
  const [failed, setFailed] = useState(false);
  if (!item.icon || failed) return <Glyph name={item.glyph} accent={accent} />;
  return (
    <img
      src={`${DEVICON}${item.icon}.svg`}
      alt=""
      loading="lazy"
      draggable="false"
      onError={() => setFailed(true)}
      className={`size-full object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)] ${item.invert ? 'invert' : ''}`}
    />
  );
}

// ------------------------------------------------------------- moon + orbit

function Moon({ size }) {
  return (
    <div
      aria-hidden="true"
      className="toolkit-moon absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{ width: size, height: size, zIndex: 2 }}
    />
  );
}

/**
 * Where logo `i` of `n` sits on the orbit at time `t` (seconds).
 * Returns the angle in radians; the orbit draws it as an ellipse around the
 * moon, in front of it when sin(angle) > 0 and behind it otherwise.
 *
 * TODO(you): choose how the logos share the orbit — see the note in chat.
 */
function orbitAngle(i, n, t, speed) {
  return t * speed + (i / n) * Math.PI * 2;
}

function Orbit({ items, accent, rx, ry, logo, moon, speed = 0.35 }) {
  const rootRef = useRef(null);
  const refs = useRef([]);
  const reduced = useReducedMotion();

  useEffect(() => {
    const root = rootRef.current;
    let visible = false;
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    });
    io.observe(root);

    const place = (t) => {
      const n = items.length;
      refs.current.forEach((el, i) => {
        if (!el) return;
        const a = orbitAngle(i, n, t, speed);
        const depth = Math.sin(a); // -1 behind the moon … 1 in front
        const x = Math.cos(a) * rx;
        const y = depth * ry;
        const s = 0.72 + 0.28 * ((depth + 1) / 2);
        el.style.transform = `translate3d(${x - logo / 2}px, ${y - logo / 2}px, 0) scale(${s})`;
        el.style.zIndex = depth > 0 ? '3' : '1';
        el.style.opacity = String(0.45 + 0.55 * ((depth + 1) / 2));
      });
    };
    place(1.2);
    if (reduced) return () => io.disconnect();
    const stop = onFrame((time) => {
      if (visible) place(time / 1000);
    });
    return () => {
      stop();
      io.disconnect();
    };
  }, [items, rx, ry, logo, speed, reduced]);

  return (
    <div ref={rootRef} className="relative" style={{ width: rx * 2 + logo, height: ry * 2 + logo + moon * 0.4 }}>
      {/* The orbit path, faint. */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-white/10"
        style={{ width: rx * 2, height: ry * 2 }}
      />
      <Moon size={moon} />
      {items.map((item, i) => (
        <div
          key={item.name}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className="absolute top-1/2 left-1/2 will-change-transform"
          style={{ width: logo, height: logo }}
          title={item.name}
        >
          <Logo item={item} accent={accent} />
        </div>
      ))}
    </div>
  );
}

// --------------------------------------------------------------- glass box

function GlassBox({ group, index, onOpen }) {
  const tiltRef = useRef(null);

  const onMove = (e) => {
    const el = tiltRef.current;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty('--rx', `${(0.5 - py) * 10}deg`);
    el.style.setProperty('--ry', `${(px - 0.5) * 12}deg`);
    el.style.setProperty('--mx', `${px * 100}%`);
    el.style.setProperty('--my', `${py * 100}%`);
  };
  const onLeave = () => {
    const el = tiltRef.current;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };

  return (
    <div className="toolkit-float" style={{ animationDelay: `${index * -1.3}s` }}>
      <motion.button
        type="button"
        layoutId={`toolkit-${group.id}`}
        onClick={() => onOpen(group.id)}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        aria-haspopup="dialog"
        aria-label={`${group.name}: ${group.items.map((i) => i.name).join(', ')}. Open details.`}
        className="group relative block w-full text-left [perspective:900px] focus-visible:outline-none"
        style={{ borderRadius: 24, '--accent': group.accent }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        {/* Backlight behind the glass. */}
        <div aria-hidden="true" className="toolkit-backlight" />
        <div ref={tiltRef} className="toolkit-glass">
          <div className="flex items-baseline justify-between px-6 pt-5">
            <h3 className="font-display text-[0.95rem] tracking-[0.14em] text-white uppercase">{group.name}</h3>
            <span className="font-mono text-[0.7rem] text-white/45">{group.items.length}</span>
          </div>
          <div className="flex justify-center px-4 py-4">
            <Orbit items={group.items} accent={group.accent} rx={108} ry={34} logo={40} moon={64} />
          </div>
          <p className="flex items-center justify-between px-6 pb-5 text-[0.8125rem] text-white/50 transition-colors group-hover:text-white/85">
            <span>{group.blurb}</span>
            <span aria-hidden="true" className="ml-3 transition-transform group-hover:translate-x-1">
              →
            </span>
          </p>
        </div>
      </motion.button>
    </div>
  );
}

// ------------------------------------------------------------ detail panel

function Detail({ group, onClose }) {
  const closeRef = useRef(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4 sm:p-8">
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 bg-[#03050a]/70 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        onClick={onClose}
      />
      <motion.div
        layoutId={`toolkit-${group.id}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="toolkit-detail-title"
        className="toolkit-glass toolkit-glass--open relative max-h-[88svh] w-full max-w-[960px] overflow-y-auto"
        style={{ borderRadius: 28, '--accent': group.accent }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <div aria-hidden="true" className="toolkit-backlight toolkit-backlight--open" />
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-10 grid size-10 place-items-center rounded-full bg-white/8 text-white/80 ring-1 ring-white/15 transition-colors hover:bg-white/15 hover:text-white"
        >
          ✕
        </button>

        <motion.div
          className="grid gap-8 p-6 sm:p-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] md:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 0.25, duration: 0.4 } }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
        >
          <div className="flex flex-col items-center gap-4">
            <Orbit items={group.items} accent={group.accent} rx={150} ry={50} logo={52} moon={96} speed={0.25} />
          </div>
          <div>
            <h3
              id="toolkit-detail-title"
              className="font-display text-[1.5rem] tracking-[0.1em] text-white uppercase md:text-[1.9rem]"
            >
              {group.name}
            </h3>
            <p className="mt-2 text-body text-white/65">{group.blurb}</p>
            <ul className="mt-6 space-y-3">
              {group.items.map((item, i) => (
                <motion.li
                  key={item.name}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.3 + i * 0.06, duration: 0.45, ease: EASE } }}
                  className="flex items-start gap-4 rounded-2xl bg-white/[0.04] p-3 ring-1 ring-white/10"
                >
                  <span className="size-10 shrink-0">
                    <Logo item={item} accent={group.accent} />
                  </span>
                  <span>
                    <span className="block font-medium text-white">{item.name}</span>
                    <span className="block text-[0.875rem] text-white/60">{item.note}</span>
                  </span>
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

// -------------------------------------------------------------------- grid

export function Toolkit() {
  const [openId, setOpenId] = useState(null);
  const lastOpener = useRef(null);
  const open = stack.toolkit.find((g) => g.id === openId);

  useEffect(() => {
    lockScroll(Boolean(openId));
    return () => lockScroll(false);
  }, [openId]);

  const onOpen = (id) => {
    lastOpener.current = document.activeElement;
    setOpenId(id);
  };
  const onClose = () => {
    setOpenId(null);
    // Hand focus back to the box that opened the panel.
    requestAnimationFrame(() => lastOpener.current?.focus?.());
  };

  return (
    <div className="relative px-4 pt-10 pb-28 sm:px-6 md:px-[6vw] md:pb-40">
      {/* Coloured light behind the glass, so it has something to refract. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[10%] left-[8%] size-[38vw] rounded-full bg-[#2a5cff]/12 blur-[110px]" />
        <div className="absolute right-[6%] bottom-[12%] size-[34vw] rounded-full bg-[#7a4dff]/10 blur-[120px]" />
        <div className="absolute top-[40%] left-[45%] size-[26vw] rounded-full bg-[#18c7b4]/8 blur-[100px]" />
      </div>

      <div className="relative">
        <h3 className="font-display text-[1.25rem] tracking-[0.08em] text-white md:text-[1.6rem]">The full toolkit</h3>
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {stack.toolkit.map((group, i) => (
            <li key={group.id}>
              <GlassBox group={group} index={i} onOpen={onOpen} />
            </li>
          ))}
        </ul>

        <h3 className="mt-16 font-display text-[1.1rem] tracking-[0.08em] text-white">Certificates</h3>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stack.certificates.map((c) => {
            const [issuer, title] = c.split(' · ');
            return (
              <li key={c} className="toolkit-glass toolkit-glass--flat px-5 py-4" style={{ '--accent': '#6fb6ff' }}>
                <span className="block text-[0.8125rem] text-white/50">{issuer}</span>
                <span className="mt-1 block text-[0.9375rem] text-white">{title}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <AnimatePresence>{open && <Detail key={open.id} group={open} onClose={onClose} />}</AnimatePresence>
    </div>
  );
}
