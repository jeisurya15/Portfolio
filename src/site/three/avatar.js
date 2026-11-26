import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createTechie } from '../../techie-human.js';
import { seeded } from '../lib/math.js';

/**
 * The developer, seen from behind, standing on top of a literal full stack:
 * a heap of rack servers whose status lights blink in the dark. Rim-lit from
 * the globe's side so the figure reads as a silhouette, like the astronaut
 * on his ridge.
 */

export function createAvatarScene(canvas) {
  const renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.outputColorSpace = T.SRGBColorSpace;

  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(24, 1, 0.5, 120);

  scene.add(new T.HemisphereLight(0x8fb4ff, 0x0a0f18, 1.1));
  const rim = new T.DirectionalLight(0xbcd8ff, 4.2);
  rim.position.set(7, 7, -9);
  scene.add(rim);
  const warm = new T.DirectionalLight(0xffb27a, 1.4);
  warm.position.set(-8, 4, -6);
  scene.add(warm);
  const fill = new T.DirectionalLight(0x9fbcff, 1.1);
  fill.position.set(0, 3, 10);
  scene.add(fill);

  // The stack: tiers of server chassis, narrower as they climb.
  const rand = seeded(5);
  const body = new T.MeshStandardMaterial({ color: 0x1c2636, roughness: 0.5, metalness: 0.15 });
  const face = new T.MeshStandardMaterial({ color: 0x0b1019, roughness: 0.75, metalness: 0.1 });
  const glow = (hex, k) =>
    new T.MeshBasicMaterial({ color: new T.Color(hex).multiplyScalar(k), toneMapped: false });
  const ledColors = [
    glow(0x6fb6ff, 2.2),
    glow(0x6fe3ff, 1.8),
    glow(0xffa860, 2),
    glow(0x7dffb0, 1.6),
  ];
  const leds = [];
  const stack = new T.Group();
  scene.add(stack);

  const TIERS = 7;
  const UNIT = 0.42;
  let top = 0;
  for (let k = 0; k < TIERS; k++) {
    const width = 9.5 - k * 1.25 + rand() * 0.4;
    const y = -TIERS * UNIT + k * UNIT + UNIT / 2;
    let x = -width / 2;
    while (x < width / 2 - 0.3) {
      const w = Math.min(0.9 + rand() * 1.6, width / 2 - x);
      const h = UNIT * (0.86 + rand() * 0.1);
      const d = 2.4 - k * 0.18;
      const cx = x + w / 2;
      const box = new T.Mesh(new RoundedBoxGeometry(w - 0.04, h, d, 2, 0.03), body);
      box.position.set(cx, y + (rand() - 0.5) * 0.03, (rand() - 0.5) * 0.25);
      box.rotation.y = (rand() - 0.5) * 0.05;
      stack.add(box);
      const panel = new T.Mesh(new T.BoxGeometry(w - 0.16, h * 0.62, 0.01), face);
      panel.position.set(0, 0, d / 2 + 0.006);
      box.add(panel);
      // A row of status lights on each front panel.
      const n = Math.max(1, Math.floor(w / 0.32));
      for (let j = 0; j < n; j++) {
        if (rand() < 0.35) continue;
        const led = new T.Mesh(
          new T.BoxGeometry(0.07, 0.025, 0.01),
          ledColors[rand() < 0.7 ? Math.floor(rand() * 2) : 2 + Math.floor(rand() * 2)],
        );
        led.position.set(-w / 2 + 0.18 + j * 0.3, h * 0.12, d / 2 + 0.013);
        box.add(led);
        leds.push({ mesh: led, rate: 0.4 + rand() * 2.4, phase: rand() * 6.28 });
      }
      x += w;
    }
    top = y + UNIT / 2;
  }

  const techie = createTechie(scene);
  techie.root.position.set(0.2, top, 0);
  techie.root.rotation.y = -0.22;

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Keep the figure about a sixth of the screen tall, a little larger on phones.
    const dist = w / h < 0.8 ? 24 : 31;
    const view = 2 * dist * Math.tan(T.MathUtils.degToRad(camera.fov / 2));
    camera.position.set(0, top + view * 0.2, dist);
    camera.lookAt(0, top + view * 0.2, 0);
    camera.updateProjectionMatrix();
  }
  resize();

  let last = 0;
  return {
    resize,
    render(time, animate = true) {
      const dt = last ? Math.min(0.05, (time - last) / 1000) : 1 / 60;
      last = time;
      const s = time / 1000;
      if (animate) {
        techie.update(dt, 0, s, false, -0.5 + Math.sin(s * 0.3) * 0.12);
        for (const l of leds) l.mesh.visible = Math.sin(s * l.rate + l.phase) > -0.55;
      }
      renderer.render(scene, camera);
    },
    dispose() {
      renderer.dispose();
      scene.traverse((o) => {
        o.geometry?.dispose();
      });
    },
  };
}
