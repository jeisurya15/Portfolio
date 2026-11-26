import * as T from 'three';
import { createRenderer } from './workshop-render.js';
import { createTechie } from './techie-human.js';
import { createWorkshop } from './workshop-world.js';
import { createAtmosphere } from './workshop-atmosphere.js';
import { createAudio } from './workshop-audio.js';
import { chapters, stack } from './workshop-content.js';
import { store, progress, actions, toast } from './store.js';
import './ui/main.jsx';

// The 3D engine: the hall, the walk, the camera and input. The interface lives in ./ui.
const clamp = T.MathUtils.clamp;
const LAST = chapters.length - 1;
const small = matchMedia('(max-width: 760px), (pointer: coarse)').matches;
const panelOpen = () => store.get().panel !== null;

// The 3D labels are drawn with the page fonts, so wait briefly for them before building.
await Promise.race([
  Promise.all(
    ['500 64px "Geist"', '400 64px "Geist Mono"', '600 64px "Geist"'].map((f) =>
      document.fonts.load(f),
    ),
  ),
  new Promise((r) => setTimeout(r, 2500)),
]).catch(() => {});
store.set({ load: 0.45 });

const scene = new T.Scene();
// A lifted blue-graphite haze instead of pure black keeps the hall readable and less heavy.
scene.background = new T.Color(0x121821);
scene.fog = new T.FogExp2(0x121821, 0.027);
const camera = new T.PerspectiveCamera(46, innerWidth / innerHeight, 0.08, 170);
let view;
try {
  view = createRenderer(document.querySelector('#stage'), scene, camera, { small });
} catch {
  store.set({ webgl: false });
  throw new Error('WebGL unavailable');
}
const { renderer } = view;

scene.add(new T.HemisphereLight(0xc4d6ec, 0x2b2119, 0.95));
const key = new T.DirectionalLight(0xe6eeff, 2.2);
key.castShadow = true;
key.shadow.mapSize.setScalar(small ? 1024 : 2048);
Object.assign(key.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 40 });
key.shadow.bias = -0.0003;
key.shadow.normalBias = 0.03;
scene.add(key, key.target);
const exhibitLight = new T.PointLight(0xffc093, 34, 12, 2);
const rim = new T.PointLight(0xa8c8ff, 18, 10, 2);
scene.add(exhibitLight, rim);

const world = createWorkshop(scene, {
  rooms: chapters,
  layers: stack.map((s) => s.group),
  reflections: view.quality.reflections,
});
const character = createTechie(scene);
const atmosphere = createAtmosphere(scene, world.groups);
const audio = createAudio();
view.onQuality((q) => world.setReflections(q.reflections));
store.set({ load: 0.8 });

const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let paused = reduced.matches,
  tour = false,
  target = 0,
  current = 0,
  active = -1,
  time = 0,
  speed = 0,
  dwell = 0,
  tourNext = 1,
  hidden = false,
  focused = false,
  focusAmount = 0,
  cameraSnap = true,
  jumpTimer = 0,
  keyboardDirection = 0,
  hoverDirty = false,
  hovering = false,
  still = 0,
  wasMoving = false;
const viewLook = new T.Vector3(),
  cameraGoal = new T.Vector3(),
  lookGoal = new T.Vector3(),
  pivot = new T.Vector3(),
  mouse = { x: 0, y: 0 },
  look = { yaw: 0, pitch: 0, dragging: false, moved: 0, x: 0, y: 0 };
// A hidden tab can report a zero-height window; never let the scroll maths divide by zero.
const segmentFor = () => Math.max(innerHeight, 320) * 1.45;
let segment = segmentFor();

// Rooms are addressable (#lms, #contact, …) so any exhibit can be shared as a link.
const slugIndex = (hash) => chapters.findIndex((c) => c.slug === hash.replace('#', ''));
const linked = slugIndex(location.hash);
target = linked >= 0 ? linked : clamp(scrollY / segment, 0, LAST);
current = target;
const previousPosition = new T.Vector3(0, 0, 6 - current * 24);

