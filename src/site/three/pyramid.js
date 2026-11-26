import * as T from 'three';
import { seeded } from '../lib/math.js';

/**
 * The stack as a stepped pyramid. Each tier is a square frustum that drops in
 * from above and lands on the one below as you scroll; the active tier glows
 * and runs scan lines up its faces, the apex burns orange. Data motes spiral
 * upward around it, and a ring of orbit lines grounds it.
 */

const BASE = 2.1; // half-width of the base
const HEIGHT = 3.3;
const GAP = 0.07;
const DROP = 3.2; // how far above its seat a tier starts

const easeOutBack = (t) => {
  const c = 1.4;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
};

export function createPyramid(canvas, count) {
  const renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setClearColor(0x000000, 0);
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(34, 1, 0.1, 60);
  const target = new T.Vector3(0, 1.35, 0);

  const world = new T.Group();
  scene.add(world);
  const spin = new T.Group();
  world.add(spin);

  const h = HEIGHT / count;
  const halfAt = (y) => BASE * (1 - y / HEIGHT);
  const COLD = new T.Color('#6fb6ff');
  const CREAM = new T.Color('#f2e6c9');
  const ORANGE = new T.Color('#ffa860');

  const tiers = Array.from({ length: count }, (_, i) => {
    const y0 = i * h;
    const y1 = (i + 1) * h - GAP;
    const apex = i === count - 1;
    const rTop = apex ? 0 : halfAt(y1) * Math.SQRT2;
    const rBot = halfAt(y0) * Math.SQRT2;
    const geo = new T.CylinderGeometry(rTop, rBot, y1 - y0, 4, 1, false, Math.PI / 4);
    geo.translate(0, y0 + (y1 - y0) / 2, 0);

    const color = apex ? ORANGE : COLD;
    const uniforms = {
      uHot: { value: 0 },
      uShow: { value: 0 },
      uTime: { value: 0 },
      uColor: { value: color.clone() },
      uBase: { value: y0 },
      uSpan: { value: y1 - y0 },
    };
    const faces = new T.Mesh(
      geo,
      new T.ShaderMaterial({
        uniforms,
        transparent: true,
        depthWrite: false,
        side: T.DoubleSide,
        vertexShader: /* glsl */ `
          uniform float uBase;
          varying vec3 vN; varying vec3 vW; varying float vY;
          void main() {
            vN = normalize(mat3(modelMatrix) * normal);
            vec4 w = modelMatrix * vec4(position, 1.0);
            vW = w.xyz;
            vY = position.y - uBase;
            gl_Position = projectionMatrix * viewMatrix * w;
          }`,
        fragmentShader: /* glsl */ `
          uniform float uHot; uniform float uShow; uniform float uTime;
          uniform vec3 uColor; uniform float uSpan;
          varying vec3 vN; varying vec3 vW; varying float vY;
          void main() {
            vec3 n = normalize(vN) * (gl_FrontFacing ? 1.0 : -1.0);
            vec3 L = normalize(vec3(-0.6, 0.8, 0.7));
            float lit = 0.35 + 0.65 * max(dot(n, L), 0.0);
            vec3 V = normalize(cameraPosition - vW);
            float rim = pow(1.0 - abs(dot(n, V)), 2.0);
            // Scan lines climbing the active tier.
            float scan = smoothstep(0.92, 1.0, fract(vY / uSpan * 3.0 - uTime * 0.9)) * uHot;
            float top = smoothstep(0.85, 1.0, vY / uSpan) * uHot * 0.6;
            vec3 base = mix(vec3(0.03, 0.05, 0.1), uColor * 0.45, uHot * 0.7);
            vec3 c = base * lit + uColor * (rim * (0.12 + uHot * 0.6) + scan * 0.9 + top * 0.5);
            float a = (0.7 + uHot * 0.2 + scan * 0.1) * uShow;
            gl_FragColor = vec4(c, a);
            #include <colorspace_fragment>
          }`,
      }),
    );

    const edgeMat = new T.LineBasicMaterial({ color: CREAM.clone(), transparent: true, opacity: 0 });
    const edges = new T.LineSegments(new T.EdgesGeometry(geo), edgeMat);

    const g = new T.Group();
    g.add(faces, edges);
    g.renderOrder = i;
    spin.add(g);
    return { g, uniforms, edgeMat, color, apex, hot: 0, y0 };
  });

  // Ground: orbit rings and a faint grid disc.
  const rings = new T.Group();
  for (let k = 0; k < 4; k++) {
    const r = BASE * 1.25 + k * 0.42;
    const pts = [];
    for (let a = 0; a <= 128; a++) {
      const t = (a / 128) * Math.PI * 2;
      pts.push(new T.Vector3(Math.cos(t) * r, 0, Math.sin(t) * r));
    }
    const line = new T.Line(
      new T.BufferGeometry().setFromPoints(pts),
      new T.LineDashedMaterial({
        color: 0x6fb6ff,
        transparent: true,
        opacity: 0.28 - k * 0.05,
        dashSize: 0.08 + k * 0.05,
        gapSize: 0.1 + k * 0.06,
      }),
    );
    line.computeLineDistances();
    rings.add(line);
  }
  rings.position.y = -0.02;
  world.add(rings);

  // Data motes spiralling upward around the pyramid.
  const MOTES = 520;
  const rand = seeded(23);
  const mData = new Float32Array(MOTES * 3);
  for (let i = 0; i < MOTES; i++) {
    mData[i * 3] = rand(); // phase along the climb
    mData[i * 3 + 1] = rand() * Math.PI * 2; // start angle
    mData[i * 3 + 2] = 0.25 + rand() * 1.1; // radial offset
  }
  const moteGeo = new T.BufferGeometry();
  moteGeo.setAttribute('position', new T.BufferAttribute(new Float32Array(MOTES * 3), 3));
  moteGeo.setAttribute('aData', new T.BufferAttribute(mData, 3));
  const moteUniforms = {
    uTime: { value: 0 },
    uDpr: { value: 1 },
    uLevel: { value: 0 },
    uBase: { value: BASE },
    uHeight: { value: HEIGHT },
  };
  const motes = new T.Points(
    moteGeo,
    new T.ShaderMaterial({
      uniforms: moteUniforms,
      transparent: true,
      depthWrite: false,
      blending: T.AdditiveBlending,
      vertexShader: /* glsl */ `
        uniform float uTime; uniform float uDpr; uniform float uLevel;
        uniform float uBase; uniform float uHeight;
        attribute vec3 aData; varying float vA; varying float vY;
        void main() {
          float t = fract(aData.x + uTime * 0.05);
          float y = t * uHeight * 1.25;
          float r = uBase * max(0.08, 1.0 - y / uHeight) + aData.z;
          float a = aData.y + t * 6.2832 * 1.5 + uTime * 0.15;
          vec3 p = vec3(cos(a) * r, y, sin(a) * r);
          // Only motes below the built height of the pyramid are lit.
          vA = smoothstep(0.0, 0.1, t) * (1.0 - smoothstep(0.8, 1.0, t))
             * (0.25 + 0.75 * step(y, uLevel + 0.3));
          vY = y / uHeight;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = 3.2 * uDpr * (9.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        varying float vA; varying float vY;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d) * vA;
          vec3 c = mix(vec3(0.45, 0.72, 1.0), vec3(1.0, 0.7, 0.42), smoothstep(0.7, 1.1, vY));
          gl_FragColor = vec4(c * a, a);
        }`,
    }),
  );
  world.add(motes);

  // A beacon above the apex.
  const beaconUniforms = { uOn: { value: 0 }, uTime: { value: 0 }, uDpr: { value: 1 } };
  const beaconGeo = new T.BufferGeometry();
  beaconGeo.setAttribute('position', new T.Float32BufferAttribute([0, HEIGHT + 0.12, 0], 3));
  const beacon = new T.Points(
    beaconGeo,
    new T.ShaderMaterial({
      uniforms: beaconUniforms,
      transparent: true,
      depthWrite: false,
      blending: T.AdditiveBlending,
      vertexShader: /* glsl */ `
        uniform float uOn; uniform float uTime; uniform float uDpr;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = uOn * (70.0 + sin(uTime * 2.5) * 12.0) * uDpr * (9.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform float uOn;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = pow(smoothstep(0.5, 0.0, d), 2.5) * uOn;
          gl_FragColor = vec4(vec3(1.0, 0.66, 0.38) * a, a);
        }`,
    }),
  );
  world.add(beacon);

  function resize() {
    const w = canvas.clientWidth;
    const hh = canvas.clientHeight;
    if (!w || !hh) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, hh, false);
    moteUniforms.uDpr.value = dpr;
    beaconUniforms.uDpr.value = dpr;
    camera.aspect = w / hh;
    // Pull back on narrow canvases so the base always fits.
    const dist = camera.aspect < 1.1 ? 11.5 / Math.max(0.6, camera.aspect / 1.1) ** 0.7 : 11.5;
    camera.position.set(0, target.y + dist * 0.2, dist);
    camera.lookAt(target);
    camera.updateProjectionMatrix();
  }
  resize();

  /**
   * `u` runs 0 → count: tier i lands while u goes i → i + 1, and the tier
   * under u is the active one. `animate` false holds a still pose.
   */
  function render(timeMs, u, active, animate = true) {
    const t = animate ? timeMs / 1000 : 0;
    let level = 0;
    tiers.forEach((tier, i) => {
      const k = Math.min(1, Math.max(0, (u - i) * 1.6));
      const land = k <= 0 ? 0 : easeOutBack(k);
      tier.g.position.y = (1 - land) * DROP;
      tier.uniforms.uShow.value = Math.min(1, k * 2.5);
      const goal = i === active && k > 0 ? 1 : 0.12;
      tier.hot += (goal - tier.hot) * (animate ? 0.08 : 1);
      tier.uniforms.uHot.value = tier.hot;
      tier.uniforms.uTime.value = t;
      tier.edgeMat.opacity = Math.min(1, k * 2.5) * (0.25 + tier.hot * 0.75);
      tier.edgeMat.color.copy(tier.apex ? ORANGE : CREAM);
      if (k >= 1) level = (i + 1) * h;
    });
    moteUniforms.uTime.value = t;
    moteUniforms.uLevel.value = level;
    beaconUniforms.uTime.value = t;
    beaconUniforms.uOn.value = Math.min(1, Math.max(0, (u - (count - 1)) * 1.6));
    spin.rotation.y = 0.5 + t * 0.12 + u * 0.35;
    rings.rotation.y = -t * 0.05;
    renderer.render(scene, camera);
  }

  return {
    resize,
    render,
    dispose() {
      scene.traverse((o) => {
        o.geometry?.dispose();
        o.material?.dispose();
      });
      renderer.dispose();
    },
  };
}
