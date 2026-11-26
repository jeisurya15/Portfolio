import { useEffect, useRef, useState } from 'react';
import { stack } from '../content.js';
import { useReducedMotion } from '../hooks/useReducedMotion.js';
import { useReveals } from '../hooks/useReveals.js';
import { clamp, pinProgress, range } from '../lib/math.js';
import { onFrame, scrollToY } from '../lib/scroll.js';
import { shouldRender3D, whenNear } from '../lib/lazy.js';
import { Toolkit } from './Toolkit.jsx';

/**
 * The stack as a pyramid that builds itself as you scroll: foundations
 * first, the AI apex last. The section pins while the five tiers land; the
 * panel beside it follows the tier being placed, and any tier in the list
 * can be clicked to jump there. The full toolkit follows below, as glass boxes.
 */

const SECTION_VH = 460;
const WINDOW = [0.04, 0.9];
const tiers = stack.tiers;
const N = tiers.length;

export function Stack() {
  const ref = useReveals();
  const pinRef = useRef(null);
  const canvasRef = useRef(null);
  const reduced = useReducedMotion();
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;
  const [active, setActive] = useState(0);

  useEffect(() => {
    let pyramid = null;
    const abort = new AbortController();
    const canvas = canvasRef.current;
    if (shouldRender3D()) {
      whenNear(canvas, abort.signal)
        .then(() => import('../three/pyramid.js'))
        .then(({ createPyramid }) => {
          if (abort.signal.aborted) return;
          pyramid = createPyramid(canvas, N);
          pyramid.resize();
        })
        .catch((e) => console.warn('Pyramid scene unavailable', e));
    }
    const ro = new ResizeObserver(() => pyramid?.resize());
    ro.observe(canvas);

    let current = 0;
    const stop = onFrame((time) => {
      const root = pinRef.current;
      if (!root) return;
      const { p, rect, vh } = pinProgress(root);
      if (rect.bottom < 0 || rect.top > vh) return;
      const u = range(p, ...WINDOW) * N;
      const s = clamp(Math.floor(u), 0, N - 1);
      if (s !== current) {
        current = s;
        setActive(s);
      }
      // Reduced motion: every tier already placed, no drift.
      const still = reducedRef.current;
      pyramid?.render(time, still ? N : u, s, !still);
    });
    return () => {
      abort.abort();
      stop();
      ro.disconnect();
      pyramid?.dispose();
    };
  }, []);

  const jump = (i) => {
    const root = pinRef.current;
    const span = root.offsetHeight - window.innerHeight;
    const p = WINDOW[0] + ((i + 0.75) / N) * (WINDOW[1] - WINDOW[0]);
    const top = root.getBoundingClientRect().top + window.scrollY;
    scrollToY(top + p * span);
  };

  const tier = tiers[active];

  return (
    <section ref={ref} id="stack" aria-labelledby="stack-title" className="relative bg-void">
      <div ref={pinRef} className="relative" style={{ height: `${SECTION_VH}svh` }}>
        <div className="sticky top-0 flex h-screen-s flex-col overflow-hidden px-4 pt-20 pb-6 sm:px-6 md:px-[6vw] md:pt-24">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-mono text-label text-earth uppercase">{stack.eyebrow}</p>
              <h2 id="stack-title" className="mt-3 font-display text-display text-white">
                {stack.heading}
              </h2>
            </div>
            <p className="font-mono text-label text-regolith/50 uppercase">{stack.note}</p>
          </div>

          <div className="grid min-h-0 flex-1 grid-rows-[1fr_auto] gap-4 pt-4 md:grid-cols-[1.25fr_1fr] md:grid-rows-1 md:gap-10">
            <div className="relative min-h-0">
              <canvas
                ref={canvasRef}
                className="absolute inset-0 size-full"
                role="img"
                aria-label={`A pyramid of ${N} tiers: ${tiers.map((t) => t.name).join(', ')}, from the base to the top.`}
              />
            </div>

            <div className="flex min-h-0 flex-col justify-center gap-6 md:gap-8">
              {/* Tier list, apex first, like the pyramid reads top-down. */}
              <ol className="hidden border-t border-white/10 md:block">
                {[...tiers].reverse().map((t) => {
                  const i = tiers.indexOf(t);
                  const on = i === active;
                  return (
                    <li key={t.name} className="border-b border-white/10">
                      <button
                        type="button"
                        onClick={() => jump(i)}
                        aria-current={on ? 'step' : undefined}
                        className={`flex w-full items-baseline gap-4 py-2.5 text-left transition-colors ${on ? 'text-white' : 'text-regolith/45 hover:text-regolith/80'}`}
                      >
                        <span className={`font-mono text-label ${on ? (t.apex ? 'text-[#ffa860]' : 'text-earth') : ''}`}>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span className="font-display text-[0.9375rem] tracking-[0.14em] uppercase">
                          {t.name}
                        </span>
                        <span className="ml-auto font-mono text-[0.625rem] tracking-[0.14em] uppercase">
                          {t.items.length} tools
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>

              <div
                key={active}
                className="animate-[leg-in_0.6s_cubic-bezier(0.2,0.7,0.1,1)]"
                aria-live="polite"
              >
                <p className="flex items-center gap-3 font-mono text-label uppercase">
                  <span className={tier.apex ? 'text-[#ffa860]' : 'text-earth'}>
                    Tier {String(active + 1).padStart(2, '0')} / {String(N).padStart(2, '0')}
                  </span>
                  <span
                    className={`rounded-[3px] px-2 py-0.5 text-[0.625rem] tracking-[0.14em] ${
                      tier.featured
                        ? 'bg-earth text-void'
                        : tier.apex
                          ? 'bg-[#ffa860] text-void'
                          : 'text-regolith/60 ring-1 ring-white/15'
                    }`}
                  >
                    {tier.tag}
                  </span>
                </p>
                <h3 className="mt-3 font-display text-[1.375rem] tracking-[0.08em] text-white uppercase md:text-[1.75rem]">
                  {tier.name}
                </h3>
                <p className="mt-2 max-w-[30rem] text-body text-regolith/70">{tier.blurb}</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {tier.items.map((item, k) => (
                    <li
                      key={item}
                      style={{ animationDelay: `${120 + k * 50}ms` }}
                      className="animate-[leg-in_0.5s_cubic-bezier(0.2,0.7,0.1,1)_both] rounded-[4px] bg-white/[0.04] px-3 py-1.5 text-[0.8125rem] text-regolith/85 ring-1 ring-white/12"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-1.5 md:hidden" aria-hidden="true">
                {tiers.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1 w-8 rounded-full transition-colors duration-500 ${i <= active ? 'bg-earth' : 'bg-white/15'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* The full toolkit, as glass boxes. */}
      <Toolkit />
    </section>
  );
}
