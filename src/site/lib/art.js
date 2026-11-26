import { seeded } from './math.js';

/**
 * The hero's flat layers, painted once per resize onto canvases:
 * the sky (stars and a galaxy band made of data) and the plain
 * (a server skyline on the horizon over a receding grid).
 */

/** Sizes a canvas to its CSS box and returns a context drawing in CSS pixels. */
export function prepare(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

export const horizonAt = (w, h) => h * (w / h < 0.8 ? 0.62 : 0.6);

export function paintSky(canvas) {
  const { ctx, w, h } = prepare(canvas);
  const rand = seeded(3);
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#03050a');
  sky.addColorStop(0.65, '#081120');
  sky.addColorStop(1, '#0d1a2e');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Scattered stars.
  for (let i = 0; i < (w * h) / 2600; i++) {
    ctx.globalAlpha = 0.15 + rand() * 0.6;
    ctx.fillStyle = rand() < 0.15 ? '#ffd9b0' : '#dfe9ff';
    ctx.fillRect(rand() * w, rand() * h, rand() < 0.08 ? 1.6 : 0.9, rand() < 0.08 ? 1.6 : 0.9);
  }

  // The galaxy band: a diagonal river of points and stray glyphs.
  const ax = -0.05 * w,
    ay = 0.9 * h,
    bx = 1.05 * w,
    by = 0.02 * h;
  const len = Math.hypot(bx - ax, by - ay);
  const nx = -(by - ay) / len,
    ny = (bx - ax) / len;
  for (let i = 0; i < 26; i++) {
    const t = i / 25;
    const g = ctx.createRadialGradient(
      ax + (bx - ax) * t,
      ay + (by - ay) * t,
      0,
      ax + (bx - ax) * t,
      ay + (by - ay) * t,
      h * 0.22,
    );
    g.addColorStop(0, 'rgba(90,130,210,0.07)');
    g.addColorStop(1, 'rgba(90,130,210,0)');
    ctx.globalAlpha = 1;
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
  const gauss = () => (rand() + rand() + rand() - 1.5) / 1.5;
  for (let i = 0; i < (w * h) / 260; i++) {
    const t = rand();
    const off = gauss() * h * 0.12;
    ctx.globalAlpha = (0.12 + rand() * 0.55) * (1 - Math.abs(off) / (h * 0.14));
    ctx.fillStyle = rand() < 0.2 ? '#9cc4ff' : '#e6eeff';
    const s = rand() < 0.04 ? 1.5 : 0.7;
    ctx.fillRect(ax + (bx - ax) * t + nx * off, ay + (by - ay) * t + ny * off, s, s);
  }
  ctx.font = '500 9px "IBM Plex Mono", monospace';
  const glyphs = ['0', '1', '{', '}', '<>', '=>', ';', '0x1F', '//'];
  for (let i = 0; i < 110; i++) {
    const t = rand();
    const off = gauss() * h * 0.08;
    ctx.globalAlpha = 0.1 + rand() * 0.22;
    ctx.fillStyle = '#9cc4ff';
    ctx.fillText(
      glyphs[Math.floor(rand() * glyphs.length)],
      ax + (bx - ax) * t + nx * off,
      ay + (by - ay) * t + ny * off,
    );
  }
  ctx.globalAlpha = 1;
}

export function paintPlain(canvas) {
  const { ctx, w, h } = prepare(canvas);
  const rand = seeded(9);
  const H = horizonAt(w, h);
  ctx.clearRect(0, 0, w, h);

  // Ground below the horizon.
  const floor = ctx.createLinearGradient(0, H, 0, h);
  floor.addColorStop(0, '#111c2c');
  floor.addColorStop(0.35, '#0a111c');
  floor.addColorStop(1, '#05070c');
  ctx.fillStyle = floor;
  ctx.fillRect(0, H, w, h - H);

  // Globe-light pooled on the plain.
  const pool = ctx.createRadialGradient(w * 0.64, H, 0, w * 0.64, H, w * 0.45);
  pool.addColorStop(0, 'rgba(111,182,255,0.16)');
  pool.addColorStop(1, 'rgba(111,182,255,0)');
  ctx.fillStyle = pool;
  ctx.fillRect(0, H, w, h - H);

  // Receding grid.
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, H, w, h - H);
  ctx.clip();
  const vx = w * 0.5;
  ctx.lineWidth = 1;
  for (let i = -40; i <= 40; i++) {
    const g = ctx.createLinearGradient(0, H, 0, h);
    g.addColorStop(0, 'rgba(111,182,255,0)');
    g.addColorStop(1, 'rgba(111,182,255,0.16)');
    ctx.strokeStyle = g;
    ctx.beginPath();
    ctx.moveTo(vx + i * 6, H);
    ctx.lineTo(vx + i * w * 0.09, h);
    ctx.stroke();
  }
  for (let k = 1; k < 26; k++) {
    const y = H + (h - H) * Math.pow(k / 25, 2.2);
    ctx.strokeStyle = `rgba(111,182,255,${0.02 + 0.12 * (k / 25)})`;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.restore();

  // Server skyline on the horizon: lower in the middle so the globe has room.
  let x = -10;
  while (x < w + 10) {
    const bw = 14 + rand() * 46;
    const edge = Math.abs(x / w - 0.5) * 2;
    const bh = (4 + rand() * 22) * (0.55 + edge * 1.4) * Math.max(0.6, h / 900);
    ctx.fillStyle = '#0a111b';
    ctx.fillRect(x, H - bh, bw - 1, bh + 2);
    ctx.fillStyle = 'rgba(150,190,240,0.22)';
    ctx.fillRect(x, H - bh, bw - 1, 1);
    for (let r = H - bh + 4; r < H - 2; r += 5) {
      for (let c = x + 3; c < x + bw - 4; c += 6) {
        if (rand() < 0.86) continue;
        ctx.globalAlpha = 0.35 + rand() * 0.6;
        ctx.fillStyle = rand() < 0.75 ? '#7fbcff' : '#ffb06a';
        ctx.fillRect(c, r, 1.6, 1.2);
      }
    }
    ctx.globalAlpha = 1;
    if (rand() < 0.08) {
      ctx.fillStyle = 'rgba(150,190,240,0.35)';
      ctx.fillRect(x + bw / 2, H - bh - 14, 1, 14);
      ctx.fillStyle = '#ff7a4a';
      ctx.fillRect(x + bw / 2 - 1, H - bh - 16, 3, 2);
    }
    x += bw;
  }

  // Haze along the horizon.
  const haze = ctx.createLinearGradient(0, H - 40, 0, H + 30);
  haze.addColorStop(0, 'rgba(111,182,255,0)');
  haze.addColorStop(0.6, 'rgba(111,182,255,0.07)');
  haze.addColorStop(1, 'rgba(111,182,255,0)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, H - 40, w, 70);
}

/** The foreground silhouette: high at the edges, low in the middle. */
export function groundPath() {
  const rand = seeded(13);
  let d = 'M0 300 L0 30';
  for (let x = 0; x <= 1600; x += 20) {
    const u = x / 1600 - 0.5;
    const base = 30 + (1 - Math.pow(Math.abs(u) * 2, 1.6)) * 175;
    const y = base + (rand() - 0.5) * 14 + Math.sin(x * 0.021) * 6;
    d += ` L${x} ${y.toFixed(1)}`;
  }
  return d + ' L1600 300 Z';
}
