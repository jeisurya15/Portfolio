import { useEffect, useRef, useState } from 'react';
import { intro, work } from '../content.js';
import { clamp, pinProgress, range } from '../lib/math.js';
import { onFrame, scrollToY } from '../lib/scroll.js';
import { screens } from './Screens.jsx';

/**
 * The projects, as a pinned showcase. On wide screens the section holds
 * still while the scroll steps through the index on the left; the browser
 * window on the right shows the project in focus — its interface sketch, or
 * the deployed site itself once a live preview is loaded. On phones it's a
 * plain list of the same windows.
 */

const PER_PROJECT_VH = 75;
const SITE_W = 1280;
const SITE_H = 800;

const host = (url) => url.replace(/^https?:\/\//, '').replace(/\/$/, '');

function Arrow() {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="size-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="M5 11 11 5M6 5h5v5" />
    </svg>
  );
}

/** A live site rendered at desktop size and scaled to fit the window. */
function LiveFrame({ project }) {
  const boxRef = useRef(null);
  const [scale, setScale] = useState(0.5);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const box = boxRef.current;
    const ro = new ResizeObserver(() => setScale(box.clientWidth / SITE_W));
    ro.observe(box);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={boxRef} className="absolute inset-0 overflow-hidden bg-void-2">
      {!loaded && (
        <p className="absolute inset-0 grid place-items-center font-mono text-label text-regolith/50 uppercase">
          Loading {host(project.live)}…
        </p>
      )}
      <iframe
        title={`${project.title} — live site`}
        src={project.live}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className="origin-top-left border-0 bg-white"
        style={{
          width: SITE_W,
          height: SITE_H,
          transform: `scale(${scale})`,
          opacity: loaded ? 1 : 0,
        }}
      />
    </div>
  );
}

function Browser({ project, className = '' }) {
  const [live, setLive] = useState(false);
  const Screen = screens[project.screen];

  // Each project starts on its sketch; the live site is loaded on request.
  useEffect(() => setLive(false), [project.slug]);

  return (
    <div
      className={`overflow-hidden rounded-[10px] bg-void-2 ring-1 ring-white/12 shadow-[0_40px_120px_-40px_rgb(111_182_255/0.35)] ${className}`}
    >
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-white/15" />
          <span className="size-2.5 rounded-full bg-white/15" />
          <span className="size-2.5 rounded-full bg-earth/70" />
        </span>
        <span className="flex min-w-0 flex-1 items-center gap-2 rounded-[5px] bg-white/[0.05] px-3 py-1.5 font-mono text-[0.6875rem] tracking-[0.04em] text-regolith/70">
          <svg
            viewBox="0 0 16 16"
            aria-hidden="true"
            className="size-3 shrink-0 text-regolith/50"
            fill="currentColor"
          >
            <path d="M5 7V5a3 3 0 0 1 6 0v2h1v7H4V7h1Zm1.5 0h3V5a1.5 1.5 0 0 0-3 0v2Z" />
          </svg>
          <span className="truncate">
            {project.live ? host(project.live) : `${project.slug} · preview`}
          </span>
        </span>
        {project.live && (
          <button
            type="button"
            onClick={() => setLive((v) => !v)}
            aria-pressed={live}
            className="shrink-0 rounded-[4px] px-2.5 py-1.5 font-mono text-[0.625rem] tracking-[0.14em] text-white/80 uppercase ring-1 ring-white/20 transition-colors hover:bg-white hover:text-void"
          >
            {live ? 'Show sketch' : 'Live preview'}
          </button>
        )}
      </div>
      <div className="relative aspect-[16/10] bg-[radial-gradient(80%_70%_at_70%_0%,rgb(111_182_255/0.16),transparent_70%)]">
        <div className="absolute inset-0 bg-[linear-gradient(rgb(160_190_240/0.05)_1px,transparent_1px),linear-gradient(90deg,rgb(160_190_240/0.05)_1px,transparent_1px)] bg-[size:24px_24px]" />
        {live && project.live ? (
          <LiveFrame key={project.live} project={project} />
        ) : (
          <div
            key={project.slug}
            className="absolute inset-y-[5%] left-1/2 aspect-[3/4] -translate-x-1/2 animate-[screen-in_0.7s_cubic-bezier(0.2,0.7,0.1,1)] overflow-hidden rounded-[8px] ring-1 ring-white/10"
          >
            <Screen />
          </div>
        )}
      </div>
    </div>
  );
}

