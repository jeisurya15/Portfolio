import Lenis from 'lenis';

/**
 * One rAF loop for the whole page. Lenis advances first, then every
 * scroll-driven component reads its own rect and writes styles directly —
 * nothing here goes through React state, so scrolling never re-renders.
 */

const subscribers = new Set();
let lenis = null;

export function startScroll(reducedMotion) {
  if (!reducedMotion) {
    lenis = new Lenis({ lerp: 0.07, smoothWheel: true, wheelMultiplier: 0.85, touchMultiplier: 1.4 });
  }

  let raf = 0;
  const loop = (time) => {
    lenis?.raf(time);
    subscribers.forEach((fn) => fn(time));
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(raf);
    lenis?.destroy();
    lenis = null;
  };
}

export function onFrame(fn) {
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
}

/** Smooth-scrolls to an in-page hash like `#work`, or to the top for `#top`. */
export function scrollToHash(hash) {
  const target = hash === '#top' ? 0 : document.querySelector(hash);
  if (target === null) return;
  if (lenis) {
    lenis.scrollTo(target, { duration: 1.6 });
  } else if (typeof target === 'number') {
    window.scrollTo({ top: target });
  } else {
    target.scrollIntoView();
  }
  history.replaceState(null, '', hash === '#top' ? ' ' : hash);
}

/** Freezes page scrolling (e.g. while a dialog is open), and releases it. */
export function lockScroll(locked) {
  if (locked) lenis?.stop();
  else lenis?.start();
  document.documentElement.style.overflow = locked ? 'hidden' : '';
}

/** Smooth-scrolls to an absolute page offset. */
export function scrollToY(y) {
  if (lenis) lenis.scrollTo(y, { duration: 1.2 });
  else window.scrollTo({ top: y });
}
