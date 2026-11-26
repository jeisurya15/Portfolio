import * as T from 'three';
import { seeded } from '../lib/math.js';

/**
 * The finale: a spiral galaxy of particles that, as you scroll, unwinds and
 * assembles into a line of text. Every particle has its own delay, so the
 * words condense out of the galaxy rather than snapping into place. The
 * pointer pushes particles aside; once the words are formed they breathe.
 */

const COUNT = 14000;
const FONT = '400 200px Michroma, "Arial Black", sans-serif';

/** Filled pixels of `lines` drawn on a canvas, as points in -0.5..0.5 width units. */
function sampleText(lines) {
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.font = FONT;
  const lineH = 250;
  const w = Math.ceil(Math.max(...lines.map((l) => ctx.measureText(l).width))) + 40;
  const h = lineH * lines.length + 40;
  c.width = w;
  c.height = h;
  ctx.font = FONT;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  lines.forEach((l, i) => ctx.fillText(l, w / 2, 20 + lineH * (i + 0.5)));
  const data = ctx.getImageData(0, 0, w, h).data;
  const pts = [];
  const step = 3;
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      if (data[(y * w + x) * 4 + 3] > 128) pts.push((x - w / 2) / w, -(y - h / 2) / w);
    }
  }
  return { pts, aspect: h / w };
}

