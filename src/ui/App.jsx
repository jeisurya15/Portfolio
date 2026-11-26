import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { AnimatePresence, motion, useTransform } from 'motion/react';
import { store, progress, actions } from '@/store.js';
import { chapters } from '@/workshop-content.js';
import { cn } from '@/lib/utils.js';
import { TextEffect } from './primitives/text-effect';
import { SlidingNumber } from './primitives/sliding-number';
import { AnimatedBackground } from './primitives/animated-background';
import { Panels } from './panels.jsx';
import { spring, soft } from './motion.js';
import * as Icon from './icons.jsx';

export const useStore = () => useSyncExternalStore(store.subscribe, store.get);
export const pad = (n) => String(n).padStart(2, '0');
const LAST = chapters.length - 1;
const room = (slug) => chapters.findIndex((c) => c.slug === slug);

export default function App() {
  const s = useStore();
  useEffect(() => {
    document.body.classList.toggle('cinema', s.cinema);
  }, [s.cinema]);
  const ui = s.loaded && !s.cinema;
  return (
    <>
      <Loader load={s.load} loaded={s.loaded} />
      <Frame show={ui} />
      <Header s={s} show={ui} />
      <Copy s={s} />
      <TitleCard active={s.active} loaded={s.loaded} cinema={s.cinema} />
      <Rail s={s} show={ui} />
      <AnimatePresence>
        {s.tour && (
          <motion.p
            className="panel fixed top-[calc(var(--bar)+92px)] right-[var(--gutter)] z-20 m-0 flex items-center gap-2 px-3.5 py-2 text-[12.5px] text-[#d5dbe1] max-md:top-[78px]"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber" />
            Guided tour playing · scroll to take control
          </motion.p>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {s.cinema && (
          <motion.button
            type="button"
            className="btn fixed bottom-[calc(var(--bar)+22px)] left-1/2 z-40 -translate-x-1/2"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.5, ...spring } }}
            exit={{ opacity: 0, y: 16 }}
            onClick={() => actions.setCinema(false)}
          >
            Exit cinema view <kbd>Esc</kbd>
          </motion.button>
        )}
      </AnimatePresence>
      <Toast toast={s.toast} />
      <Panels s={s} />
    </>
  );
}

