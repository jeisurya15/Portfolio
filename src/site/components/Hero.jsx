import { useEffect, useRef, useState } from 'react';
import { brand, hero, journey, stack, work } from '../content.js';
import { useReducedMotion } from '../hooks/useReducedMotion.js';
import { shouldRender3D } from '../lib/lazy.js';
import { onFrame, scrollToHash } from '../lib/scroll.js';

/**
 * The first screen: who Jei is, what Jei builds, and two ways forward.
 * Right side: the network globe (lazy three.js) with the stack orbiting it and
 * two floating glass cards, all tilting toward the pointer at different depths.
 */
// Everything below is derived from content.js, so it stays true as that changes.
const tools = stack.tiers.flatMap((t) => t.items);
const aiTier = stack.tiers.find((t) => t.apex) ?? stack.tiers[stack.tiers.length - 1];
const learning = journey.legs.find((l) => l.when.includes('Learning')) ?? journey.legs[0];
const facts = [
  { value: String(work.length), label: 'Projects built' },
  { value: `${tools.length}+`, label: 'Tools in my stack' },
  { value: 'B.Tech', label: 'IT · SKCET' },
];
const socials = [
  {
    label: 'GitHub',
    href: brand.github,
    external: true,
    icon: 'M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.82 1.19 3.08 0 4.41-2.69 5.38-5.26 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z',
  },
  {
    label: 'LinkedIn',
    href: brand.linkedin,
    external: true,
    icon: 'M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z',
  },
  {
    label: `Email ${brand.email}`,
    href: `mailto:${brand.email}`,
    external: false,
    icon: 'M2 5.5A2.5 2.5 0 0 1 4.5 3h15A2.5 2.5 0 0 1 22 5.5v13a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 18.5v-13Zm2.2.3 7.8 6.1 7.8-6.1a.5.5 0 0 0-.3-.1h-15a.5.5 0 0 0-.3.1ZM20 8.1l-7.4 5.8a1 1 0 0 1-1.2 0L4 8.1v10.4c0 .28.22.5.5.5h15a.5.5 0 0 0 .5-.5V8.1Z',
  },
];

