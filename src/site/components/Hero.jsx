import { useEffect, useMemo, useRef } from 'react';
import { hero } from '../content.js';
import { useReducedMotion } from '../hooks/useReducedMotion.js';
import { groundPath, paintPlain, paintSky } from '../lib/art.js';
import { clamp, easeOutCubic, lerp, pinProgress, range } from '../lib/math.js';
import { onFrame } from '../lib/scroll.js';
import { createAvatarScene } from '../three/avatar.js';
import { createGlobe } from '../three/globe.js';
import { createCity } from '../three/city.js';
import { createMirror } from '../three/mirror.js';

/**
 * The boot-up. Seven layers stacked and pinned; one scroll range moves each
 * at its own rate:
 *
 *   0.00 – 0.18  a veil of code dust drifts off the lens
 *   0.04 – 0.50  the network globe climbs out from behind the server skyline
 *   0.08 – 0.50  JEI SURYA resolves between the plain and the screen bezel
 *   0.28 – 0.60  the bezel closes in around the view — you're inside the
 *                screen looking out — and the developer and his stack rise
 *   0.70 – 1.00  everything tilts away upward and the ground swallows the
 *                frame to black, which is where the page continues
 *
 * A thin telemetry HUD rides on top: uptime, build progress, location.
 */

const STAGE_VH = 440;

