import { motionValue } from 'motion/react';

// Shared state between the Three.js engine and the React interface.
// The engine owns the walk; the interface owns panels. Each side calls the other through `actions`.
let state = {
  loaded: false,
  load: 0,
  active: 0,
  moving: false,
  focused: false,
  cinema: false,
  paused: false,
  tour: false,
  sound: false,
  // null | 'detail' | 'map' | 'stack'
  panel: null,
  toast: null,
};
const listeners = new Set();

export const store = {
  get: () => state,
  set(partial) {
    state = { ...state, ...partial };
    listeners.forEach((l) => l());
  },
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

// Walk progress (0 … rooms − 1) updates every frame, so it bypasses React state.
export const progress = motionValue(0);

// Filled in by the engine: jump, act, toggleFocus, toggleTour, toggleSound, togglePause, setCinema.
export const actions = {};

let toastId = 0;
export function toast(message) {
  store.set({ toast: { id: ++toastId, message } });
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => store.set({ toast: null }), 3400);
}