function setFocus(value) {
  focused = value;
  store.set({ focused: value });
}
function setPaused(value) {
  paused = value;
  store.set({ paused: value });
}
function stopTour() {
  tour = false;
  store.set({ tour: false });
}
function jump(n) {
  stopTour();
  setFocus(false);
  clearTimeout(jumpTimer);
  n = clamp(n, 0, LAST);
  if (!paused && Math.abs(n - current) > 0.65) {
    document.body.classList.add('camera-cut');
    jumpTimer = setTimeout(() => {
      current = target = n;
      cameraSnap = true;
      scrollTo({ top: n * segment, behavior: 'instant' });
      document.body.classList.remove('camera-cut');
    }, 380);
  } else scrollTo({ top: n * segment, behavior: paused ? 'instant' : 'smooth' });
}
function show(i) {
  const arriving = active !== -1;
  active = i;
  store.set({ active: i });
  history.replaceState(null, '', '#' + chapters[i].slug);
  if (arriving) audio.chime(i);
}

Object.assign(actions, {
  jump,
  act() {
    const message = world.act(chapters[active].slug, time);
    if (message) toast(message);
  },
  toggleFocus() {
    stopTour();
    setFocus(!focused);
  },
  toggleTour() {
    if (tour) return stopTour();
    setFocus(false);
    if (paused) setPaused(false);
    if (target > LAST - 0.05) {
      scrollTo({ top: 0, behavior: 'instant' });
      target = current = 0;
      cameraSnap = true;
    }
    tour = true;
    dwell = 0;
    tourNext = Math.min(LAST, Math.floor(target) + 1);
    store.set({ tour: true, panel: null });
  },
  toggleSound() {
    const on = audio.toggle();
    store.set({ sound: on });
    toast(on ? 'Sound on' : 'Sound off');
  },
  togglePause() {
    setPaused(!paused);
    if (paused) stopTour();
    toast(paused ? 'Ambient motion paused. Navigation still works.' : 'Ambient motion resumed.');
  },
  setCinema(value) {
    store.set({ cinema: value });
  },
  openPanel(panel) {
    if (panel) stopTour();
    store.set({ panel });
  },
});

