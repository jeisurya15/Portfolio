// Stroke icons drawn on a 16px grid.
const base = {
  viewBox: '0 0 16 16',
  width: 16,
  height: 16,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.4,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

export const Play = () => (
  <svg {...base}>
    <path d="M4.5 3l8 5-8 5z" fill="currentColor" stroke="none" />
  </svg>
);
export const Pause = () => (
  <svg {...base}>
    <path d="M5 3v10M11 3v10" />
  </svg>
);
export const Layers = () => (
  <svg {...base}>
    <path d="M8 2l6 3-6 3-6-3z" />
    <path d="M2 8l6 3 6-3M2 11l6 3 6-3" />
  </svg>
);
export const MapIcon = () => (
  <svg {...base}>
    <path d="M2 4h12M2 8h12M2 12h8" />
  </svg>
);
export const Sound = ({ on }) => (
  <svg {...base}>
    <path d="M3 6h2l3-3v10l-3-3H3z" />
    <path d="M11 5.5a3.5 3.5 0 010 5M12.8 3.8a6 6 0 010 8.4" opacity={on ? 1 : 0.3} />
  </svg>
);
export const Frame = () => (
  <svg {...base}>
    <path d="M2 5V2h3M11 2h3v3M14 11v3h-3M5 14H2v-3" />
  </svg>
);
export const Close = () => (
  <svg {...base}>
    <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
  </svg>
);
export const Left = () => (
  <svg {...base}>
    <path d="M10 3L5 8l5 5" />
  </svg>
);
export const Right = () => (
  <svg {...base}>
    <path d="M6 3l5 5-5 5" />
  </svg>
);
export const Arrow = () => (
  <svg {...base}>
    <path d="M3 8h10M9 4l4 4-4 4" />
  </svg>
);
export const External = () => (
  <svg {...base} width={13} height={13}>
    <path d="M6 3H3v10h10v-3M9 3h4v4M13 3L7 9" />
  </svg>
);
export const GitHub = () => (
  <svg viewBox="0 0 16 16" width={16} height={16} fill="currentColor" aria-hidden>
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
  </svg>
);
export const LinkedIn = () => (
  <svg viewBox="0 0 16 16" width={16} height={16} fill="currentColor" aria-hidden>
    <path d="M0 1.15C0 .52.52 0 1.18 0h13.64C15.48 0 16 .52 16 1.15v13.7c0 .63-.52 1.15-1.18 1.15H1.18C.52 16 0 15.48 0 14.85V1.15zm4.94 12.24V6.17H2.54v7.22h2.4zM3.74 5.18c.84 0 1.36-.55 1.36-1.25-.02-.71-.52-1.25-1.34-1.25-.82 0-1.36.54-1.36 1.25 0 .7.52 1.25 1.33 1.25h.01zm4.91 8.21V9.36c0-.22.02-.43.08-.59.17-.43.57-.88 1.23-.88.87 0 1.21.66 1.21 1.63v3.87h2.4V9.25c0-2.22-1.18-3.25-2.76-3.25-1.27 0-1.84.7-2.16 1.19v.02h-.02l.02-.02V6.17h-2.4c.03.68 0 7.22 0 7.22h2.4z" />
  </svg>
);
