import * as T from 'three';
import { horizonAt } from '../lib/art.js';

/**
 * The plain as a dark liquid mirror. One full-screen shader, drawn over the
 * painted grid:
 *
 *   - the globe's lit rim reflects in it, broken into drifting bands the way
 *     light breaks on water, and follows the globe as it rises;
 *   - the server stack under the developer has a heartbeat: every few
 *     seconds a ripple leaves its base and runs out across the plain, and
 *     the grid lines light up as the crest passes over them;
 *   - the pointer stirs the surface; a click drops a stone.
 *
 * Everything is light, no text. The floor maps to world space with the same
 * perspective the painted grid uses, so rings stay round on the ground.
 */

const MAX = 8;
const HEARTBEAT = 3.2; // seconds between pulses from the stack
const DEPTH = 5.0; // stretches depth so rings read as circles on the ground

export function createMirror(canvas) {
  const renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: false, premultipliedAlpha: true });
  renderer.setClearColor(0x000000, 0);
  const scene = new T.Scene();
  const camera = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const ripples = Array.from({ length: MAX }, () => new T.Vector4(0, 0, -100, 0));
  const uniforms = {
    uRes: { value: new T.Vector2(1, 1) },
    uDpr: { value: 1 },
    uH: { value: 0 },
    uTime: { value: 0 },
    uGlobe: { value: new T.Vector3(0, -9999, 1) },
    uRipples: { value: ripples },
    uLive: { value: 1 },
  };

  const quad = new T.Mesh(
    new T.PlaneGeometry(2, 2),
    new T.ShaderMaterial({
      uniforms,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      vertexShader: /* glsl */ `
        void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform vec2 uRes; uniform float uDpr; uniform float uH; uniform float uTime;
        uniform vec3 uGlobe; uniform vec4 uRipples[${MAX}]; uniform float uLive;

        // Screen pixel (CSS px, y down) → ground: x across in grid cells, z depth (1 at the bottom).
        vec2 ground(vec2 px) {
          float dy = max(px.y - uH, 0.5);
          float z = (uRes.y - uH) / dy;
          float x = (px.x - uRes.x * 0.5) / (uRes.x * 0.09) * z;
          return vec2(x, z);
        }

        void main() {
          vec2 px = vec2(gl_FragCoord.x, uRes.y * uDpr - gl_FragCoord.y) / uDpr;
          float dy = px.y - uH;
          if (dy <= 0.0) { gl_FragColor = vec4(0.0); return; }

          vec2 g = ground(px);
          float t = uTime;

          // Ripples: a bright crest and a fainter echo behind it.
          float wave = 0.0;
          float disp = 0.0;
          for (int i = 0; i < ${MAX}; i++) {
            vec4 r = uRipples[i];
            float age = t - r.z;
            if (age < 0.0 || age > 7.0 || r.w <= 0.0) continue;
            float R = age * 2.6;
            float d = length(vec2(g.x - r.x, (g.y - r.y) * ${DEPTH.toFixed(1)}));
            float w = 0.22 + R * 0.05;
            float fade = exp(-age * 0.55) * r.w;
            float crest = exp(-pow((d - R) / w, 2.0));
            float echo = exp(-pow((d - R + 0.9) / (w * 1.4), 2.0)) * 0.45;
            wave += (crest + echo) * fade;
            disp += sin((d - R) * 9.0) * exp(-pow((d - R) / (w * 2.5), 2.0)) * fade;
          }

          // Grid lines, matching the painted ones: verticals at whole cells,
          // rows on the same eased spacing.
          float fx = abs(fract(g.x + 0.5) - 0.5);
          float lineX = 1.0 - smoothstep(0.0, fwidth(g.x) * 1.3, fx);
          float k = 25.0 * pow(dy / (uRes.y - uH), 1.0 / 2.2);
          float fk = abs(fract(k + 0.5) - 0.5);
          float lineZ = 1.0 - smoothstep(0.0, fwidth(k) * 1.3, fk);
          float grid = max(lineX, lineZ);

          vec3 cyan = vec3(0.42, 0.86, 1.0);
          vec3 col = cyan * wave * (0.22 + grid * 2.2);

          // The globe's reflection, bent by the ripples and broken into bands.
          vec2 q = px;
          q.x += sin(px.y * 0.21 - t * 1.6) * (1.2 + abs(disp) * 6.0) + disp * 10.0;
          vec2 c = vec2(uGlobe.x, 2.0 * uH - uGlobe.y);
          float rr = length(vec2(q.x - c.x, (q.y - c.y) * 0.62)) / uGlobe.z;
          float rim = exp(-pow((rr - 1.0) * 9.0, 2.0));
          float body = smoothstep(1.02, 0.6, rr) * 0.10;
          float bands = 0.55 + 0.45 * sin(dy * 0.38 - t * 2.4 + sin(px.x * 0.013 + t * 0.5) * 2.0);
          float depthFade = exp(-dy / (uGlobe.z * 1.9));
          vec3 blue = vec3(0.43, 0.71, 1.0);
          col += blue * (rim * 1.1 + body) * bands * depthFade;

          // A thin shimmer where the water meets the horizon.
          col += blue * exp(-dy * 0.35) * (0.10 + 0.06 * sin(px.x * 0.05 + t * 1.3));

          // Fade in from the horizon so the seam stays clean.
          col *= smoothstep(0.0, 6.0, dy);
          float a = clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0);
          gl_FragColor = vec4(col, a);
        }`,
    }),
  );
  scene.add(quad);

  let next = 0;
  const spawn = (x, z, strength, at) => {
    const r = ripples[next];
    r.set(x, z, at, strength);
    next = (next + 1) % MAX;
  };

  const toGround = (px, py) => {
    const { x: w, y: h } = uniforms.uRes.value;
    const H = uniforms.uH.value;
    const dy = py - H;
    if (dy < 8) return null;
    const z = (h - H) / dy;
    return [((px - w * 0.5) / (w * 0.09)) * z, z];
  };

  // Pointer stirs the water; a click drops a stone.
  let lastStir = 0;
  let clock = 0;
  const local = (e) => {
    const r = canvas.getBoundingClientRect();
    return toGround(e.clientX - r.left, e.clientY - r.top);
  };
  const onMove = (e) => {
    if (clock - lastStir < 0.22) return;
    const p = local(e);
    if (!p) return;
    lastStir = clock;
    spawn(p[0], p[1], 0.35, clock);
  };
  const onDown = (e) => {
    const p = local(e);
    if (p) spawn(p[0], p[1], 1.0, clock);
  };
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerdown', onDown, { passive: true });

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    uniforms.uRes.value.set(w, h);
    uniforms.uDpr.value = dpr;
    uniforms.uH.value = horizonAt(w, h);
  }
  resize();

  let lastBeat = -HEARTBEAT;
  /**
   * `globe` is the globe canvas's rect, `animate` false holds a still
   * reflection with no ripples.
   */
  function render(timeMs, globe, animate = true) {
    clock = timeMs / 1000;
    uniforms.uTime.value = animate ? clock : 0;
    if (animate && clock - lastBeat > HEARTBEAT) {
      lastBeat = clock;
      // From the foot of the stack, just in front of the bottom edge.
      spawn(0, 1.02, 1.0, clock);
    }
    if (!animate) for (const r of ripples) r.w = 0;
    if (globe) {
      const me = canvas.getBoundingClientRect();
      uniforms.uGlobe.value.set(
        globe.left + globe.width / 2 - me.left,
        globe.top + globe.height / 2 - me.top,
        (globe.width / 2) * 0.8,
      );
    }
    renderer.render(scene, camera);
  }

  return {
    resize,
    render,
    dispose() {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      quad.geometry.dispose();
      quad.material.dispose();
      renderer.dispose();
    },
  };
}
