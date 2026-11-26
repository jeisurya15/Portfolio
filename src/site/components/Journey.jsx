import { useEffect, useRef, useState } from 'react';
import { journey } from '../content.js';
import { clamp, easeOutCubic, lerp, pinProgress, range } from '../lib/math.js';
import { onFrame } from '../lib/scroll.js';

/**
 * Backend developer → AI engineer, drawn as you scroll. The section pins
 * while the four learning phases ink themselves one after another, a packet
 * riding the leg being drawn; a progress counter ticks to 100% on the way.
 * The start is a small network globe, the destination a chip.
 */

const SECTION_VH = 380;
const WINDOW = [0.06, 0.92];

const HOME = { cx: 230, cy: 320, r: 92 };
const CHIP = { cx: 970, cy: 320, r: 46 };

// Orbit radii. A full-circle arc must start at the top of its orbit and step
// sideways only (dx, 0); a diagonal step makes the browser pick an off-centre circle.
const HOME_ORBIT = 128;
const CHIP_ORBIT = 92;
// Where the first leg leaves home: 60° clockwise from the top of the orbit.
const EXIT = {
  x: HOME.cx + HOME_ORBIT * Math.sin(Math.PI / 3),
  y: HOME.cy - HOME_ORBIT * Math.cos(Math.PI / 3),
};
const ARRIVE = { x: CHIP.cx, y: CHIP.cy - CHIP_ORBIT };

const LEGS = [
  // Orbits of home: backend foundations (one lap, then on to the exit point).
  `M${HOME.cx} ${HOME.cy - HOME_ORBIT} a${HOME_ORBIT} ${HOME_ORBIT} 0 1 1 -0.1 0 A${HOME_ORBIT} ${HOME_ORBIT} 0 0 1 ${EXIT.x} ${EXIT.y}`,
  // The long coast out: full stack. Arrives level, tangent to the chip's orbit.
  `M${EXIT.x} ${EXIT.y} C ${EXIT.x + 90} ${EXIT.y - 150}, ${ARRIVE.x - 260} ${ARRIVE.y}, ${ARRIVE.x} ${ARRIVE.y}`,
  // Captured: LLMs and prompt engineering. One lap around the chip.
  `M${ARRIVE.x} ${ARRIVE.y} a${CHIP_ORBIT} ${CHIP_ORBIT} 0 1 1 -0.1 0`,
  // Landing: AI engineering. Spirals in onto the chip's top edge.
  `M${ARRIVE.x} ${ARRIVE.y} C ${CHIP.cx + 46} ${ARRIVE.y + 4}, ${CHIP.cx + 30} ${CHIP.cy - 50}, ${CHIP.cx} ${CHIP.cy - 38}`,
];

// A dotted globe, precomputed: dots on the visible hemisphere, shaded from the left.
const GLOBE_DOTS = (() => {
  const dots = [];
  const N = 900;
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = i * Math.PI * (3 - Math.sqrt(5));
    const x = Math.cos(th) * r;
    const z = Math.sin(th) * r;
    if (z < 0.05) continue;
    const landish =
      Math.sin(x * 3.1 + 1.2) * Math.cos(y * 2.3 - 0.4) * 0.55 +
        Math.sin(z * 2.7 - x * 1.3 + 2.1) * 0.35 >
      0.12;
    dots.push([
      HOME.cx + x * HOME.r,
      HOME.cy - y * HOME.r,
      landish,
      clamp(0.3 + (-x * 0.6 + y * 0.4 + z * 0.5)),
    ]);
  }
  return dots;
})();