export function Hero() {
  const rootRef = useRef(null);
  const globeRef = useRef(null);
  const sceneRef = useRef(null);
  const reduced = useReducedMotion();
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;

  // Rotating headline word.
  const [word, setWord] = useState(0);
  useEffect(() => {
    if (reduced) return undefined;
    const id = window.setInterval(() => setWord((w) => (w + 1) % hero.words.length), 2600);
    return () => window.clearInterval(id);
  }, [reduced]);

  useEffect(() => {
    const canvas = globeRef.current;
    const root = rootRef.current;
    let globe = null;
    let cancelled = false;

    if (shouldRender3D()) {
      import('../three/globe.js')
        .then(({ createGlobe }) => {
          if (cancelled) return;
          globe = createGlobe(canvas);
          canvas.classList.add('opacity-100');
        })
        .catch((e) => console.warn('Globe unavailable', e));
    }

    const ro = new ResizeObserver(() => globe?.resize());
    ro.observe(canvas);

    // Pointer: drives the tilt (eased) and the spotlight (direct).
    const target = { x: 0, y: 0 };
    const tilt = { x: 0, y: 0 };
    const onMove = (e) => {
      target.x = (e.clientX / window.innerWidth - 0.5) * 2;
      target.y = (e.clientY / window.innerHeight - 0.5) * 2;
      const r = root.getBoundingClientRect();
      root.style.setProperty('--mx', `${e.clientX - r.left}px`);
      root.style.setProperty('--my', `${e.clientY - r.top}px`);
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    const stop = onFrame((time) => {
      const rect = root.getBoundingClientRect();
      if (rect.bottom < 0) return;
      const still = reducedRef.current;
      globe?.render(time, !still);
      if (still) return;
      tilt.x += (target.x - tilt.x) * 0.06;
      tilt.y += (target.y - tilt.y) * 0.06;
      // Children read these to move by their own depth.
      sceneRef.current.style.setProperty('--tx', tilt.x.toFixed(4));
      sceneRef.current.style.setProperty('--ty', tilt.y.toFixed(4));
    });

    return () => {
      cancelled = true;
      stop();
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
      globe?.dispose();
    };
  }, []);

  const go = (e) => {
    e.preventDefault();
    scrollToHash(e.currentTarget.getAttribute('href'));
  };

  const n = hero.orbit.length;

  return (
    <section
      id="top"
      ref={rootRef}
      aria-labelledby="hero-title"
      className="hero relative isolate flex min-h-svh items-center overflow-hidden bg-void"
    >
      {/* Backdrop: glow behind the globe, a fading grid, and a spotlight that follows the cursor. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 right-[-10%] size-[70vmax] -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(111,182,255,0.18),transparent)]" />
        <div className="absolute top-[-20%] left-[-10%] size-[50vmax] rounded-full bg-[radial-gradient(closest-side,rgba(140,110,255,0.08),transparent)]" />
        <div className="hero-grid absolute inset-0" />
        <div className="hero-spot absolute inset-0" />
      </div>

      <div className="grid w-full items-center gap-12 px-4 pt-28 pb-28 sm:px-6 md:grid-cols-[1.1fr_0.9fr] md:px-[6vw] md:pt-24">
        <div className="hero-in relative z-10">
          <p className="inline-flex items-center gap-2 rounded-full border border-earth/25 bg-earth/[0.06] px-3 py-1 font-mono text-[0.625rem] whitespace-nowrap text-earth uppercase sm:text-label">
            <span aria-hidden="true">{'</>'}</span> {hero.kicker}
          </p>

          <h1
            id="hero-title"
            className="mt-6 font-sans text-[clamp(2.5rem,5.2vw,5rem)] leading-[1.04] font-semibold tracking-[-0.035em] text-white"
          >
            {hero.greeting}
            <span className="block text-regolith/55">I build</span>
            <span className="relative grid">
              {/* Screen readers get one stable phrase instead of a changing one. */}
              <span className="sr-only">full-stack apps.</span>
              {/* Every word stacked in one cell, so the line never reflows. */}
              {hero.words.map((w, i) => (
                <span
                  key={w}
                  aria-hidden="true"
                  className={`hero-word col-start-1 row-start-1 whitespace-nowrap ${i === word ? 'is-on' : ''}`}
                >
                  {w}
                </span>
              ))}
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-body text-dust">{hero.pitch}</p>

          <ul className="mt-6 flex flex-wrap gap-2" aria-label="Main stack">
            {hero.stack.map((s) => (
              <li
                key={s}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono text-[0.75rem] text-regolith"
              >
                {s}
              </li>
            ))}
          </ul>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a
              href="#work"
              onClick={go}
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-white px-6 py-3 text-sm font-semibold text-void shadow-[0_0_40px_-8px_rgba(111,182,255,0.7)] transition-colors hover:bg-earth"
            >
              View projects
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </a>
            <a
              href="#contact"
              onClick={go}
              className="inline-flex items-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition-colors hover:border-white/50 hover:bg-white/5"
            >
              Contact me
            </a>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <p className="flex items-center gap-2.5 text-sm text-dust">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/60 motion-reduce:animate-none" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
              </span>
              {hero.status} · {hero.location}
            </p>
            <ul className="flex items-center gap-2" aria-label="Find me online">
              {socials.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target={s.external ? '_blank' : undefined}
                    rel={s.external ? 'noreferrer' : undefined}
                    aria-label={s.label}
                    className="grid size-9 place-items-center rounded-full border border-white/10 text-regolith transition-colors hover:border-earth/60 hover:text-earth"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="size-4"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d={s.icon} />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick facts, all counted from the content below. */}
          <dl className="mt-10 grid max-w-xl grid-cols-3 divide-x divide-white/10 border-t border-white/10 pt-6">
            {facts.map((f) => (
              <div key={f.label} className="px-4 first:pl-0">
                <dt className="sr-only">{f.label}</dt>
                <dd className="font-sans text-[clamp(1.5rem,2.4vw,2.25rem)] leading-none font-semibold tracking-tight text-white">
                  {f.value}
                </dd>
                <dd className="mt-2 text-[0.8125rem] text-dust">{f.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* The scene. Decorative: everything here is also said in the text. */}
        <div
          ref={sceneRef}
          aria-hidden="true"
          className="hero-scene relative mx-auto aspect-square w-[min(72vw,32rem)] md:w-full md:max-w-[36rem]"
        >
          {/* Tech orbit. */}
          <div className="hero-depth absolute inset-[-6%]" style={{ '--d': 6 }}>
            <div className="absolute inset-0 rounded-full border border-dashed border-earth/15" />
            {hero.orbit.map((t, i) => (
              <span
                key={t}
                className="hero-orbit absolute top-1/2 left-1/2 rounded-full border border-white/10 bg-void-2/80 px-2.5 py-1 font-mono text-[0.6875rem] text-regolith shadow-lg backdrop-blur"
                style={{ '--a': `${(360 / n) * i}deg` }}
              >
                {t}
              </span>
            ))}
          </div>

          {/* Globe. */}
          <div className="hero-depth absolute inset-[8%]" style={{ '--d': 10 }}>
            <canvas
              ref={globeRef}
              className="size-full opacity-0 transition-opacity duration-1000"
            />
          </div>

          {/* Floating code card. */}
          <div
            className="hero-depth hero-float absolute top-[4%] left-[-14%] w-[15.5rem] max-md:hidden"
            style={{ '--d': 26 }}
          >
            <div className="glass rounded-xl p-3.5 font-mono text-[0.6875rem] leading-relaxed">
              <div className="mb-2 flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-white/20" />
                <span className="size-2 rounded-full bg-white/20" />
                <span className="size-2 rounded-full bg-earth/70" />
                <span className="ml-2 text-dust">ProjectController.java</span>
              </div>
              <p className="text-[#c39bff]">@RestController</p>
              <p>
                <span className="text-[#c39bff]">@GetMapping</span>
                <span className="text-regolith">(</span>
                <span className="text-[#9fe0a6]">"/api/projects"</span>
                <span className="text-regolith">)</span>
              </p>
              <p className="text-regolith">
                <span className="text-earth">List</span>&lt;Project&gt;{' '}
                <span className="text-[#ffd479]">all</span>() {'{'}
              </p>
              <p className="pl-3 text-regolith">
                <span className="text-[#c39bff]">return</span> repo.findAll();
              </p>
              <p className="text-regolith">{'}'}</p>
            </div>
          </div>

          {/* Floating "now learning" card, from the journey's current phase. */}
          <div
            className="hero-depth hero-float absolute top-[52%] left-[-22%] w-[12.5rem] max-md:hidden"
            style={{ '--d': 18, animationDelay: '-5s' }}
          >
            <div className="glass rounded-xl p-3.5">
              <p className="flex items-center gap-2 font-mono text-[0.625rem] tracking-[0.14em] text-[#ffd479] uppercase">
                <span className="size-1.5 animate-pulse rounded-full bg-[#ffd479] motion-reduce:animate-none" />
                Now learning
              </p>
              <p className="mt-2 text-[0.875rem] leading-snug font-semibold text-white">
                {learning.title}
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1">
                {aiTier.items.slice(2, 5).map((t) => (
                  <span
                    key={t}
                    className="rounded border border-white/10 px-1.5 py-0.5 font-mono text-[0.625rem] text-dust"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Floating response card. */}
          <div
            className="hero-depth hero-float absolute right-[-8%] bottom-[6%] w-[13rem] max-md:hidden"
            style={{ '--d': 34, animationDelay: '-3s' }}
          >
            <div className="glass rounded-xl p-3.5 font-mono text-[0.6875rem]">
              <div className="flex items-center justify-between">
                <span className="text-dust">GET /api/projects</span>
                <span className="rounded bg-emerald-400/15 px-1.5 py-0.5 text-emerald-300">
                  200
                </span>
              </div>
              <div className="mt-2.5 space-y-1.5">
                {work.slice(0, 3).map(({ title: p }, i) => (
                  <div key={p} className="flex items-center gap-2 text-regolith">
                    <span className="text-dust">{i + 1}</span>
                    {p}
                  </div>
                ))}
                <div className="text-dust">…</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom ribbon: every tool from the stack, drifting past. */}
      <div
        aria-hidden="true"
        className="hero-ribbon absolute inset-x-0 bottom-0 border-t border-white/[0.07] bg-void/60 py-3.5 backdrop-blur"
      >
        <div className="hero-marquee flex w-max font-mono text-[0.75rem] tracking-[0.12em] text-dust uppercase">
          {[...tools, ...tools].map((t, i) => (
            <span key={i} className="flex items-center gap-10 pr-10 whitespace-nowrap">
              {t}
              <span className="text-earth/50">◆</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
