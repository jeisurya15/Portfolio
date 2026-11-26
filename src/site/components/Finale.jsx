import { useEffect, useRef, useState } from 'react';
import { brand, finale } from '../content.js';
import { useReducedMotion } from '../hooks/useReducedMotion.js';
import { pinProgress, range } from '../lib/math.js';
import { onFrame } from '../lib/scroll.js';
import { createFinale } from '../three/finale.js';

/**
 * The closing scene. The section pins while a particle galaxy unwinds and
 * condenses into "LET'S TALK"; once the words have formed, the ways to reach
 * me rise in underneath. Keeps the #contact anchor the header links to.
 */

const SECTION_VH = 320;

const istTime = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export function Finale() {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const hintRef = useRef(null);
  const ctaRef = useRef(null);
  const reduced = useReducedMotion();
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;
  const [time, setTime] = useState(() => istTime.format(Date.now()));

  useEffect(() => {
    const id = window.setInterval(() => setTime(istTime.format(Date.now())), 15000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    let scene = null;
    try {
      scene = createFinale(canvasRef.current);
    } catch (e) {
      console.warn('Finale scene unavailable', e);
    }
    // Re-sample the words once the display font has loaded.
    document.fonts?.ready.then(() => scene?.resize());
    const ro = new ResizeObserver(() => scene?.resize());
    ro.observe(canvasRef.current);

    const stop = onFrame((t) => {
      const root = rootRef.current;
      if (!root) return;
      const { p, rect, vh } = pinProgress(root);
      if (rect.bottom < 0 || rect.top > vh) return;
      const still = reducedRef.current;
      const form = still ? 1 : range(p, 0.02, 0.62);
      scene?.render(t, form, !still);

      const cta = still ? 1 : range(p, 0.6, 0.78);
      ctaRef.current.style.opacity = String(cta);
      ctaRef.current.style.transform = `translate3d(0, ${(1 - cta) * 40}px, 0)`;
      ctaRef.current.style.pointerEvents = cta > 0.5 ? 'auto' : 'none';
      hintRef.current.style.opacity = String(1 - range(p, 0.05, 0.25));
    });
    return () => {
      stop();
      ro.disconnect();
      scene?.dispose();
    };
  }, []);

  return (
    <section
      ref={rootRef}
      id="contact"
      aria-labelledby="finale-title"
      className="relative bg-void"
      style={{ height: `${SECTION_VH}svh` }}
    >
      <div className="sticky top-0 h-screen-s overflow-hidden">
        {/* Deep-space wash behind the galaxy. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_55%,rgba(111,182,255,0.12),transparent_60%)]"
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 size-full"
          role="img"
          aria-label="A galaxy of particles that gathers into the words: Let’s talk."
        />

        <div className="pointer-events-none relative flex h-full flex-col justify-between px-4 pt-20 pb-8 sm:px-6 md:px-[6vw] md:pt-24 md:pb-12">
          <div className="flex items-start justify-between gap-6">
            <p className="font-mono text-label text-earth uppercase">{finale.eyebrow}</p>
            <p ref={hintRef} className="font-mono text-label text-regolith/50 uppercase">
              {finale.hint}
            </p>
          </div>

          <h2 id="finale-title" className="sr-only">
            Let’s talk
          </h2>

          <div
            ref={ctaRef}
            className="flex flex-col items-center gap-6 text-center"
            style={{ opacity: 0 }}
          >
            <p className="max-w-[34rem] text-body text-regolith/75">{finale.body}</p>
            <a
              href={`mailto:${brand.email}`}
              className="group inline-flex items-center gap-3 rounded-full bg-white px-7 py-4 font-mono text-label text-void uppercase transition-colors hover:bg-earth md:px-9 md:py-5"
            >
              {brand.email}
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </a>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 font-mono text-label uppercase">
              <a href={brand.github} target="_blank" rel="noreferrer" className="text-white hover:text-earth">
                GitHub ↗
              </a>
              <a href={brand.linkedin} target="_blank" rel="noreferrer" className="text-white hover:text-earth">
                LinkedIn ↗
              </a>
              <span className="text-regolith/50">
                Coimbatore · <span className="text-white tabular-nums">{time}</span> IST
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