export function Hero() {
  const rootRef = useRef(null);
  const layers = useRef({});
  const skyRef = useRef(null);
  const plainRef = useRef(null);
  const mirrorRef = useRef(null);
  const cityRef = useRef(null);
  const globeRef = useRef(null);
  const avatarRef = useRef(null);
  const veilRef = useRef(null);
  const dustRef = useRef(null);
  const titleRef = useRef(null);
  const hudRef = useRef(null);
  const clockRef = useRef(null);
  const buildRef = useRef(null);
  const reduced = useReducedMotion();
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;
  const ground = useMemo(groundPath, []);

  useEffect(() => {
    const dust = dustRef.current;
    let globe = null;
    let avatar = null;
    let mirror = null;
    let city = null;
    try {
      globe = createGlobe(globeRef.current);
      avatar = createAvatarScene(avatarRef.current);
      mirror = createMirror(mirrorRef.current);
      city = createCity(cityRef.current);
    } catch (e) {
      // No WebGL: the painted layers still carry the scene.
      console.warn('3D layers unavailable', e);
    }

    const paint = () => {
      paintSky(skyRef.current);
      paintPlain(plainRef.current);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      dust.width = Math.round(dust.clientWidth * dpr);
      dust.height = Math.round(dust.clientHeight * dpr);
      globe?.resize();
      avatar?.resize();
      mirror?.resize();
      city?.resize();
    };
    paint();
    // Glyphs in the sky use the mono face; repaint once it has loaded.
    document.fonts?.ready.then(paint);
    let timer = 0;
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(paint, 120);
    };
    window.addEventListener('resize', onResize);

    const ctx = dust.getContext('2d');
    let seed = 11;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const motes = Array.from({ length: 150 }, () => ({
      x: rand(),
      y: rand(),
      r: 0.4 + rand() * 1.6,
      s: 0.3 + rand(),
      a: 0.2 + rand() * 0.6,
    }));
    let lastP = -1;
    let lastTime = 0;

    const set = (name, y, scale = 1, opacity = 1) => {
      const el = layers.current[name];
      if (!el) return;
      el.style.transform = `translate3d(0, ${y}vh, 0) scale(${scale})`;
      el.style.opacity = String(opacity);
    };

    const stop = onFrame((time) => {
      const dt = lastTime ? Math.min(0.1, (time - lastTime) / 1000) : 1 / 60;
      lastTime = time;
      const root = rootRef.current;
      if (!root) return;
      const { p, rect } = pinProgress(root);
      if (rect.bottom < 0) return;

      // The 3D layers keep breathing while they're on screen.
      const still = reducedRef.current;
      if (p < 0.97) {
        globe?.render(time, !still);
        mirror?.render(time, globeRef.current.getBoundingClientRect(), !still);
        city?.render(time, !still);
        if (p > 0.2) avatar?.render(time, !still);
      }

      // Dust drifts every frame while it's visible.
      const veil = 1 - range(p, 0, 0.18);
      if (veil > 0.001) {
        const w = dust.clientWidth;
        const h = dust.clientHeight;
        const dpr = dust.width / Math.max(1, w);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#cfe0ff';
        for (const m of motes) {
          if (!still) {
            m.x += 0.006 * m.s * dt;
            m.y -= 0.004 * m.s * dt;
            if (m.x > 1) m.x -= 1;
            if (m.y < 0) m.y += 1;
          }
          ctx.globalAlpha = m.a * veil;
          ctx.fillRect(m.x * w, (m.y - p * 0.6) * h, m.r * (1 + p * 4), m.r * (1 + p * 4));
        }
        ctx.globalAlpha = 1;
      }

      if (Math.abs(p - lastP) < 0.00005) return;
      lastP = p;

      const exit = range(p, 0.7, 1);
      const settle = easeOutCubic(range(p, 0, 0.5));

      veilRef.current.style.opacity = String(veil);
      veilRef.current.style.transform = `translate3d(0, ${-range(p, 0, 0.18) * 24}vh, 0) scale(${1 + range(p, 0, 0.18) * 0.25})`;
      dust.style.opacity = String(veil);

      // Far → near, each faster than the one behind it.
      set('sky', lerp(0, -6, p), lerp(1.14, 1, settle));
      const rise = easeOutCubic(range(p, 0.04, 0.5));
      set('globe', lerp(36, 0, rise) - exit * 12, lerp(0.9, 1, rise));
      set('plain', lerp(9, 0, settle) - exit * 26);
      const rim = easeOutCubic(range(p, 0.28, 0.58));
      set('frame', -exit * 44, lerp(1.6, 1, rim), rim);
      const up = easeOutCubic(range(p, 0.36, 0.62));
      set('avatar', lerp(30, 0, up) - exit * 58, 1, clamp(up * 2));
      const g = easeOutCubic(range(p, 0.34, 0.6));
      set('ground', lerp(36, 0, g) - exit * 78);

      // Title: resolves (tracking closes in), then yields to the bezel.
      const tIn = easeOutCubic(range(p, 0.08, 0.24));
      const tOut = range(p, 0.42, 0.52);
      const title = titleRef.current;
      title.style.opacity = String(tIn * (1 - tOut));
      title.style.letterSpacing = `${lerp(0.6, 0.24, tIn)}em`;
      title.style.transform = `translate3d(0, ${-p * 6}vh, 0)`;
      title.style.filter = tIn < 0.99 ? `blur(${(1 - tIn) * 10}px)` : '';

      // Telemetry.
      hudRef.current.style.opacity = String(range(p, 0.02, 0.1) * (1 - range(p, 0.62, 0.72)));
      const secs = p * 5400;
      clockRef.current.textContent = `T+ ${String(Math.floor(secs / 3600)).padStart(2, '0')}:${String(Math.floor((secs % 3600) / 60)).padStart(2, '0')}:${String(Math.floor(secs % 60)).padStart(2, '0')}`;
      buildRef.current.textContent = `${Math.round(range(p, 0.04, 0.6) * 100)}%`;
    });

    return () => {
      stop();
      clearTimeout(timer);
      window.removeEventListener('resize', onResize);
      globe?.dispose();
      avatar?.dispose();
      mirror?.dispose();
      city?.dispose();
    };
  }, []);

  const layer = (name, children, extra = '') => (
    <div
      ref={(el) => {
        if (el) layers.current[name] = el;
      }}
      aria-hidden="true"
      className={`absolute inset-0 will-change-transform ${extra}`}
    >
      {children}
    </div>
  );

  return (
    <section
      id="top"
      ref={rootRef}
      aria-label="Introduction"
      className="relative"
      style={{ height: `${STAGE_VH}svh` }}
    >
      <div className="sticky top-0 h-screen-s overflow-hidden bg-void">
        {layer('sky', <canvas ref={skyRef} className="absolute inset-0 size-full" />)}
        {layer(
          'globe',
          <canvas
            ref={globeRef}
            className="absolute top-[30%] left-[62%] aspect-square w-[min(118vw,70svh)] -translate-x-1/2 -translate-y-1/2 md:top-[42%] md:left-[66%] md:w-[min(40vw,84svh)]"
          />,
        )}
        {layer(
          'plain',
          <>
            <canvas ref={plainRef} className="absolute inset-0 size-full" />
            {/* The plain as a liquid mirror: reflection and ripples, drawn over the grid. */}
            <canvas ref={mirrorRef} className="absolute inset-0 size-full mix-blend-screen" />
            {/* The data-centre city standing on the plain. */}
            <canvas ref={cityRef} className="absolute inset-0 size-full" />
          </>,
        )}

        {/* Title sits between the plain and the screen bezel. */}
        <div
          ref={titleRef}
          className="pointer-events-none absolute inset-x-0 top-[24%] text-center md:top-[30%]"
          style={{ opacity: 0 }}
        >
          <h1
            className="font-display text-hero text-white [text-shadow:0_4px_40px_rgb(0_0_0/0.6)]"
            style={{ marginRight: '-0.24em' }}
          >
            {hero.title}
          </h1>
          <p className="mt-4 font-mono text-label text-regolith/80 uppercase">{hero.kicker}</p>
        </div>

        {layer(
          'frame',
          <div className="bezel absolute inset-x-[4vw] top-[7svh] bottom-[11svh] md:inset-x-[5vw] md:top-[9svh] md:bottom-[12svh]">
            <div className="absolute inset-x-0 top-0 flex items-center justify-center gap-1.5 py-3">
              <span className="size-2 rounded-full bg-white/20" />
              <span className="size-2 rounded-full bg-white/20" />
              <span className="size-2 rounded-full bg-earth/70" />
            </div>
          </div>,
          'origin-center',
        )}
        {layer('avatar', <canvas ref={avatarRef} className="absolute inset-0 size-full" />)}
        {layer(
          'ground',
          <>
            <svg
              viewBox="0 0 1600 300"
              preserveAspectRatio="none"
              className="absolute inset-x-0 bottom-0 h-[24svh] w-full"
            >
              <path
                d={ground}
                fill="#05070c"
                stroke="rgba(111,182,255,0.22)"
                strokeWidth="1.2"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            {/* The ground carries a black apron below it, so when it climbs it
                fills the screen and hands straight over to the page below. */}
            <div className="absolute inset-x-0 top-full h-[110vh] bg-[#05070c]" />
          </>,
        )}

        {/* Code dust on the lens. */}
        <div
          ref={veilRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(60% 50% at 30% 40%, rgba(120,160,230,0.5), transparent 70%), radial-gradient(50% 60% at 75% 60%, rgba(90,130,200,0.45), transparent 70%), radial-gradient(80% 80% at 50% 50%, rgba(14,22,38,0.88), rgba(4,6,10,0.96))',
          }}
        >
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-4 text-center">
            <p className="font-mono text-label text-regolith/80 uppercase">{hero.kicker}</p>
            <p
              className="mt-3 font-display text-[0.8125rem] tracking-[0.5em] text-white/90 uppercase"
              style={{ marginRight: '-0.5em' }}
            >
              Scroll to boot up
            </p>
            <span
              aria-hidden="true"
              className="mt-6 inline-block animate-bounce text-regolith/70 motion-reduce:animate-none"
            >
              ↓
            </span>
          </div>
        </div>
        <canvas
          ref={dustRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 size-full"
        />

        {/* Telemetry HUD. */}
        <div
          ref={hudRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-4 font-mono text-[0.625rem] tracking-[0.14em] text-regolith/75 uppercase sm:inset-6 md:text-label"
          style={{ opacity: 0 }}
        >
          <div className="brackets absolute inset-0 text-regolith/40" />
          <div className="absolute top-20 left-3 space-y-1 md:top-28 md:left-4">
            <p ref={clockRef}>T+ 00:00:00</p>
            <p className="text-regolith/50">Uptime</p>
          </div>
          <div className="absolute top-20 right-3 space-y-1 text-right md:top-28 md:right-4">
            <p>
              Build{' '}
              <span ref={buildRef} className="text-earth">
                0%
              </span>
            </p>
            <p className="text-regolith/50">Compiling portfolio</p>
          </div>
          <div className="absolute bottom-3 left-3 md:bottom-4 md:left-4">{hero.site}</div>
          <div className="absolute right-3 bottom-3 flex items-center gap-2 md:right-4 md:bottom-4">
            Scroll <span className="inline-block animate-bounce motion-reduce:animate-none">↓</span>
          </div>
        </div>
      </div>
    </section>
  );
}
