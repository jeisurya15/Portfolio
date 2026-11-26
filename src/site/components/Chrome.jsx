import { useState } from 'react';
import { brand, nav } from '../content.js';
import { scrollToHash } from '../lib/scroll.js';

function go(e, then) {
  const hash = e.currentTarget.getAttribute('href');
  if (!hash?.startsWith('#')) return;
  e.preventDefault();
  then?.();
  scrollToHash(hash);
}

/** Angle brackets: the mark. */
function Mark({ className = '' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 6 2.5 12 8 18M16 6l5.5 6-5.5 6" />
      <path d="M13.5 4.5 10.5 19.5" opacity="0.55" />
    </svg>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed inset-x-0 top-0 z-50 text-white">
      {/* The hero is a long pinned scroll; let keyboard users jump past it. */}
      <a
        href="#work"
        onClick={(e) => {
          go(e);
          const target = document.getElementById('work');
          if (!target) return;
          target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: true });
        }}
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-1/2 focus:z-[60] focus:-translate-x-1/2 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:text-black"
      >
        Skip to projects
      </a>
      <div className="flex items-center justify-between px-4 pt-4 sm:px-6 sm:pt-5 md:px-[3vw]">
        <a
          href="#top"
          onClick={(e) => go(e)}
          className="flex items-center gap-2.5"
          aria-label={`${brand.name} — back to top`}
        >
          <Mark className="size-5" />
          <span className="font-display text-[0.9375rem] tracking-[0.36em]">{brand.wordmark}</span>
        </a>
        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => go(e)}
              className="font-mono text-label text-white/75 uppercase transition-colors hover:text-white"
            >
              {item.label}
            </a>
          ))}
          <a
            href="#contact"
            onClick={(e) => go(e)}
            className="rounded-[4px] bg-white px-4 py-2.5 font-mono text-label text-void uppercase transition-colors hover:bg-earth"
          >
            Hire me
          </a>
        </nav>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="menu"
          className="font-mono text-label uppercase md:hidden"
        >
          {open ? 'Close' : 'Menu'}
        </button>
      </div>
      <div
        id="menu"
        inert={!open}
        className={`fixed inset-0 -z-10 flex flex-col justify-center gap-6 bg-void/95 px-6 backdrop-blur-xl transition-opacity md:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      >
        {nav.map((item, i) => (
          <a
            key={item.href}
            href={item.href}
            onClick={(e) => go(e, () => setOpen(false))}
            className="flex items-baseline gap-4 font-display text-[1.75rem] tracking-[0.14em] uppercase"
          >
            <span className="font-mono text-label text-earth">0{i + 1}</span>
            {item.label}
          </a>
        ))}
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-void px-4 py-8 sm:px-6 md:px-[6vw]">
      <div className="flex flex-col gap-4 font-mono text-label text-regolith/50 uppercase md:flex-row md:items-center md:justify-between">
        <span className="flex items-center gap-2.5 text-white/80">
          <Mark className="size-4" />
          {brand.wordmark} · {brand.role}
        </span>
        <span>© {new Date().getFullYear()} · Built with React, Three.js & Lenis</span>
        <a href="#top" onClick={(e) => go(e)} className="hover:text-white">
          Back to boot ↑
        </a>
      </div>
    </footer>
  );
}