export function createFinale(canvas) {
  const renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: false });
  renderer.setClearColor(0x000000, 0);
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(40, 1, 0.1, 80);
  camera.position.set(0, 0, 9);

  const rand = seeded(91);
  const galaxy = new Float32Array(COUNT * 4); // radius, angle, height, delay
  for (let i = 0; i < COUNT; i++) {
    const arm = i % 3;
    const r = Math.pow(rand(), 0.85) * 6.2 + 0.05;
    const spread = (rand() - 0.5) * (0.5 + r * 0.12);
    galaxy[i * 4] = r;
    galaxy[i * 4 + 1] = (arm / 3) * Math.PI * 2 + r * 0.75 + spread;
    galaxy[i * 4 + 2] = (rand() - 0.5) * (0.5 - r * 0.05) * 0.8;
    galaxy[i * 4 + 3] = rand();
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.BufferAttribute(new Float32Array(COUNT * 3), 3));
  geo.setAttribute('aGalaxy', new T.BufferAttribute(galaxy, 4));
  const targets = new Float32Array(COUNT * 2);
  const targetAttr = new T.BufferAttribute(targets, 2);
  geo.setAttribute('aTarget', targetAttr);

  const uniforms = {
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uScale: { value: 8 },
    uMouse: { value: new T.Vector2(99, 99) },
    uPush: { value: 0 },
    uDpr: { value: 1 },
  };

  const points = new T.Points(
    geo,
    new T.ShaderMaterial({
      uniforms,
      transparent: true,
      depthWrite: false,
      blending: T.AdditiveBlending,
      vertexShader: /* glsl */ `
        uniform float uTime; uniform float uProgress; uniform float uScale;
        uniform vec2 uMouse; uniform float uPush; uniform float uDpr;
        attribute vec4 aGalaxy; attribute vec2 aTarget;
        varying float vT; varying float vR; varying float vTw;

        void main() {
          float r = aGalaxy.x;
          // Inner stars orbit faster, like a real disc.
          float a = aGalaxy.y + uTime * 0.6 / (r + 1.2);
          vec3 g = vec3(cos(a) * r, aGalaxy.z, sin(a) * r) * 0.85;
          // Tilt the disc toward the viewer.
          float tilt = -1.05;
          g = vec3(g.x, g.y * cos(tilt) - g.z * sin(tilt), g.y * sin(tilt) + g.z * cos(tilt));

          vec3 txt = vec3(aTarget * uScale, 0.0);
          float t = clamp(uProgress * 1.6 - aGalaxy.w * 0.6, 0.0, 1.0);
          t = t * t * (3.0 - 2.0 * t);

          vec3 p = mix(g, txt, t);
          // Swirl outward mid-flight.
          float mid = sin(t * 3.14159);
          p += vec3(sin(aGalaxy.y * 3.0 + uTime), cos(aGalaxy.y * 2.0 - uTime), sin(r * 4.0)) * mid * 0.9;
          // Formed words breathe a little.
          p += vec3(0.0, 0.0, sin(uTime * 1.7 + aTarget.x * 12.0) * 0.06) * t;

          // Pointer pushes particles away.
          vec2 d = p.xy - uMouse;
          float f = exp(-dot(d, d) * 1.6) * uPush;
          p.xy += normalize(d + 1e-4) * f * 0.85;
          p.z += f * 1.2;

          vT = t;
          vR = r;
          vTw = 0.6 + 0.4 * sin(uTime * 3.0 + aGalaxy.w * 40.0);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          float size = mix(3.0 + 3.0 * smoothstep(1.5, 0.0, r), 3.2, t) + f * 3.0;
          gl_PointSize = size * uDpr * (9.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        varying float vT; varying float vR; varying float vTw;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = pow(smoothstep(0.5, 0.0, d), 1.5);
          vec3 core = vec3(1.0, 0.72, 0.45);
          vec3 arm = mix(vec3(0.62, 0.8, 1.0), vec3(0.3, 0.5, 0.95), smoothstep(1.0, 5.5, vR));
          vec3 gal = mix(core, arm, smoothstep(0.2, 1.6, vR));
          vec3 txt = vec3(0.86, 0.93, 1.0);
          vec3 c = mix(gal, txt, vT);
          a *= mix(0.95, 1.0, vT) * vTw;
          gl_FragColor = vec4(c * a, a);
        }`,
    }),
  );
  points.frustumCulled = false;
  scene.add(points);

  let mode = '';
  let textAspect = 0.2;
  function setText(lines) {
    const key = lines.join('|');
    if (key === mode) return;
    mode = key;
    const { pts, aspect } = sampleText(lines);
    textAspect = aspect;
    const n = pts.length / 2;
    const r = seeded(5);
    for (let i = 0; i < COUNT; i++) {
      const k = Math.floor(r() * n);
      targets[i * 2] = pts[k * 2] + (r() - 0.5) * 0.002;
      targets[i * 2 + 1] = pts[k * 2 + 1] + (r() - 0.5) * 0.002;
    }
    targetAttr.needsUpdate = true;
  }

  // Visible width and height of the z = 0 plane.
  const view = () => {
    const vh = 2 * camera.position.z * Math.tan(T.MathUtils.degToRad(camera.fov / 2));
    return { vw: vh * camera.aspect, vh };
  };

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    uniforms.uDpr.value = dpr;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    setText(camera.aspect < 1.1 ? ['LET’S', 'TALK'] : ['LET’S TALK']);
    const { vw, vh } = view();
    // Fit the words: 86% of the width, or 55% of the height.
    uniforms.uScale.value = Math.min(vw * 0.86, (vh * 0.55) / textAspect);
  }

  const mouse = new T.Vector2(99, 99);
  let pushGoal = 0;
  const onMove = (e) => {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = 0.5 - (e.clientY - r.top) / r.height;
    const { vw, vh } = view();
    mouse.set(x * vw, y * vh);
    pushGoal = 1;
  };
  const onLeave = () => {
    pushGoal = 0;
  };
  canvas.addEventListener('pointermove', onMove, { passive: true });
  canvas.addEventListener('pointerleave', onLeave);

  /** `progress` 0 = galaxy, 1 = words. `animate` false holds the formed words. */
  function render(timeMs, progress, animate = true) {
    uniforms.uTime.value = animate ? timeMs / 1000 : 0;
    uniforms.uProgress.value = animate ? progress : 1;
    uniforms.uMouse.value.lerp(mouse, 0.15);
    uniforms.uPush.value += ((animate ? pushGoal : 0) - uniforms.uPush.value) * 0.08;
    renderer.render(scene, camera);
  }

  resize();

  return {
    resize,
    render,
    dispose() {
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      geo.dispose();
      points.material.dispose();
      renderer.dispose();
    },
  };
}
