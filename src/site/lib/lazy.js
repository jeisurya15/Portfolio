/**
 * Helpers for loading the 3D scenes only when they are useful.
 * three.js is ~500 kB, so every scene module is imported on demand.
 */

/**
 * Resolves once `el` is within `margin` of the viewport. If `signal` aborts
 * first, the promise never resolves and the observer is released.
 */
export function whenNear(el, signal, margin = '100% 0px') {
  return new Promise((resolve) => {
    if (!el || signal?.aborted) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        resolve();
      },
      { rootMargin: margin },
    );
    io.observe(el);
    signal?.addEventListener('abort', () => io.disconnect(), { once: true });
  });
}

/**
 * Decides whether this device should run the WebGL scenes at all. When it
 * returns false, the page keeps its painted 2D layers and plain text, which
 * already read as a complete design.
 */
export function shouldRender3D() {
  // TODO(Jei): decide which devices skip 3D. See the note in the PR/chat.
  return true;
}