function Loader({ load, loaded }) {
  return (
    <AnimatePresence>
      {!loaded && (
        <motion.div
          className="fixed inset-0 z-[60] grid place-items-center bg-[#0a0e14]"
          exit={{ opacity: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }}
        >
          <div className="w-[min(300px,80vw)] text-center">
            <p className="m-0 text-[15px] font-medium text-ink">Jei Surya T</p>
            <p className="m-0 mt-1 font-mono text-[11px] tracking-[0.14em] text-faint uppercase">
              Java full-stack developer
            </p>
            <div className="mt-6 h-px overflow-hidden bg-white/10">
              <motion.div
                className="h-full origin-left bg-amber"
                animate={{ scaleX: load }}
                transition={{ type: 'spring', stiffness: 60, damping: 20 }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Thin corner marks frame the scene, a quiet nod to the "inside the machine" idea.
function Frame({ show }) {
  const corner = 'absolute h-5 w-5 border-white/25';
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-x-4 top-[calc(var(--bar)+16px)] bottom-[calc(var(--bar)+16px)] z-[7] max-md:hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: show ? 1 : 0 }}
      transition={{ duration: 0.8, delay: show ? 0.3 : 0 }}
    >
      <span className={cn(corner, 'top-0 left-0 border-t border-l')} />
      <span className={cn(corner, 'top-0 right-0 border-t border-r')} />
      <span className={cn(corner, 'bottom-0 left-0 border-b border-l')} />
      <span className={cn(corner, 'right-0 bottom-0 border-r border-b')} />
    </motion.div>
  );
}

function Header({ s, show }) {
  const nav = [
    { id: 'projects', label: 'Projects', run: () => actions.openPanel('map') },
    { id: 'stack', label: 'Tech stack', run: () => actions.openPanel('stack') },
    { id: 'experience', label: 'Experience', run: () => actions.jump(room('experience')) },
  ];
  const tools = [
    {
      id: 'tour',
      label: s.tour ? 'Stop guided tour' : 'Guided tour',
      icon: s.tour ? <Icon.Pause /> : <Icon.Play />,
      run: actions.toggleTour,
      on: s.tour,
    },
    {
      id: 'sound',
      label: s.sound ? 'Turn sound off' : 'Turn sound on',
      icon: <Icon.Sound on={s.sound} />,
      run: actions.toggleSound,
      on: s.sound,
    },
    {
      id: 'cinema',
      label: 'Cinema view',
      icon: <Icon.Frame />,
      run: () => actions.setCinema(!s.cinema),
      on: s.cinema,
    },
    {
      id: 'motion',
      label: s.paused ? 'Resume motion' : 'Pause motion',
      icon: s.paused ? <Icon.Play /> : <Icon.Pause />,
      run: actions.togglePause,
      on: s.paused,
    },
  ];
  return (
    <motion.header
      className="fixed inset-x-0 top-[var(--bar)] z-20 flex items-center justify-between gap-6 px-[calc(var(--gutter)+8px)] py-6 max-md:px-4 max-md:py-4"
      initial={{ opacity: 0, y: -12 }}
      animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y: -12 }}
      transition={{ ...soft, delay: show ? 0.3 : 0 }}
      style={{ pointerEvents: show ? 'auto' : 'none' }}
    >
      <a
        href="#intro"
        className="flex items-center gap-3"
        aria-label="Jei Surya T, back to the start"
      >
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-ink text-[13px] font-semibold text-[#0a0e14]">
          JS
        </span>
        <span className="leading-tight">
          <span className="block text-[14px] font-medium">Jei Surya T</span>
          <span className="block text-[12px] text-muted max-md:hidden">
            Java full-stack developer
          </span>
        </span>
      </a>
      <div className="flex items-center gap-2">
        <nav aria-label="Sections" className="panel flex p-1 max-lg:hidden">
          <AnimatedBackground
            className="rounded-md bg-white/[0.08]"
            transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
            enableHover
          >
            {nav.map((it) => (
              <button
                key={it.id}
                data-id={it.id}
                type="button"
                onClick={it.run}
                className="rounded-md px-3.5 py-2 text-[13px] text-[#c9d1d9] transition-colors hover:text-white"
              >
                {it.label}
              </button>
            ))}
          </AnimatedBackground>
        </nav>
        <div className="panel flex p-1">
          {tools.map((it) => (
            <button
              key={it.id}
              type="button"
              onClick={it.run}
              aria-label={it.label}
              aria-pressed={it.on}
              title={it.label}
              className={cn(
                'grid h-9 w-9 place-items-center rounded-md transition-colors hover:bg-white/[0.08]',
                it.on ? 'text-amber' : 'text-[#aeb8c2] hover:text-white',
                it.id !== 'tour' && 'max-md:hidden',
              )}
            >
              {it.icon}
            </button>
          ))}
          <span className="mx-1 my-2 w-px bg-white/10" />
          {[
            ['GitHub', 'https://github.com/jeisurya15', <Icon.GitHub key="g" />],
            ['LinkedIn', 'https://linkedin.com/in/jeisurya15', <Icon.LinkedIn key="l" />],
          ].map(([label, url, icon]) => (
            <a
              key={label}
              href={url}
              target="_blank"
              rel="noreferrer"
              aria-label={label}
              title={label}
              className="grid h-9 w-9 place-items-center rounded-md text-[#aeb8c2] transition-colors hover:bg-white/[0.08] hover:text-white"
            >
              {icon}
            </a>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            const i = room('contact');
            if (store.get().active === i) actions.openPanel('detail');
            else actions.jump(i);
          }}
          className="btn btn-accent max-md:hidden"
        >
          Contact
        </button>
      </div>
    </motion.header>
  );
}

// Splits "Meet the mind<br>behind the <em>build.</em>" into lines of words, keeping the emphasis.
function parseTitle(html) {
  return html.split('<br>').map((line) =>
    line
      .split(/(<em>.*?<\/em>)/)
      .filter(Boolean)
      .flatMap((part) => {
        const em = part.startsWith('<em>');
        return part
          .replace(/<\/?em>/g, '')
          .split(' ')
          .filter(Boolean)
          .map((w) => ({ w, em }));
      }),
  );
}

function Copy({ s }) {
  const c = chapters[s.active];
  const hidden = !s.loaded || s.cinema || s.panel === 'stack';
  const lines = parseTitle(c.title);
  let n = 0;
  return (
    <main
      className={cn(
        'pointer-events-none fixed top-1/2 left-[calc(var(--gutter)+8px)] z-10 w-[min(520px,40vw)] -translate-y-[48%] transition-opacity duration-500',
        'max-md:top-auto max-md:right-4 max-md:bottom-[88px] max-md:left-4 max-md:w-auto max-md:translate-y-0',
        hidden && 'opacity-0',
      )}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={c.slug + s.focused}
          className="panel px-8 pt-7 pb-8 max-md:px-5 max-md:pt-5 max-md:pb-5"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10, transition: { duration: 0.22 } }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="m-0 mb-5 flex items-center gap-3 font-mono text-[11px] tracking-[0.14em] text-muted uppercase max-md:mb-3">
            <span className="text-amber">{pad(s.active + 1)}</span>
            <span className="h-px w-6 bg-white/20" />
            {c.label}
          </p>
          <h1 className="m-0 mb-5 text-[clamp(32px,2.9vw,48px)] leading-[1.08] font-medium tracking-[-0.03em] text-balance max-md:mb-3 max-md:text-[28px]">
            {lines.map((line, li) => (
              <span key={li} className="block">
                {line.map(({ w, em }, wi) => (
                  <span key={wi} className="inline-block overflow-hidden pb-[0.06em] align-bottom">
                    <motion.span
                      className={cn('inline-block', em && 'text-amber')}
                      initial={{ y: '100%' }}
                      animate={{ y: '0%' }}
                      transition={{ ...spring, delay: 0.05 + n++ * 0.04 }}
                    >
                      {w}
                    </motion.span>
                    {wi < line.length - 1 && ' '}
                  </span>
                ))}
              </span>
            ))}
          </h1>
          {!s.focused && (
            <TextEffect
              per="word"
              preset="fade"
              speedReveal={3}
              delay={0.2}
              as="p"
              className="m-0 mb-5 text-[15px] leading-relaxed text-[#b3bdc7] max-md:mb-4 max-md:text-[14px]"
            >
              {c.intro}
            </TextEffect>
          )}
          {!s.focused && (
            <motion.ul
              className="m-0 mb-7 flex list-none flex-wrap gap-1.5 p-0 max-md:hidden"
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.04, delayChildren: 0.35 } } }}
            >
              {c.tags.map((t) => (
                <motion.li
                  key={t}
                  variants={{ hidden: { opacity: 0, y: 4 }, show: { opacity: 1, y: 0 } }}
                  className="rounded-md border border-white/10 px-2.5 py-1 font-mono text-[10.5px] tracking-[0.06em] text-[#b9c3cc]"
                >
                  {t}
                </motion.li>
              ))}
            </motion.ul>
          )}
          <motion.div
            className="pointer-events-auto flex flex-wrap items-center gap-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.4 }}
          >
            <button
              type="button"
              onClick={() => actions.openPanel('detail')}
              className="btn btn-accent group"
            >
              {c.action}
              <span className="transition-transform duration-300 group-hover:translate-x-0.5">
                <Icon.Arrow />
              </span>
            </button>
            {c.demo && (
              <button type="button" onClick={actions.act} className="btn">
                {c.demo}
              </button>
            )}
            <button
              type="button"
              onClick={actions.toggleFocus}
              aria-pressed={s.focused}
              className="px-2 py-2.5 text-[13px] text-muted transition-colors hover:text-white"
            >
              {s.focused ? '← Back to the path' : 'Move closer'}
            </button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </main>
  );
}

