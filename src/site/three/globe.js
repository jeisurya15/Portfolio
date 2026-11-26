import * as T from 'three';
import { seeded } from '../lib/math.js';

/**
 * The network globe that rises in place of the Earth: a dotted planet whose
 * "continents" are dense clusters of nodes, a dark core so the far side
 * never shows through, an atmosphere rim, and data arcs with pulses running
 * between cities. Lit from the upper left, like the hero's key light.
 */

const DOTS = 7000;
const ARCS = 16;

// Cheap continent mask: overlapping sine blobs on the unit sphere.
function land(v) {
  const a = Math.sin(v.x * 3.1 + 1.2) * Math.cos(v.y * 2.3 - 0.4);
  const b = Math.sin(v.z * 2.7 - v.x * 1.3 + 2.1);
  const c = Math.cos(v.y * 4.1 + v.z * 1.7);
  return a * 0.55 + b * 0.35 + c * 0.25 > 0.02;
}

export function createGlobe(canvas) {
  const renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setClearColor(0x000000, 0);
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0, 4.7);

  const globe = new T.Group();
  globe.rotation.set(0.32, -0.6, 0.12);
  scene.add(globe);

  const light = new T.Vector3(-0.7, 0.55, 0.6).normalize();

  // Dark core.
  globe.add(
    new T.Mesh(
      new T.SphereGeometry(0.985, 64, 48),
      new T.ShaderMaterial({
        uniforms: { uLight: { value: light } },
        vertexShader: /* glsl */ `
          varying vec3 vN; varying vec3 vV;
          void main() {
            vN = normalize(mat3(modelMatrix) * normal);
            vec4 w = modelMatrix * vec4(position, 1.0);
            vV = normalize(cameraPosition - w.xyz);
            gl_Position = projectionMatrix * viewMatrix * w;
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uLight; varying vec3 vN; varying vec3 vV;
          void main() {
            float l = max(dot(vN, uLight), 0.0);
            float rim = pow(1.0 - max(dot(vN, vV), 0.0), 3.0);
            vec3 c = vec3(0.02, 0.035, 0.07) + vec3(0.05, 0.12, 0.24) * l + vec3(0.2, 0.45, 0.9) * rim * 0.25;
            gl_FragColor = vec4(c, 1.0);
          }`,
      }),
    ),
  );

  // Dots on a Fibonacci sphere.
  const pos = new Float32Array(DOTS * 3);
  const isLand = new Float32Array(DOTS);
  const landPoints = [];
  const v = new T.Vector3();
  for (let i = 0; i < DOTS; i++) {
    const y = 1 - (i / (DOTS - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = i * Math.PI * (3 - Math.sqrt(5));
    v.set(Math.cos(th) * r, y, Math.sin(th) * r);
    pos.set([v.x, v.y, v.z], i * 3);
    isLand[i] = land(v) ? 1 : 0;
    if (isLand[i]) landPoints.push(v.clone());
  }
  const dotGeo = new T.BufferGeometry();
  dotGeo.setAttribute('position', new T.BufferAttribute(pos, 3));
  dotGeo.setAttribute('land', new T.BufferAttribute(isLand, 1));
  const dotMat = new T.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uLight: { value: light }, uScale: { value: 1 } },
    vertexShader: /* glsl */ `
      attribute float land; uniform vec3 uLight; uniform float uScale;
      varying float vL; varying float vLand; varying float vFace;
      void main() {
        vec3 n = normalize(mat3(modelMatrix) * position);
        vec4 w = modelMatrix * vec4(position * 1.002, 1.0);
        vL = max(dot(n, uLight), 0.0);
        vFace = dot(n, normalize(cameraPosition - w.xyz));
        vLand = land;
        vec4 mv = viewMatrix * w;
        gl_PointSize = (land > 0.5 ? 2.2 : 1.1) * uScale / -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      varying float vL; varying float vLand; varying float vFace;
      void main() {
        if (vFace < 0.0) discard;
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        vec3 sea = vec3(0.25, 0.45, 0.8);
        vec3 ground = mix(vec3(0.45, 0.7, 1.0), vec3(0.95, 0.97, 1.0), vL);
        vec3 c = mix(sea, ground, vLand) * (0.5 + 0.9 * vL);
        float a = (vLand > 0.5 ? 1.0 : 0.32) * smoothstep(0.0, 0.25, vFace);
        gl_FragColor = vec4(c, a * (1.0 - smoothstep(0.35, 0.5, d)));
      }`,
  });
  globe.add(new T.Points(dotGeo, dotMat));

  // Arcs between land points, each with a pulse travelling along it.
  const rand = seeded(19);
  const arcMat = new T.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: T.AdditiveBlending,
    uniforms: { uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      attribute float t; attribute float seed;
      varying float vT; varying float vSeed; varying float vFace;
      void main() {
        vT = t; vSeed = seed;
        vec4 w = modelMatrix * vec4(position, 1.0);
        vFace = dot(normalize(w.xyz), normalize(cameraPosition - w.xyz));
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime; varying float vT; varying float vSeed; varying float vFace;
      void main() {
        float head = fract(uTime * 0.16 + vSeed);
        float pulse = smoothstep(0.18, 0.0, head - vT) * step(vT, head);
        float a = (0.1 + pulse * 0.9) * smoothstep(-0.15, 0.2, vFace);
        gl_FragColor = vec4(mix(vec3(0.43, 0.71, 1.0), vec3(1.0, 0.75, 0.45), pulse * 0.6), a);
      }`,
  });
  for (let i = 0; i < ARCS; i++) {
    const a = landPoints[Math.floor(rand() * landPoints.length)];
    const b = landPoints[Math.floor(rand() * landPoints.length)];
    const span = a.distanceTo(b);
    if (span < 0.35) continue;
    const mid = a
      .clone()
      .add(b)
      .normalize()
      .multiplyScalar(1 + span * 0.32);
    const curve = new T.QuadraticBezierCurve3(a, mid, b);
    const pts = curve.getPoints(80);
    const g = new T.BufferGeometry().setFromPoints(pts);
    g.setAttribute(
      't',
      new T.BufferAttribute(
        Float32Array.from(pts, (_, k) => k / 80),
        1,
      ),
    );
    g.setAttribute('seed', new T.BufferAttribute(new Float32Array(pts.length).fill(rand()), 1));
    globe.add(new T.Line(g, arcMat));
  }

  // Atmosphere.
  scene.add(
    new T.Mesh(
      new T.SphereGeometry(1.07, 64, 48),
      new T.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: T.BackSide,
        blending: T.AdditiveBlending,
        vertexShader: /* glsl */ `
          varying vec3 vN;
          void main() { vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */ `
          varying vec3 vN;
          void main() {
            float i = pow(max(0.66 - dot(vN, vec3(0.0, 0.0, 1.0)), 0.0), 3.0);
            gl_FragColor = vec4(vec3(0.35, 0.62, 1.0) * i * 1.6, 1.0);
          }`,
      }),
    ),
  );

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    dotMat.uniforms.uScale.value = h * dpr * 0.0125;
  }
  resize();

  return {
    resize,
    render(time, spin = true) {
      if (spin) globe.rotation.y = -0.6 + time * 0.00004;
      arcMat.uniforms.uTime.value = time / 1000;
      renderer.render(scene, camera);
    },
    dispose() {
      renderer.dispose();
      scene.traverse((o) => {
        o.geometry?.dispose();
        o.material?.dispose();
      });
    },
  };
}
