import * as T from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { horizonAt } from '../lib/art.js';
import { seeded } from '../lib/math.js';

/**
 * The plain as a working tech landscape at night, built from real
 * infrastructure rather than abstract blocks:
 *
 *   - server pods along the front: rack cabinets in dark metal, their front
 *     panels lined with status LEDs that pulse;
 *   - a satellite-dish array in the middle distance, aimed up at the globe
 *     and slowly tracking it;
 *   - solar fields of glossy panels catching the sky;
 *   - steel lattice telecom towers with blinking aviation lights;
 *   - cooling towers on the far side, steam drifting off them.
 *
 * Physically based materials with a dim environment map for real metal and
 * glass reflections, moonlight from the globe's side, fog for depth, and a
 * faint mirrored pass so everything reflects in the liquid floor.
 *
 * The camera is fitted to the painted grid (eye height 1, horizon on the same
 * screen line), and a corridor stays open down the middle for the developer.
 */

export function createCity(canvas) {
  const renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.autoClear = false;

  const scene = new T.Scene();
  const pmrem = new T.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  scene.environment = pmrem.fromScene(room, 0.04).texture;
  scene.environmentIntensity = 0.22;
  room.dispose();
  pmrem.dispose();

  const camera = new T.PerspectiveCamera(36, 1, 0.05, 400);
  camera.position.set(0, 1, 0);
  camera.lookAt(0, 1, -1);

  // Night lighting: cool sky, moonlight from the globe (back right), warm city bounce.
  scene.add(new T.HemisphereLight(0x8fb2e8, 0x080c14, 0.9));
  const moon = new T.DirectionalLight(0xc4dcff, 2.4);
  moon.position.set(6, 5, -10);
  scene.add(moon);
  const bounce = new T.DirectionalLight(0xffb27a, 0.45);
  bounce.position.set(-6, 2, 6);
  scene.add(bounce);

  const world = new T.Group();
  scene.add(world);

  const disposables = [];
  const keep = (x) => (disposables.push(x), x);

  // ---------------------------------------------------------------- materials
  const steel = keep(new T.MeshStandardMaterial({ color: 0x1a2230, metalness: 0.75, roughness: 0.38 }));
  const darkSteel = keep(new T.MeshStandardMaterial({ color: 0x0c1119, metalness: 0.6, roughness: 0.5 }));
  const dishPaint = keep(
    new T.MeshStandardMaterial({ color: 0x7d8796, metalness: 0.35, roughness: 0.55, side: T.DoubleSide }),
  );
  const concrete = keep(new T.MeshStandardMaterial({ color: 0x5c626b, metalness: 0, roughness: 0.95 }));
  const solarGlass = keep(new T.MeshStandardMaterial({ color: 0x1b3a6e, metalness: 0.85, roughness: 0.22 }));
  const lattice = keep(new T.LineBasicMaterial({ color: 0x6b7c95, transparent: true, opacity: 0.85 }));

  // Rack front panel: rack units, vents and rows of status LEDs, drawn once.
  const rackFace = (() => {
    const make = () => {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 128;
      return [c, c.getContext('2d')];
    };
    const [c, g] = make();
    const [e, ge] = make();
    g.fillStyle = '#0b1018';
    g.fillRect(0, 0, 512, 128);
    ge.fillStyle = '#000';
    ge.fillRect(0, 0, 512, 128);
    const r = seeded(3);
    for (let cab = 0; cab < 8; cab++) {
      const x0 = cab * 64;
      g.fillStyle = '#121a26';
      g.fillRect(x0 + 2, 2, 60, 124);
      for (let u = 0; u < 10; u++) {
        const y = 6 + u * 12;
        g.fillStyle = '#0d131c';
        g.fillRect(x0 + 5, y, 54, 10);
        g.fillStyle = 'rgba(140,170,210,0.12)';
        for (let v = 0; v < 8; v++) g.fillRect(x0 + 24 + v * 4, y + 3, 2, 4);
        for (let l = 0; l < 3; l++) {
          if (r() < 0.25) continue;
          const col = r() < 0.7 ? '#4fe3ff' : r() < 0.6 ? '#7dffb0' : '#ffb060';
          ge.fillStyle = col;
          ge.fillRect(x0 + 8 + l * 5, y + 4, 3, 2);
          g.fillStyle = col;
          g.fillRect(x0 + 8 + l * 5, y + 4, 3, 2);
        }
      }
      g.fillStyle = 'rgba(160,190,230,0.18)';
      g.fillRect(x0 + 2, 2, 60, 1);
    }
    const map = new T.CanvasTexture(c);
    map.colorSpace = T.SRGBColorSpace;
    map.anisotropy = 4;
    const emissive = new T.CanvasTexture(e);
    emissive.colorSpace = T.SRGBColorSpace;
    return { map: keep(map), emissive: keep(emissive) };
  })();
  const rackFront = keep(
    new T.MeshStandardMaterial({
      map: rackFace.map,
      emissiveMap: rackFace.emissive,
      emissive: 0xffffff,
      emissiveIntensity: 1.6,
      metalness: 0.55,
      roughness: 0.32,
    }),
  );
  // Box face order: +x, -x, +y, -y, +z (front, toward the viewer), -z.
  const rackMaterials = [steel, steel, darkSteel, darkSteel, rackFront, steel];

  // ------------------------------------------------------------ builders
  const podGeo = keep(new T.BoxGeometry(1, 1, 1));
  podGeo.translate(0, 0.5, 0);

  function dish(size) {
    const g = new T.Group();
    const pts = [];
    for (let i = 0; i <= 14; i++) {
      const r = (i / 14) * size;
      pts.push(new T.Vector2(r, (r * r) / (size * 2.2)));
    }
    const head = new T.Group();
    head.add(new T.Mesh(keep(new T.LatheGeometry(pts, 40)), dishPaint));
    // Feed horn on three struts at the focus.
    const focus = size * 0.62;
    const horn = new T.Mesh(keep(new T.CylinderGeometry(size * 0.05, size * 0.07, size * 0.14, 10)), darkSteel);
    horn.position.y = focus;
    head.add(horn);
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2;
      const rim = size * 0.8;
      const from = new T.Vector3(Math.cos(a) * rim, (rim * rim) / (size * 2.2), Math.sin(a) * rim);
      const to = new T.Vector3(0, focus, 0);
      const strut = new T.Mesh(
        keep(new T.CylinderGeometry(size * 0.012, size * 0.012, from.distanceTo(to), 5)),
        darkSteel,
      );
      strut.position.copy(from).add(to).multiplyScalar(0.5);
      strut.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), to.clone().sub(from).normalize());
      head.add(strut);
    }
    // Pedestal on a concrete pad.
    const post = new T.Mesh(keep(new T.CylinderGeometry(size * 0.09, size * 0.14, size * 0.9, 12)), steel);
    post.position.y = size * 0.45;
    const base = new T.Mesh(keep(new T.BoxGeometry(size * 0.6, size * 0.12, size * 0.6)), concrete);
    base.position.y = size * 0.06;
    head.position.y = size * 0.95;
    g.add(base, post, head);
    return { group: g, head };
  }

  function latticeTower(height) {
    const pts = [];
    const segs = Math.round(height * 9);
    const corner = (y, i) => {
      const h = 0.16 - (0.16 - 0.035) * (y / height);
      const sx = i === 0 || i === 3 ? -1 : 1;
      const sz = i < 2 ? -1 : 1;
      return [sx * h, y, sz * h];
    };
    for (let s = 0; s < segs; s++) {
      const y0 = (s / segs) * height;
      const y1 = ((s + 1) / segs) * height;
      for (let i = 0; i < 4; i++) {
        const j = (i + 1) % 4;
        pts.push(...corner(y0, i), ...corner(y1, i)); // leg
        pts.push(...corner(y1, i), ...corner(y1, j)); // ring
        pts.push(...corner(y0, i), ...corner(y1, j)); // diagonal
        pts.push(...corner(y0, j), ...corner(y1, i)); // cross diagonal
      }
    }
    pts.push(0, height, 0, 0, height + 0.35, 0); // antenna mast
    const geo = keep(new T.BufferGeometry());
    geo.setAttribute('position', new T.Float32BufferAttribute(pts, 3));
    return new T.LineSegments(geo, lattice);
  }

  function coolingTower(height, radius) {
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const y = (i / 24) * height;
      const k = (y - height * 0.72) / (height * 0.55);
      pts.push(new T.Vector2(radius * 0.62 * Math.sqrt(1 + k * k * 1.6), y));
    }
    return new T.Mesh(keep(new T.LatheGeometry(pts, 48)), concrete);
  }

  // ------------------------------------------------------------- beacons, steam
  const beaconGeo = keep(new T.BufferGeometry());
  const beaconMat = keep(
    new T.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uDpr: { value: 1 } },
      transparent: true,
      depthWrite: false,
      blending: T.AdditiveBlending,
      vertexShader: /* glsl */ `
        attribute float aSeed; uniform float uTime; uniform float uDpr; varying float vOn;
        void main() {
          vOn = step(0.62, fract(uTime * 0.55 + aSeed));
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = (4.0 + vOn * 10.0) * uDpr * (8.0 / -mv.z) + 1.5 * uDpr;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        varying float vOn;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = pow(smoothstep(0.5, 0.0, d), 2.2) * (0.3 + vOn * 0.9);
          gl_FragColor = vec4(vec3(1.0, 0.25, 0.15) * a, a);
        }`,
    }),
  );
  const beacons = new T.Points(beaconGeo, beaconMat);
  beacons.frustumCulled = false;

  const steamGeo = keep(new T.BufferGeometry());
  const steamMat = keep(
    new T.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uDpr: { value: 1 } },
      transparent: true,
      depthWrite: false,
      vertexShader: /* glsl */ `
        attribute vec4 aSteam; attribute vec3 aOrigin;
        uniform float uTime; uniform float uDpr; varying float vA;
        void main() {
          float k = fract(aSteam.x + uTime * 0.025);
          vec3 p = aOrigin + vec3(
            sin(aSteam.y * 6.28 + k * 2.0) * aSteam.z * (0.3 + k * 1.4) + k * 0.9,
            k * 1.6,
            cos(aSteam.y * 6.28) * aSteam.z * 0.4);
          vA = smoothstep(0.0, 0.12, k) * (1.0 - k) * 0.22;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = (40.0 + k * 140.0) * aSteam.w * uDpr * (10.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        varying float vA;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d) * vA;
          gl_FragColor = vec4(vec3(0.62, 0.7, 0.82), a);
        }`,
    }),
  );
  const steam = new T.Points(steamGeo, steamMat);
  steam.frustumCulled = false;

  const solarGeo = keep(new T.BoxGeometry(1, 0.03, 0.62));

  // ----------------------------------------------------------------- layout
  let fitted = '';
  let globeDir = new T.Vector3(0.3, 0.45, -1).normalize();
  let dishes = [];
  let solarMesh = null;

  function layout(w, h) {
    const H = horizonAt(w, h);
    const fullH = 2 * H;
    camera.aspect = w / fullH;
    camera.setViewOffset(w, fullH, 0, 0, w, h);
    camera.updateProjectionMatrix();
    const f = H / Math.tan(T.MathUtils.degToRad(camera.fov / 2));
    const depthUnit = f / (h - H); // world depth per unit of grid depth
    const halfW = (d) => (d * (w / 2)) / f; // visible half width at depth d
    const lane = ((w * 0.09) / (h - H)) * 1.8; // corridor half width

    scene.fog = new T.Fog(0x0b1322, depthUnit * 4, depthUnit * 26);

    // The globe's direction, for the dishes: the same screen spot as the globe.
    // Mostly skyward, leaning toward the globe, so the bowls read from above.
    globeDir = new T.Vector3(((w * 0.66 - w / 2) / f) * 0.8, 1.0, -0.45).normalize();

    world.clear();
    solarMesh?.dispose();
    dishes = [];
    const r = seeded(17);
    const beaconPos = [];
    const beaconSeed = [];
    const steamData = [];
    const steamOrigin = [];
    const sideX = (d, min, spread) => (r() < 0.5 ? -1 : 1) * (Math.max(lane, min) + r() * spread * halfW(d));

    // Server pods: rows of rack cabinets near the front, both sides.
    for (const side of [-1, 1]) {
      for (let row = 0; row < 3; row++) {
        const d = depthUnit * (1.9 + row * 0.75);
        let x = lane + 0.05 + row * 0.04;
        const end = halfW(d) * 1.05;
        while (x < end) {
          const len = 0.45 + r() * 0.5;
          const pod = new T.Mesh(podGeo, rackMaterials);
          pod.scale.set(len, 0.17 + r() * 0.05, 0.26);
          pod.position.set(side * (x + len / 2), 0, -d - r() * 0.3);
          world.add(pod);
          x += len + 0.12 + r() * 0.35;
        }
      }
    }

    // Satellite dishes, aimed at the globe.
    for (let i = 0; i < 7; i++) {
      const d = depthUnit * (3.6 + i * 0.75 + r() * 0.6);
      const { group, head } = dish(0.24 + r() * 0.14);
      group.position.set(sideX(d, lane + 0.4, 0.55), 0, -d);
      world.add(group);
      dishes.push({ head, phase: r() * 6.28 });
    }

    // Solar fields: tilted panels in tidy blocks.
    const panels = [];
    for (let k = 0; k < 6; k++) {
      const d0 = depthUnit * (5 + r() * 9);
      const x0 = sideX(d0, lane + 0.6, 0.7);
      const cols = 6 + Math.floor(r() * 5);
      const rows = 3 + Math.floor(r() * 3);
      for (let a = 0; a < cols; a++) {
        for (let b = 0; b < rows; b++) panels.push([x0 + (a - cols / 2) * 0.3, -d0 - b * 0.42]);
      }
    }
    solarMesh = new T.InstancedMesh(solarGeo, solarGlass, panels.length);
    const m = new T.Matrix4();
    const tilt = new T.Quaternion().setFromEuler(new T.Euler(0.55, 0, 0));
    panels.forEach(([x, z], i) => {
      m.compose(new T.Vector3(x, 0.1, z), tilt, new T.Vector3(0.27, 1, 0.3));
      solarMesh.setMatrixAt(i, m);
    });
    world.add(solarMesh);

    // Lattice towers with aviation lights.
    for (let i = 0; i < 5; i++) {
      const d = depthUnit * (6 + i * 3 + r() * 2);
      const height = 1.3 + r() * 1.1;
      const tower = latticeTower(height);
      tower.position.set(sideX(d, lane + 0.8, 0.85), 0, -d);
      world.add(tower);
      beaconPos.push(tower.position.x, height + 0.35, tower.position.z, tower.position.x, height * 0.55, tower.position.z);
      beaconSeed.push(r(), r());
    }

    // Cooling towers on the far side, steaming.
    for (let i = 0; i < 3; i++) {
      const d = depthUnit * (15 + i * 4 + r() * 2);
      const height = 1.4 + r() * 0.5;
      const ct = coolingTower(height, 0.55 + r() * 0.15);
      ct.position.set((i === 1 ? -1 : 1) * halfW(d) * (0.35 + r() * 0.35), 0, -d);
      world.add(ct);
      for (let k = 0; k < 90; k++) {
        steamData.push(r(), r(), 0.15 + r() * 0.3, 0.7 + r() * 0.6);
        steamOrigin.push(ct.position.x, height, ct.position.z);
      }
    }

    beaconGeo.setAttribute('position', new T.Float32BufferAttribute(beaconPos, 3));
    beaconGeo.setAttribute('aSeed', new T.Float32BufferAttribute(beaconSeed, 1));
    steamGeo.setAttribute('position', new T.Float32BufferAttribute(new Array(steamOrigin.length).fill(0), 3));
    steamGeo.setAttribute('aSteam', new T.Float32BufferAttribute(steamData, 4));
    steamGeo.setAttribute('aOrigin', new T.Float32BufferAttribute(steamOrigin, 3));
    world.add(beacons, steam);
  }

  // Dims the mirrored pass: destination × a factor that fades with depth below the horizon.
  const dimScene = new T.Scene();
  const dimCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const dimMat = keep(
    new T.ShaderMaterial({
      uniforms: { uH: { value: 0.6 }, uRes: { value: new T.Vector2(1, 1) } },
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: T.CustomBlending,
      blendEquation: T.AddEquation,
      blendSrc: T.ZeroFactor,
      blendDst: T.SrcAlphaFactor,
      blendSrcAlpha: T.ZeroFactor,
      blendDstAlpha: T.SrcAlphaFactor,
      vertexShader: /* glsl */ `void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform float uH; uniform vec2 uRes;
        void main() {
          float y = 1.0 - gl_FragCoord.y / uRes.y; // 0 top, 1 bottom
          float below = max(y - uH, 0.0);
          gl_FragColor = vec4(0.0, 0.0, 0.0, 0.3 * exp(-below * 7.0));
        }`,
    }),
  );
  dimScene.add(new T.Mesh(keep(new T.PlaneGeometry(2, 2)), dimMat));

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    beaconMat.uniforms.uDpr.value = dpr;
    steamMat.uniforms.uDpr.value = dpr;
    dimMat.uniforms.uRes.value.set(w * dpr, h * dpr);
    dimMat.uniforms.uH.value = horizonAt(w, h) / h;
    const key = `${w}x${h}`;
    if (key !== fitted) {
      fitted = key;
      layout(w, h);
    }
  }
  resize();

  const up = new T.Vector3(0, 1, 0);
  const aim = new T.Vector3();
  function render(timeMs, animate = true) {
    const t = animate ? timeMs / 1000 : 0;
    beaconMat.uniforms.uTime.value = t;
    steamMat.uniforms.uTime.value = t;
    rackFront.emissiveIntensity = 1.4 + Math.sin(t * 2.3) * 0.25 + Math.sin(t * 7.1) * 0.1;
    // Dishes track the globe with a slow drift.
    for (const d of dishes) {
      aim.set(
        globeDir.x + Math.sin(t * 0.15 + d.phase) * 0.05,
        globeDir.y + Math.cos(t * 0.12 + d.phase) * 0.03,
        globeDir.z,
      );
      d.head.quaternion.setFromUnitVectors(up, aim.normalize());
    }

    renderer.clear();
    // Reflection: the world flipped under the floor, then dimmed with depth.
    world.scale.y = -1;
    renderer.render(scene, camera);
    renderer.render(dimScene, dimCam);
    world.scale.y = 1;
    renderer.clearDepth();
    renderer.render(scene, camera);
  }

  return {
    resize,
    render,
    dispose() {
      for (const x of disposables) x.dispose?.();
      solarMesh?.dispose();
      scene.environment?.dispose();
      renderer.dispose();
    },
  };
}