// A brief, understated title when a new room begins.
function TitleCard({ active, loaded, cinema }) {
  const [shown, setShown] = useState(null);
  const first = useRef(true);
  useEffect(() => {
    if (!loaded) return;
    if (first.current) {
      first.current = false;
      return;
    }
    setShown(active);
    const t = setTimeout(() => setShown(null), 1700);
    return () => clearTimeout(t);
  }, [active, loaded]);
  const c = shown == null ? null : chapters[shown];
  return (
    <AnimatePresence>
      {c && !cinema && (
        <motion.div
          key={c.slug}
          aria-hidden
          className="pointer-events-none fixed top-[28%] left-1/2 z-[15] -translate-x-1/2 text-center whitespace-nowrap max-md:hidden"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6, transition: { duration: 0.4 } }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="m-0 font-mono text-[11px] tracking-[0.3em] text-amber">
            {pad(shown + 1)} / {pad(chapters.length)}
          </p>
          <p className="m-0 mt-2 text-[clamp(28px,3.2vw,44px)] font-medium tracking-[-0.02em]">
            {c.name}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// One segment per room, filling as the walk passes through it.
function Rail({ s, show }) {
  return (
    <motion.nav
      aria-label="Rooms"
      className="fixed right-[calc(var(--gutter)+8px)] bottom-[calc(var(--bar)+28px)] left-[calc(var(--gutter)+8px)] z-20 flex items-center gap-3 max-md:right-4 max-md:bottom-5 max-md:left-4 max-md:gap-2"
      initial={{ opacity: 0, y: 16 }}
      animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
      transition={{ ...soft, delay: show ? 0.45 : 0 }}
      style={{ pointerEvents: show ? 'auto' : 'none' }}
    >
      <button
        type="button"
        aria-label="Previous room"
        disabled={s.active === 0}
        onClick={() => actions.jump(s.active - 1)}
        className="btn h-9 w-9 justify-center p-0"
      >
        <Icon.Left />
      </button>
      <div className="flex flex-1 gap-1">
        {chapters.map((c, i) => (
          <Cell key={c.slug} c={c} i={i} active={i === s.active} />
        ))}
      </div>
      <button
        type="button"
        aria-label="Next room"
        disabled={s.active === LAST}
        onClick={() => actions.jump(s.active + 1)}
        className="btn h-9 w-9 justify-center p-0"
      >
        <Icon.Right />
      </button>
      <div className="flex min-w-14 items-center justify-end gap-1 font-mono text-[12px] text-faint max-md:hidden">
        <span className="text-ink">
          <SlidingNumber value={s.active + 1} padStart />
        </span>
        / {pad(chapters.length)}
      </div>
    </motion.nav>
  );
}

function Cell({ c, i, active }) {
  const fill = useTransform(progress, (v) => Math.min(1, Math.max(0, v - i + 0.5)));
  return (
    <button
      type="button"
      onClick={() => actions.jump(i)}
      aria-label={`${pad(i + 1)} ${c.name}`}
      aria-current={active ? 'step' : undefined}
      className="group relative h-8 flex-1"
    >
      <span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-white/12 transition-colors group-hover:bg-white/25" />
      <motion.span
        className={cn(
          'absolute inset-x-0 top-1/2 h-[3px] origin-left -translate-y-1/2 rounded-full transition-colors duration-500',
          active ? 'bg-amber' : 'bg-white/60',
        )}
        style={{ scaleX: fill }}
      />
      <span
        className={cn(
          'absolute bottom-7 left-0 text-[12px] whitespace-nowrap transition-all duration-300 max-md:hidden',
          active
            ? 'text-ink opacity-100'
            : 'translate-y-1 text-muted opacity-0 group-hover:translate-y-0 group-hover:opacity-100',
        )}
      >
        {c.short}
      </span>
    </button>
  );
}

function Toast({ toast }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--bar)+88px)] z-50 flex justify-center px-5 max-md:top-20 max-md:bottom-auto">
      <AnimatePresence mode="popLayout">
        {toast && (
          <motion.div
            key={toast.id}
            role="status"
            className="panel px-4 py-2.5 text-[13px] text-ink"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={spring}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