export function Journey() {
  const rootRef = useRef(null);
  const legRefs = useRef([]);
  const packetRef = useRef(null);
  const yearRef = useRef(null);
  const [leg, setLeg] = useState(0);

  useEffect(() => {
    let lastP = -1;
    let current = 0;
    return onFrame(() => {
      const root = rootRef.current;
      if (!root) return;
      const { p, rect, vh } = pinProgress(root);
      if (rect.bottom < 0 || rect.top > vh) return;
      if (Math.abs(p - lastP) < 0.00005) return;
      lastP = p;

      const u = range(p, ...WINDOW) * LEGS.length;
      const s = clamp(Math.floor(u), 0, LEGS.length - 1);
      if (s !== current) {
        current = s;
        setLeg(s);
      }
      legRefs.current.forEach((path, i) => {
        const k = easeOutCubic(clamp(u - i));
        path.style.strokeDashoffset = String(1 - k);
        if (i === s) {
          const pt = path.getPointAtLength(path.getTotalLength() * k);
          packetRef.current.setAttribute('transform', `translate(${pt.x} ${pt.y})`);
        }
      });
      yearRef.current.textContent = `${Math.round(lerp(0, 100, clamp(u / LEGS.length)))}%`;
    });
  }, []);

  const current = journey.legs[leg];

  return (
    <section
      ref={rootRef}
      id="journey"
      aria-labelledby="journey-title"
      className="relative bg-void"
      style={{ height: `${SECTION_VH}svh` }}
    >
      <div className="sticky top-0 flex h-screen-s flex-col overflow-hidden px-4 pt-20 pb-8 sm:px-6 md:px-[6vw] md:pt-24">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-label text-earth uppercase">{journey.eyebrow}</p>
            <h2
              id="journey-title"
              className="mt-3 max-w-[22ch] font-display text-display text-white"
            >
              {journey.heading}
            </h2>
          </div>
          <p className="font-mono text-label text-regolith/60 uppercase" aria-live="off">
            Progress{' '}
            <span ref={yearRef} className="text-white tabular-nums">
              0%
            </span>
          </p>
        </div>

        <div className="relative flex min-h-0 flex-1 items-center">
          <svg
            // Cropped to the drawing (orbits, arc and labels), so no dead bands above or below.
            viewBox="40 90 1120 430"
            className="h-auto max-h-full w-full"
            role="img"
            aria-label="A route from backend developer to AI engineer, drawn in four learning phases."
          >
            <defs>
              <radialGradient id="home-glow">
                <stop offset="0.8" stopColor="#6fb6ff" stopOpacity="0.35" />
                <stop offset="1" stopColor="#6fb6ff" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="home-core" cx="35%" cy="35%" r="75%">
                <stop offset="0" stopColor="#10213a" />
                <stop offset="1" stopColor="#050a14" />
              </radialGradient>
              <linearGradient id="chip-face" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#2a3446" />
                <stop offset="1" stopColor="#0d121b" />
              </linearGradient>
            </defs>

            {/* Faint star field. */}
            <g fill="#fff">
              {Array.from({ length: 70 }, (_, i) => (
                <circle
                  key={i}
                  cx={(i * 173) % 1200}
                  cy={(i * 97) % 600}
                  r={i % 7 === 0 ? 1.4 : 0.7}
                  opacity={0.15 + ((i * 37) % 50) / 100}
                />
              ))}
            </g>

            {/* Home: a dotted globe. */}
            <circle cx={HOME.cx} cy={HOME.cy} r={HOME.r * 1.18} fill="url(#home-glow)" />
            <circle cx={HOME.cx} cy={HOME.cy} r={HOME.r} fill="url(#home-core)" />
            <g>
              {GLOBE_DOTS.map(([x, y, landish, light], i) => (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={landish ? 1.9 : 1}
                  fill={landish ? '#cfe3ff' : '#4d7bc0'}
                  opacity={(landish ? 0.35 : 0.2) + light * 0.6}
                />
              ))}
            </g>

            {/* Destination: a chip. */}
            <g transform={`translate(${CHIP.cx} ${CHIP.cy})`}>
              {Array.from({ length: 6 }, (_, i) => {
                const o = -30 + i * 12;
                return (
                  <g key={i} stroke="#8b909b" strokeWidth="2.5" opacity="0.7">
                    <line x1={o} y1={-CHIP.r} x2={o} y2={-CHIP.r + 12} />
                    <line x1={o} y1={CHIP.r} x2={o} y2={CHIP.r - 12} />
                    <line x1={-CHIP.r} y1={o} x2={-CHIP.r + 12} y2={o} />
                    <line x1={CHIP.r} y1={o} x2={CHIP.r - 12} y2={o} />
                  </g>
                );
              })}
              <rect
                x={-36}
                y={-36}
                width="72"
                height="72"
                rx="8"
                fill="url(#chip-face)"
                stroke="#6fb6ff"
                strokeOpacity="0.5"
              />
              <rect
                x={-18}
                y={-18}
                width="36"
                height="36"
                rx="4"
                fill="none"
                stroke="#f2e6c9"
                strokeOpacity="0.5"
              />
              <circle r="4" fill="#ffa860" />
            </g>

            {/* Ghost of the full route, then the inked legs over it. */}
            {LEGS.map((d, i) => (
              <path
                key={`g${i}`}
                d={d}
                fill="none"
                stroke="#fff"
                strokeOpacity="0.08"
                strokeWidth="1.5"
                strokeDasharray="3 6"
              />
            ))}
            {LEGS.map((d, i) => (
              <path
                key={i}
                ref={(el) => {
                  if (el) legRefs.current[i] = el;
                }}
                d={d}
                pathLength={1}
                fill="none"
                stroke={i === 1 ? '#6fb6ff' : '#f2e6c9'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="1 1"
                strokeDashoffset="1"
              />
            ))}

            <g ref={packetRef} transform={`translate(${HOME.cx} ${HOME.cy - HOME_ORBIT})`}>
              <circle r="11" fill="#6fb6ff" opacity="0.25" />
              <rect x="-4.5" y="-4.5" width="9" height="9" rx="1.5" fill="#fff" />
            </g>

            <g fontFamily="IBM Plex Mono, monospace" fontSize="13" letterSpacing="2" fill="#8b909b">
              <text x={HOME.cx} y={HOME.cy + HOME_ORBIT + 36} textAnchor="middle">
                {journey.from.label} · {journey.from.sub}
              </text>
              <text x={CHIP.cx} y={HOME.cy + HOME_ORBIT + 36} textAnchor="middle">
                {journey.to.label} · {journey.to.sub}
              </text>
            </g>
          </svg>
        </div>

        {/* Current leg. */}
        <div className="grid gap-4 border-t border-white/10 pt-5 md:grid-cols-[auto_1fr_auto] md:items-end md:gap-10">
          <p className="font-mono text-label text-earth uppercase">{current.when}</p>
          <div
            key={leg}
            className="animate-[leg-in_0.6s_cubic-bezier(0.2,0.7,0.1,1)]"
            aria-live="polite"
          >
            <h3 className="font-display text-[1.125rem] tracking-[0.08em] text-white uppercase md:text-[1.375rem]">
              {current.title}
            </h3>
            <p className="mt-1.5 max-w-[44rem] text-body text-regolith/70">{current.body}</p>
          </div>
          <div className="flex gap-1.5" aria-hidden="true">
            {journey.legs.map((_, i) => (
              <span
                key={i}
                className={`h-1 w-8 rounded-full transition-colors duration-500 ${i <= leg ? 'bg-earth' : 'bg-white/15'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
