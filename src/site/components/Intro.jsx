import { useEffect, useRef, useState } from 'react';
import { brand } from '../content.js';
import { lockScroll } from '../lib/scroll.js';
import { Mark } from './Chrome.jsx';

const MIN_MS = 1100; // long enough to read, short enough not to annoy
const MAX_MS = 2600; // never hold the page hostage on a slow connection
const LINES = ['init runtime', 'load modules', 'render globe', 'ready'];

/**
 * A one-second boot sequence that covers three.js loading: the mark draws,
 * the wordmark resolves, a few boot lines tick past, then it lifts away.
 * Skipped entirely for reduced-motion users and on repeat visits in a session.
 */
export function Intro() {
  const [phase, setPhase] = useState(() => (shouldSkip() ? 'done' : 'boot'));
  const [line, setLine] = useState(0);
  const barRef = useRef(null);

  useEffect(() => {
    if (phase !== 'boot') return undefined;
    const root = document.documentElement;
    root.classList.add('is-booting');
    // The scroll loop starts in a later effect; lock on the next frame.
    const raf = requestAnimationFrame(() => lockScroll(true));

    const start = performance.now();
    let heroReady = Boolean(window.__heroReady);
    const onReady = () => {
      heroReady = true;
    };
    window.addEventListener('hero:ready', onReady);

    const tick = window.setInterval(() => {
      const t = performance.now() - start;
      const k = Math.min(1, t / MIN_MS);
      setLine(Math.min(LINES.length - 1, Math.floor(k * LINES.length)));
      // The bar waits at 90% until the hero says it's ready.
      const shown = heroReady ? k : Math.min(k, 0.9);
      if (barRef.current) barRef.current.style.transform = `scaleX(${shown})`;
      if ((t >= MIN_MS && heroReady) || t >= MAX_MS) {
        window.clearInterval(tick);
        if (barRef.current) barRef.current.style.transform = 'scaleX(1)';
        setLine(LINES.length - 1);
        setPhase('leave');
      }
    }, 50);

    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(tick);
      window.removeEventListener('hero:ready', onReady);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'leave') return undefined;
    // Release the page as the curtain starts to lift, so the hero copy animates in under it.
    document.documentElement.classList.remove('is-booting');
    lockScroll(false);
    try {
      sessionStorage.setItem('booted', '1');
    } catch {
      /* storage blocked: the intro just plays again next time */
    }
    const id = window.setTimeout(() => setPhase('done'), 700);
    return () => window.clearTimeout(id);
  }, [phase]);

  if (phase === 'done') return null;

  return (
    <div
      aria-hidden="true"
      className={`intro fixed inset-0 z-[100] grid place-items-center bg-void ${phase === 'leave' ? 'is-leaving' : ''}`}
    >
      <div className="flex flex-col items-center">
        <Mark className="intro-mark size-12 text-earth" />
        <p className="intro-word mt-6 font-display text-[1.125rem] tracking-[0.5em] text-white">
          {brand.wordmark}
        </p>
        <div className="mt-8 h-px w-56 overflow-hidden bg-white/10">
          <div
            ref={barRef}
            className="h-full origin-left bg-earth transition-transform duration-100"
            style={{ transform: 'scaleX(0)' }}
          />
        </div>
        <p className="mt-3 h-4 font-mono text-[0.6875rem] tracking-[0.16em] text-dust uppercase">
          <span className="text-earth">›</span> {LINES[line]}
          <span className="intro-caret">_</span>
        </p>
      </div>
    </div>
  );
}

function shouldSkip() {
  if (typeof window === 'undefined') return true;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
  try {
    return sessionStorage.getItem('booted') === '1';
  } catch {
    return false;
  }
}
