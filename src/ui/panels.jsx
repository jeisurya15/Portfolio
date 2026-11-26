import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { store, actions } from '@/store.js';
import { chapters, stack } from '@/workshop-content.js';
import { cn } from '@/lib/utils.js';
import { AnimatedBackground } from './primitives/animated-background';
import { spring } from './motion.js';
import * as Icon from './icons.jsx';

const pad = (n) => String(n).padStart(2, '0');
const close = () => actions.openPanel(null);
const list = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045, delayChildren: 0.18 } },
};
const item = {
  hidden: { opacity: 0, y: 14, filter: 'blur(6px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: spring },
};

export function Panels({ s }) {
  // Escape closes the open panel; focus returns to whatever opened it.
  const opener = useRef(null);
  useEffect(() => {
    if (s.panel) opener.current ??= document.activeElement;
    else {
      opener.current?.focus?.();
      opener.current = null;
    }
    document.body.classList.toggle('dialog-open', !!s.panel);
  }, [s.panel]);
  useEffect(() => {
    const key = (e) => {
      if (e.key === 'Escape' && store.get().panel) {
        e.preventDefault();
        close();
      }
    };
    addEventListener('keydown', key);
    return () => removeEventListener('keydown', key);
  }, []);
  const side = s.panel === 'detail' || s.panel === 'stack';
  return (
    <AnimatePresence>
      {s.panel && (
        <motion.div
          key="backdrop"
          className="fixed inset-0 z-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className={cn(
              'absolute inset-0 backdrop-blur-[6px]',
              side ? 'bg-gradient-to-r from-black/10 to-black/55' : 'bg-black/50',
            )}
            onClick={close}
          />
        </motion.div>
      )}
      {s.panel === 'detail' && <Detail key="detail" index={s.active} />}
      {s.panel === 'stack' && <Stack key="stack" />}
      {s.panel === 'map' && <RouteMap key="map" active={s.active} />}
    </AnimatePresence>
  );
}

function Sheet({ children, label, wide }) {
  const ref = useRef(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <motion.aside
      ref={ref}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className={cn(
        'sheet scrollbar-thin fixed top-0 right-0 bottom-0 z-50 overflow-y-auto overscroll-contain outline-none',
        'px-10 pt-[calc(var(--bar)+36px)] pb-12 max-md:px-5 max-md:pt-7',
        wide ? 'w-[min(680px,100%)]' : 'w-[min(540px,100%)]',
      )}
      initial={{ x: '104%' }}
      animate={{ x: 0 }}
      exit={{ x: '104%', transition: { type: 'spring', stiffness: 320, damping: 36 } }}
      transition={{ type: 'spring', stiffness: 210, damping: 30 }}
    >
      <CloseButton />
      {children}
    </motion.aside>
  );
}

// Raised above the panel content: the animated heading would otherwise sit on top of it.
function CloseButton() {
  return (
    <motion.button
      type="button"
      onClick={close}
      aria-label="Close"
      className="absolute top-[calc(var(--bar)+24px)] right-7 z-20 grid h-9 w-9 place-items-center rounded-lg border border-white/12 text-muted transition-colors hover:border-white/30 hover:text-white max-md:top-4 max-md:right-4"
      whileHover={{ rotate: 90 }}
      transition={spring}
    >
      <Icon.Close />
    </motion.button>
  );
}

function ProjectTitle({ c, index }) {
  return (
    <div className="mt-4 border-b border-white/10 pb-6">
      <h2
        id="detail-title"
        className="m-0 text-[clamp(28px,3.4vw,40px)] leading-tight font-medium tracking-[-0.03em]"
      >
        {c.detail.title}
      </h2>
      <p className="m-0 mt-2 text-[13px] text-muted">
        Room {index + 1} of {chapters.length}
      </p>
    </div>
  );
}