function Links({ project }) {
  return (
    <div className="flex flex-wrap gap-3">
      {project.live ? (
        <a
          href={project.live}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-[4px] bg-earth px-4 py-3 font-mono text-label text-void uppercase transition-colors hover:bg-white"
        >
          Visit live site <Arrow />
        </a>
      ) : (
        <span className="inline-flex items-center rounded-[4px] px-4 py-3 font-mono text-label text-regolith/45 uppercase ring-1 ring-white/10">
          Live site coming soon
        </span>
      )}
      {project.repo && (
        <a
          href={project.repo}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-[4px] px-4 py-3 font-mono text-label text-white uppercase ring-1 ring-white/25 transition-colors hover:bg-white hover:text-void"
        >
          Source code <Arrow />
        </a>
      )}
    </div>
  );
}

function Details({ project, index }) {
  return (
    <div>
      <p className="font-mono text-label text-earth uppercase">
        0{index + 1} · {project.kind}
      </p>
      <p className="mt-3 max-w-[40rem] text-body text-regolith/75">{project.body}</p>
      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5">
        {project.features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-[0.875rem] text-regolith/70">
            <span aria-hidden="true" className="size-1 rounded-full bg-earth" />
            {f}
          </li>
        ))}
      </ul>
      <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Built with">
        {project.stack.map((t) => (
          <li
            key={t}
            className="rounded-[3px] bg-white/[0.05] px-2 py-1 font-mono text-[0.625rem] tracking-[0.12em] text-regolith/80 uppercase ring-1 ring-white/10"
          >
            {t}
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <Links project={project} />
      </div>
    </div>
  );
}

export function Projects() {
  const rootRef = useRef(null);
  const barRefs = useRef([]);
  const screenRef = useRef(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let current = 0;
    let lastP = -1;
    return onFrame(() => {
      const root = rootRef.current;
      if (!root || root.offsetParent === null) return;
      const { p, rect, vh } = pinProgress(root);
      if (rect.bottom < 0 || rect.top > vh) return;

      // Arrival: 0 while the section is a screen away, 1 once it pins.
      const arrive = clamp(1 - rect.top / vh);
      const on = range(arrive, 0.72, 1);
      const screen = screenRef.current;
      screen.style.opacity = String(on);
      screen.style.transform = on < 1 ? `scale(${0.9 + on * 0.1})` : '';
      screen.style.filter = on < 1 ? `brightness(${1 + (1 - on) * 1.4})` : '';

      if (Math.abs(p - lastP) < 0.00005) return;
      lastP = p;
      const u = range(p, 0.03, 0.97) * work.length;
      const i = clamp(Math.floor(u), 0, work.length - 1);
      if (i !== current) {
        current = i;
        setActive(i);
      }
      barRefs.current.forEach((bar, k) => {
        bar.style.transform = `scaleX(${clamp(u - k)})`;
      });
    });
  }, []);

  // Clicking an entry scrolls to the point where it takes focus.
  const jump = (i) => {
    const root = rootRef.current;
    const span = root.offsetHeight - window.innerHeight;
    const top = root.getBoundingClientRect().top + window.scrollY;
    scrollToY(top + span * (0.03 + ((i + 0.5) / work.length) * 0.94));
  };

  const project = work[active];

  return (
    <section id="work" aria-labelledby="work-title" className="relative z-10 bg-void">
      {/* Wide screens: pinned showcase. */}
      <div
        ref={rootRef}
        className="relative max-md:hidden"
        style={{ height: `${work.length * PER_PROJECT_VH + 100}svh` }}
      >
        <div className="sticky top-0 grid h-screen-s grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] items-center gap-[4vw] px-[6vw] pt-16">
          <div>
            <p
              data-reveal
              style={{ '--i': 0 }}
              className="font-mono text-label text-earth uppercase"
            >
              {intro.eyebrow}
            </p>
            <h2
              id="work-title"
              data-reveal
              style={{ '--i': 1 }}
              className="mt-4 font-display text-[clamp(1.6rem,2.6vw,2.75rem)] leading-[1.08] text-white"
            >
              {intro.heading}
            </h2>
            <p
              data-reveal
              style={{ '--i': 2 }}
              className="mt-4 max-w-[26rem] text-body text-regolith/65"
            >
              {intro.body}
            </p>
            <ol className="mt-8 border-t border-white/10">
              {work.map((w, i) => (
                <li key={w.slug} className="border-b border-white/10">
                  <button
                    type="button"
                    onClick={() => jump(i)}
                    aria-current={i === active ? 'true' : undefined}
                    className="group relative flex w-full items-baseline gap-4 py-3.5 text-left"
                  >
                    <span
                      className={`font-mono text-label transition-colors ${i === active ? 'text-earth' : 'text-regolith/40'}`}
                    >
                      0{i + 1}
                    </span>
                    <span
                      className={`font-display text-[0.9375rem] tracking-[0.08em] uppercase transition-colors duration-500 ${i === active ? 'text-white' : 'text-regolith/40 group-hover:text-regolith/80'}`}
                    >
                      {w.title}
                    </span>
                    <span
                      className={`ml-auto font-mono text-[0.625rem] tracking-[0.14em] uppercase transition-colors ${i === active ? 'text-regolith/70' : 'text-regolith/30'}`}
                    >
                      {w.live ? 'Live' : w.kind}
                    </span>
                    <span
                      ref={(el) => {
                        if (el) barRefs.current[i] = el;
                      }}
                      aria-hidden="true"
                      className="absolute inset-x-0 -bottom-px h-px origin-left bg-earth"
                      style={{ transform: 'scaleX(0)' }}
                    />
                  </button>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex flex-col gap-6">
            {/* The hero's globe flies onto this window; it powers on as the globe lands. */}
            <div
              ref={screenRef}
              data-fly-target
              className="w-full max-w-[calc((100svh-22rem)*1.6)] origin-center self-end"
            >
              <Browser project={project} className="w-full" />
            </div>
            <div
              key={project.slug}
              className="self-end animate-[leg-in_0.6s_cubic-bezier(0.2,0.7,0.1,1)] w-full max-w-[calc((100svh-22rem)*1.6)]"
              aria-live="polite"
            >
              <Details project={project} index={active} />
            </div>
          </div>
        </div>
      </div>

      {/* Phones: the same windows, one after another. */}
      <div className="px-4 py-24 sm:px-6 md:hidden">
        <p data-reveal style={{ '--i': 0 }} className="font-mono text-label text-earth uppercase">
          {intro.eyebrow}
        </p>
        <h2 data-reveal style={{ '--i': 1 }} className="mt-4 font-display text-display text-white">
          {intro.heading}
        </h2>
        <p data-reveal style={{ '--i': 2 }} className="mt-4 text-body text-regolith/65">
          {intro.body}
        </p>
        <ol className="mt-12 space-y-16">
          {work.map((w, i) => (
            <li key={w.slug}>
              <h3 className="mb-4 font-display text-[1.0625rem] tracking-[0.08em] text-white uppercase">
                {w.title}
              </h3>
              <Browser project={w} />
              <div className="mt-5">
                <Details project={w} index={i} />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