addEventListener('scroll', () => (target = clamp(scrollY / segment, 0, LAST)), { passive: true });
addEventListener('hashchange', () => {
  const i = slugIndex(location.hash);
  if (i < 0 || i === active) return;
  store.set({ panel: null });
  jump(i);
});
function manualControl() {
  if (tour) stopTour();
  if (focused) setFocus(false);
}
addEventListener('wheel', manualControl, { passive: true });
addEventListener('touchstart', () => tour && stopTour(), { passive: true });
addEventListener('keydown', (e) => {
  const { panel, cinema } = store.get();
  if (e.key === 'Escape') {
    if (panel) return; // the interface closes its own panels
    if (cinema) actions.setCinema(false);
    else setFocus(false);
    return;
  }
  if (panel || e.target.closest?.('input,textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
  const walk = ['w', 'W', 's', 'S', 'ArrowUp', 'ArrowDown'].includes(e.key);
  if (walk && (!e.target.closest?.('button,a') || /^[ws]$/i.test(e.key))) {
    e.preventDefault();
    manualControl();
    keyboardDirection = ['w', 'W', 'ArrowUp'].includes(e.key) ? 1 : -1;
    return;
  }
  const k = e.key.toLowerCase();
  if (e.key === '?') return actions.openPanel('map');
  if (k === 't') return actions.openPanel('stack');
  if (k === 'm') return actions.toggleSound();
  if (k === 'c') return actions.setCinema(!cinema);
  if (k === 'e') return actions.toggleFocus();
  if (e.target.closest?.('button,a')) return;
  if (e.key === 'Enter') return actions.openPanel('detail');
  if (['PageDown', 'PageUp', 'Home', 'End'].includes(e.key)) {
    e.preventDefault();
    jump(e.key === 'Home' ? 0 : e.key === 'End' ? LAST : active + (e.key === 'PageDown' ? 1 : -1));
  }
});
addEventListener('keyup', (e) => {
  if (['w', 'W', 's', 'S', 'ArrowUp', 'ArrowDown'].includes(e.key)) keyboardDirection = 0;
});
addEventListener('blur', () => (keyboardDirection = 0));

// Pointer: parallax, drag to look around, hover and click on the current exhibit.
const ray = new T.Raycaster(),
  pointer = new T.Vector2(2, 2);
const canvas = renderer.domElement;
addEventListener('pointermove', (e) => {
  mouse.x = (e.clientX / innerWidth - 0.5) * 2;
  mouse.y = (e.clientY / innerHeight - 0.5) * 2;
  pointer.set((e.clientX / innerWidth) * 2 - 1, (-e.clientY / innerHeight) * 2 + 1);
  hoverDirty = e.pointerType === 'mouse' && e.target === canvas;
  if (look.dragging) {
    const dx = e.clientX - look.x,
      dy = e.clientY - look.y;
    look.moved += Math.abs(dx) + Math.abs(dy);
    look.yaw = clamp(look.yaw - dx * 0.0035, -0.75, 0.75);
    look.pitch = clamp(look.pitch + dy * 0.0025, -0.25, 0.3);
    look.x = e.clientX;
    look.y = e.clientY;
  }
});
canvas.addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'mouse' || e.button !== 0) return;
  Object.assign(look, { dragging: true, moved: 0, x: e.clientX, y: e.clientY });
  canvas.setPointerCapture(e.pointerId);
  document.body.classList.add('grabbing');
});
addEventListener('pointerup', () => {
  look.dragging = false;
  document.body.classList.remove('grabbing');
});
canvas.addEventListener('click', (e) => {
  if (look.moved > 6) return;
  pointer.set((e.clientX / innerWidth) * 2 - 1, (-e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(pointer, camera);
  if (
    ray.intersectObjects(world.pickables, false).some((h) => h.object.userData.chapter === active)
  )
    actions.openPanel('detail');
});

function resize() {
  const old = segment;
  segment = segmentFor();
  document.querySelector('#scroll-space').style.height = LAST * segment + innerHeight + 'px';
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  view.resize();
  if (old !== segment) scrollTo({ top: target * segment, behavior: 'instant' });
}
addEventListener('resize', resize);
resize();
scrollTo({ top: target * segment, behavior: 'instant' });
show(Math.round(current));
setPaused(paused);
addEventListener('visibilitychange', () => (hidden = document.hidden));

const clock = new T.Clock(),
  up = new T.Vector3(0, 1, 0);
let first = true;
function tick() {
  requestAnimationFrame(tick);
  const elapsed = clock.getDelta(),
    dt = Math.min(elapsed, 0.04);
  if (hidden) return;
  if (!paused) time += dt;
  const blocked = panelOpen();
  if (keyboardDirection && !blocked) {
    target = clamp(target + keyboardDirection * dt * 0.075, 0, LAST);
    scrollTo({ top: target * segment, behavior: 'instant' });
  }
  if (tour && !blocked) {
    if (Math.abs(target - (tourNext - 1)) < 0.015 && dwell < 7) {
      dwell += dt;
    } else {
      target = Math.min(tourNext, target + dt * 0.085);
      scrollTo({ top: target * segment, behavior: 'instant' });
      if (target >= tourNext - 0.001) {
        dwell = 0;
        if (tourNext === LAST) {
          stopTour();
          toast('Tour complete. Open the route map to revisit any room.');
        } else tourNext++;
      }
    }
  }
  // The walk tracks the scroll position closely: smooth damping, no speed cap, so the
  // character, the rail and the page never drift apart.
  const prev = current;
  // Real elapsed time keeps the follow in step with the page even when frames are slow.
  current = paused ? target : T.MathUtils.damp(current, target, 6, Math.min(elapsed, 0.25));
  if (Math.abs(target - current) < 0.0005) current = target;
  const moving = Math.abs(current - prev) > 0.00004,
    near = clamp(Math.floor(current + 0.36), 0, LAST);
  if (near !== active) {
    show(near);
    setFocus(false);
  }
  if (moving !== wasMoving) {
    wasMoving = moving;
    store.set({ moving });
  }
  progress.set(current);
  focusAmount = paused
    ? focused
      ? 1
      : 0
    : focusAmount +
      clamp(
        T.MathUtils.damp(focusAmount, focused ? 1 : 0, 2.4, dt) - focusAmount,
        -dt * 0.45,
        dt * 0.45,
      );
  const z = 6 - current * 24 - focusAmount * 3.8,
    x = Math.sin(current * Math.PI) * 0.33 + focusAmount * 2.1;
  character.root.position.set(x, 0, z);
  speed = cameraSnap
    ? 0
    : character.root.position.distanceTo(previousPosition) / Math.max(dt, 0.001);
  previousPosition.copy(character.root.position);
  const turning = focused ? -0.36 : moving ? Math.cos(current * Math.PI) * 0.04 : 0;
  character.root.rotation.y = T.MathUtils.damp(character.root.rotation.y, turning, 4, dt);
  character.update(dt, speed, time, paused, focused ? -0.12 : !moving ? -0.1 : 0);

  const mobile = innerWidth < 760;
  const reveal = (1 - Math.min(1, Math.abs(current - Math.round(current)) * 5)) * 0.25;
  still = moving || look.dragging ? 0 : still + dt;
  const drift = paused ? 0 : Math.min(1, Math.max(0, still - 1.5) / 6);
  cameraGoal.set(
    x -
      (mobile ? 1.6 : 1.5) -
      focusAmount * 0.6 +
      (paused ? 0 : mouse.x * 0.14) +
      Math.sin(time * 0.18) * 0.35 * drift,
    (mobile ? 5.2 : 2.75) + reveal * 0.3 - (paused ? 0 : mouse.y * 0.08),
    z + (mobile ? 8.8 : 6.9) - focusAmount * 0.5 - drift * 0.9,
  );
  lookGoal.set(
    x + (mobile ? 2 : 0.5) + focusAmount * (mobile ? 1.6 : 2.1),
    (mobile ? -1.6 : 1.45) - focusAmount * 0.45,
    z - 6.5 + focusAmount * 2,
  );
  // Drag-to-look orbits the camera around the character, then eases back to the follow shot.
  if (!look.dragging) {
    look.yaw = T.MathUtils.damp(look.yaw, 0, 2.2, dt);
    look.pitch = T.MathUtils.damp(look.pitch, 0, 2.2, dt);
  }
  pivot.set(x, 1.4, z);
  cameraGoal.sub(pivot).applyAxisAngle(up, look.yaw).add(pivot);
  cameraGoal.y += look.pitch * 4;
  camera.fov = T.MathUtils.damp(camera.fov, (mobile ? 58 : 46) - focusAmount * 6, 3, dt);
  camera.updateProjectionMatrix();
  if (first || paused || cameraSnap) {
    camera.position.copy(cameraGoal);
    viewLook.copy(lookGoal);
  } else {
    camera.position.lerp(cameraGoal, 1 - Math.exp(-dt * 3));
    viewLook.lerp(lookGoal, 1 - Math.exp(-dt * 3.4));
  }
  camera.lookAt(viewLook);
  // A slight bank into the walk adds weight to the camera.
  camera.rotation.z += clamp((target - current) * 0.12, -0.02, 0.02);
  cameraSnap = false;

  key.position.set(x - 4, 9, z + 5);
  key.target.position.set(x + 2, 0, z - 5);
  exhibitLight.position.set(4.5, 3.4, -active * 24 - 1.2);
  // Kept high and ahead of the character so its highlight never lands on the floor in front of the lens.
  rim.position.set(x + 2.2, 5.5, z - 3.5);
  // Depth of field focuses on the installation, or on the character when walking.
  view.focus(
    camera.position.distanceTo(pivot.set(moving ? x : 4.5, 1.4, moving ? z : -active * 24 - 3)),
  );
  world.update(time, dt, z, paused);
  atmosphere.update(time, dt, character.root.position, active, focusAmount, paused);

  if (hoverDirty && !look.dragging) {
    hoverDirty = false;
    ray.setFromCamera(pointer, camera);
    const over = ray
      .intersectObjects(world.pickables, false)
      .some((h) => h.object.userData.chapter === active);
    if (over !== hovering) {
      hovering = over;
      document.body.classList.toggle('can-inspect', over);
      world.highlight(over ? active : -1);
    }
  }
  view.render(dt, time);
  if (first) {
    first = false;
    store.set({ load: 1 });
    setTimeout(() => store.set({ loaded: true }), 350);
  }
}
tick();