function Detail({ index }) {
  const c = chapters[index],
    d = c.detail;
  if (d.stackView) return <Stack />;
  return (
    <Sheet label={d.title} wide>
      <motion.div variants={list} initial="hidden" animate="show">
        <motion.p
          variants={item}
          className="m-0 font-mono text-[11px] tracking-[0.16em] text-amber uppercase"
        >
          {pad(index + 1)} · {c.label}
        </motion.p>
        <motion.div variants={item}>
          <ProjectTitle c={c} index={index} />
        </motion.div>
        <motion.p variants={item} className="mt-6 text-[17px] leading-relaxed text-[#bcc4cc]">
          {d.lead}
        </motion.p>
        {d.facts && (
          <motion.dl
            variants={item}
            className="mt-7 grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10"
          >
            {d.facts.map(([k, v]) => (
              <div key={k} className="bg-[#0d131b] px-4 py-3.5">
                <dt className="font-mono text-[10.5px] tracking-[0.12em] text-faint uppercase">
                  {k}
                </dt>
                <dd className="m-0 mt-1.5 text-[14px]">{v}</dd>
              </div>
            ))}
          </motion.dl>
        )}
        {d.timeline && (
          <motion.ol variants={item} className="mt-7 list-none p-0">
            {d.timeline.map(([when, where, what]) => (
              <li
                key={when}
                className="grid grid-cols-[150px_1fr] gap-x-6 gap-y-1 border-t border-white/10 py-4 max-md:grid-cols-1"
              >
                <span className="row-span-2 pt-1 font-mono text-xs text-amber-soft max-md:row-span-1">
                  {when}
                </span>
                <strong className="text-lg font-medium">{where}</strong>
                <em className="text-sm text-muted not-italic">{what}</em>
              </li>
            ))}
          </motion.ol>
        )}
        {d.features && (
          <motion.div variants={item}>
            <SectionTitle>Key features</SectionTitle>
            <ul className="m-0 grid list-none grid-cols-2 gap-x-6 gap-y-2.5 p-0 max-md:grid-cols-1">
              {d.features.map((f) => (
                <li key={f} className="relative pl-5 text-sm leading-snug text-[#d3d9de]">
                  <span className="absolute top-[0.65em] left-0 h-px w-2 bg-amber" />
                  {f}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
        {d.blocks.length > 0 && (
          <motion.div variants={item} className="mt-8">
            {d.blocks.map(([h, p]) => (
              <section
                key={h}
                className="grid grid-cols-[170px_1fr] gap-6 border-t border-white/10 py-4.5 max-md:grid-cols-1 max-md:gap-2"
              >
                <h3 className="m-0 pt-0.5 font-mono text-[11px] font-normal tracking-[0.12em] text-muted uppercase">
                  {h}
                </h3>
                <p className="m-0 text-[15px] leading-relaxed text-[#d6dce1]">{p}</p>
              </section>
            ))}
          </motion.div>
        )}
        {d.stack && (
          <motion.div variants={item}>
            <SectionTitle>Built with</SectionTitle>
            <Chips items={d.stack} />
          </motion.div>
        )}
        {(d.links || d.contact) && (
          <motion.div variants={item} className="mt-8 flex flex-wrap items-center gap-2.5">
            {d.contact && <Contact />}
            {d.links?.map(([label, url], i) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noreferrer"
                className={cn('btn', i === 0 && !d.contact && 'btn-accent')}
              >
                {label} <Icon.External />
              </a>
            ))}
          </motion.div>
        )}
        <motion.p
          variants={item}
          className="mt-9 font-mono text-[10.5px] tracking-[0.08em] text-faint"
        >
          FROM JEI SURYA’S RÉSUMÉ AND PUBLIC GITHUB · 3D INSTALLATIONS ARE ILLUSTRATIVE
        </motion.p>
      </motion.div>
    </Sheet>
  );
}

function Contact() {
  const [copied, setCopied] = useState(false);
  return (
    <>
      <a href="mailto:jeisurya624@gmail.com" className="btn btn-accent">
        Send an email <Icon.Arrow />
      </a>
      <button
        type="button"
        className="btn"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText('jeisurya624@gmail.com');
            setCopied(true);
          } catch {
            setCopied(null);
          }
        }}
      >
        {copied ? 'Copied ✓' : copied === null ? 'jeisurya624@gmail.com' : 'Copy email'}
      </button>
      {[
        ['GitHub', 'https://github.com/jeisurya15'],
        ['LinkedIn', 'https://linkedin.com/in/jeisurya15'],
      ].map(([label, url]) => (
        <a key={url} href={url} target="_blank" rel="noreferrer" className="btn">
          {label} <Icon.External />
        </a>
      ))}
    </>
  );
}

function SectionTitle({ children }) {
  return (
    <h3 className="mt-8 mb-3.5 font-mono text-[11px] font-normal tracking-[0.12em] text-muted uppercase">
      {children}
    </h3>
  );
}

function Chips({ items }) {
  return (
    <motion.ul
      className="m-0 flex list-none flex-wrap gap-1.5 p-0"
      variants={list}
      initial="hidden"
      animate="show"
    >
      {items.map((t) => (
        <motion.li
          key={t}
          variants={{
            hidden: { opacity: 0, scale: 0.85, y: 6 },
            show: { opacity: 1, scale: 1, y: 0, transition: spring },
          }}
          whileHover={{ y: -1, borderColor: 'rgba(255,255,255,0.35)' }}
          className="rounded-md border border-white/12 bg-white/[0.03] px-2.5 py-1 text-[13px] text-[#d6dce1]"
        >
          {t}
        </motion.li>
      ))}
    </motion.ul>
  );
}

function Stack() {
  const total = stack.reduce((n, g) => n + g.items.length, 0);
  return (
    <Sheet label="Technical stack">
      <motion.div variants={list} initial="hidden" animate="show">
        <motion.p
          variants={item}
          className="m-0 font-mono text-[11px] tracking-[0.16em] text-amber"
        >
          TECHNICAL STACK
        </motion.p>
        <motion.h2
          variants={item}
          className="mt-0 mb-2.5 text-[32px] font-medium tracking-[-0.03em]"
        >
          What I build with
        </motion.h2>
        <motion.p variants={item} className="m-0 text-sm leading-relaxed text-muted">
          {total} tools across {stack.length} layers, learned as an IT student and used in my
          projects.
        </motion.p>
        <div className="mt-6">
          {stack.map((g, i) => (
            <motion.section
              key={g.group}
              variants={item}
              className="border-t border-white/10 py-4.5"
            >
              <h3 className="m-0 mb-3 flex items-baseline gap-3 text-[15px] font-medium">
                <span className="font-mono text-[11px] text-amber">{pad(i + 1)}</span>
                {g.group}
                <span className="ml-auto font-mono text-[11px] text-faint">{g.items.length}</span>
              </h3>
              <Chips items={g.items} />
            </motion.section>
          ))}
        </div>
      </motion.div>
    </Sheet>
  );
}

const shortcuts = [
  ['Walk', ['W', 'S']],
  ['Next / previous', ['PgDn', 'PgUp']],
  ['Move closer', ['E']],
  ['Explore exhibit', ['Enter']],
  ['Tech stack', ['T']],
  ['Sound', ['M']],
  ['Cinema view', ['C']],
  ['Look around', ['drag']],
];

function RouteMap({ active }) {
  const ref = useRef(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <motion.div
      ref={ref}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Route map"
      className="panel scrollbar-thin fixed top-1/2 left-1/2 z-50 max-h-[86vh] w-[min(720px,calc(100%-32px))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto !bg-[rgba(10,14,20,0.96)] p-10 outline-none max-md:p-6"
      initial={{ opacity: 0, scale: 0.94, y: 24, filter: 'blur(10px)' }}
      animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.96, y: 12, filter: 'blur(8px)' }}
      transition={spring}
    >
      <CloseButton />
      <p className="m-0 font-mono text-[11px] tracking-[0.14em] text-amber uppercase">
        Projects &amp; rooms
      </p>
      <h2 className="mt-3 mb-6 text-[32px] font-medium tracking-[-0.03em] max-md:text-2xl">
        {chapters.length} rooms, <span className="text-amber">one machine.</span>
      </h2>
      <motion.div variants={list} initial="hidden" animate="show" className="flex flex-col">
        <AnimatedBackground
          className="rounded-lg bg-white/[0.06]"
          transition={{ type: 'spring', bounce: 0.15, duration: 0.35 }}
          enableHover
        >
          {chapters.map((c, i) => (
            <button
              key={c.slug}
              data-id={c.slug}
              type="button"
              onClick={() => {
                close();
                actions.jump(i);
              }}
              className="w-full border-t border-white/[0.07] px-3 py-4 text-left [&>div]:w-full"
            >
              <span className="flex w-full items-center gap-5">
                <span
                  className={cn('font-mono text-xs', i === active ? 'text-amber' : 'text-faint')}
                >
                  {pad(i + 1)}
                </span>
                <span className="text-[17px] font-medium tracking-[-0.01em]">
                  {c.name}
                  <small className="mt-1 block font-mono text-[10.5px] tracking-[0.1em] text-muted">
                    {c.caption}
                  </small>
                </span>
                <span className={cn('ml-auto', i === active ? 'text-amber' : 'text-faint')}>
                  <Icon.Arrow />
                </span>
              </span>
            </button>
          ))}
        </AnimatedBackground>
      </motion.div>
      <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-2.5 border-t border-white/10 pt-6 text-[13px] text-muted max-md:hidden">
        {shortcuts.map(([label, keys]) => (
          <div key={label} className="flex justify-between gap-3">
            <span>{label}</span>
            <span className="flex gap-1">
              {keys.map((k) => (k === 'drag' ? <span key={k}>drag</span> : <kbd key={k}>{k}</kbd>))}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
