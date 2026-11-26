import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { Reflector } from 'three/addons/objects/Reflector.js';

const AMBER = 0xff7a2f,
  STEEL = 0xcfe3ff;
const SPACING = 24,
  // Every installation sits on a plinth at this local position, right of the walking line.
  EX = 4.5,
  EZ = -3;
// Emissive colours are pushed above 1 so bloom picks them up while the architecture stays dark.
const light = (color, power = 1, extra = {}) =>
  new T.MeshBasicMaterial({
    color: new T.Color(color).multiplyScalar(power),
    toneMapped: false,
    ...extra,
  });

export function createWorkshop(scene, { rooms, layers, reflections }) {
  const stations = rooms.length;
  // Installations are looked up by room slug, so rooms can be reordered in the content file.
  const R = Object.fromEntries(rooms.map((room, i) => [room.slug, i]));
  const obsidian = new T.MeshPhysicalMaterial({
    color: 0x1a1f27,
    roughness: 0.3,
    metalness: 0.25,
    clearcoat: 1,
    clearcoatRoughness: 0.18,
  });
  const graphite = new T.MeshStandardMaterial({
    color: 0x272d37,
    roughness: 0.58,
    metalness: 0.35,
  });
  const steel = new T.MeshStandardMaterial({ color: 0x9aa3ad, roughness: 0.28, metalness: 1 });
  const brass = new T.MeshStandardMaterial({ color: 0xc58a4a, roughness: 0.3, metalness: 1 });
  // Clear-coated translucent glass: reads as glass in the dark hall without the cost of a
  // transmission pass (which the mirrored floor would otherwise multiply).
  const glass = new T.MeshPhysicalMaterial({
    color: 0xcfdbe8,
    roughness: 0.08,
    metalness: 0.1,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  });
  const amber = light(AMBER, 2.4),
    amberSoft = light(AMBER, 1.1),
    cool = light(STEEL, 1.6),
    coolSoft = light(STEEL, 0.55);

  const groups = [],
    pickables = [],
    tickers = [],
    rings = [];
  const end = -(stations - 1) * SPACING - 16;

  function add(geo, mat, x, y, z, parent = scene, shadow = true) {
    const m = new T.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = shadow && !mat.transparent && mat.toneMapped !== false;
    m.receiveShadow = shadow;
    parent.add(m);
    return m;
  }
  const box = (w, h, d, x, y, z, mat, parent, r = 0.03) =>
    add(new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2, h / 2, d / 2)), mat, x, y, z, parent);

  // Crisp typography rendered with the page's own typefaces.
  function text(
    lines,
    {
      width = 4,
      size = 64,
      color = '#e9eef4',
      font = 'Geist Mono',
      weight = 400,
      spacing = 6,
      align = 'center',
      power = 1,
    } = {},
  ) {
    lines = [].concat(lines);
    const c = document.createElement('canvas'),
      ctx = c.getContext('2d'),
      lh = size * 1.35;
    c.width = 2048;
    c.height = Math.ceil(lh * lines.length + size * 0.6);
    ctx.font = `${weight} ${size}px "${font}", ui-monospace, monospace`;
    ctx.letterSpacing = spacing + 'px';
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    lines.forEach((s, i) =>
      ctx.fillText(s, align === 'left' ? 24 : 1024, size * 0.3 + lh * (i + 0.5)),
    );
    const tex = new T.CanvasTexture(c);
    tex.colorSpace = T.SRGBColorSpace;
    tex.anisotropy = 8;
    const mat = new T.MeshBasicMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    });
    mat.color.multiplyScalar(power);
    return new T.Mesh(new T.PlaneGeometry(width, (width * c.height) / c.width), mat);
  }
  function place(mesh, x, y, z, parent, ry = 0) {
    mesh.position.set(x, y, z);
    mesh.rotation.y = ry;
    parent.add(mesh);
    return mesh;
  }

  // ── The hall: mirrored floor, ribbed walls, a light slit overhead and cove light at the base.
  const length = 12 - end + 4,
    mid = (12 + end - 4) / 2;
  const reflector = new Reflector(new T.PlaneGeometry(21, length), {
    textureWidth: Math.round(innerWidth * 0.5),
    textureHeight: Math.round(innerHeight * 0.5),
    color: 0x6a7480,
  });
  reflector.rotation.x = -Math.PI / 2;
  reflector.position.set(0, -0.002, mid);
  reflector.visible = reflections;
  scene.add(reflector);
  const grid = document.createElement('canvas');
  grid.width = grid.height = 256;
  {
    const g = grid.getContext('2d');
    g.fillStyle = '#161b23';
    g.fillRect(0, 0, 256, 256);
    g.fillStyle = '#323a46';
    g.fillRect(0, 0, 256, 2);
    g.fillRect(0, 0, 2, 256);
  }
  const gridTex = new T.CanvasTexture(grid);
  gridTex.colorSpace = T.SRGBColorSpace;
  gridTex.wrapS = gridTex.wrapT = T.RepeatWrapping;
  gridTex.repeat.set(21 / 2.4, length / 2.4);
  gridTex.anisotropy = 8;
  // Mirror detail comes from the reflector below; a matte top layer keeps point-light
  // highlights from pooling on the floor in front of the camera.
  const floorMat = new T.MeshStandardMaterial({
    map: gridTex,
    roughness: 0.78,
    metalness: 0.05,
    transparent: true,
    opacity: reflections ? 0.86 : 1,
  });
  const floor = add(new T.PlaneGeometry(21, length), floorMat, 0, 0, mid, scene, false);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;

  const fins = [];
  for (let z = 12; z > end; z -= 1.15) for (const s of [-1, 1]) fins.push([s * 9.9, z]);
  const finMesh = new T.InstancedMesh(new T.BoxGeometry(0.16, 10, 0.55), graphite, fins.length);
  const m4 = new T.Matrix4();
  fins.forEach(([x, z], i) => finMesh.setMatrixAt(i, m4.makeTranslation(x, 5, z)));
  finMesh.receiveShadow = true;
  scene.add(finMesh);
  for (const s of [-1, 1]) {
    add(new T.PlaneGeometry(length, 10), graphite, s * 10.25, 5, mid, scene, false).rotation.y =
      (-s * Math.PI) / 2;
    add(new T.BoxGeometry(0.05, 0.05, length), coolSoft, s * 9.55, 0.04, mid, scene, false);
  }
  add(new T.PlaneGeometry(21, length), graphite, 0, 10, mid, scene, false).rotation.x = Math.PI / 2;
  add(new T.BoxGeometry(0.14, 0.04, length), cool, 0, 9.96, mid, scene, false);
  for (const s of [-1, 1])
    add(new T.BoxGeometry(0.03, 0.03, length), coolSoft, s * 3.2, 9.97, mid, scene, false);

  // Closing wall with a farewell line.
  add(new T.PlaneGeometry(21, 10), graphite, 0, 5, end, scene, false);
  place(
    text('THANK YOU FOR VISITING', { width: 7, size: 54, spacing: 22, color: '#9aa6b2' }),
    0,
    3.4,
    end + 0.05,
    scene,
  );
  add(new T.BoxGeometry(5, 0.03, 0.03), amber, 0, 2.9, end + 0.05, scene, false);

  const names = rooms.map((room) => room.room);
  for (let i = 0; i < stations; i++) {
    const g = new T.Group();
    g.position.z = -i * SPACING;
    scene.add(g);
    groups.push(g);

    // A monumental portal marks the threshold of every station.
    const pz = 9;
    box(0.7, 7, 0.9, -4.35, 3.5, pz, obsidian, g);
    box(0.7, 7, 0.9, 4.35, 3.5, pz, obsidian, g);
    box(9.4, 0.8, 0.9, 0, 7.4, pz, obsidian, g);
    for (const s of [-1, 1])
      add(new T.BoxGeometry(0.035, 6.95, 0.035), amberSoft, s * 3.99, 3.5, pz - 0.46, g, false);
    add(new T.BoxGeometry(7.95, 0.035, 0.035), amberSoft, 0, 6.99, pz - 0.46, g, false);
    place(
      text(`${String(i + 1).padStart(2, '0')} — ${names[i]}`, {
        width: 4.2,
        size: 56,
        spacing: 18,
        color: '#d9dfe6',
      }),
      0,
      7.42,
      pz + 0.46,
      g,
    );
    place(
      text(`${String(i + 1).padStart(2, '0')} — ${names[i]}`, {
        width: 4.2,
        size: 56,
        spacing: 18,
        color: '#d9dfe6',
      }),
      0,
      7.42,
      pz - 0.46,
      g,
      Math.PI,
    );

    // The plinth: lacquered stone with a light seam that brightens when the exhibit is hovered.
    const seam = light(AMBER, 1.4);
    rings.push(seam);
    const plinth = add(new T.CylinderGeometry(2.45, 2.55, 0.42, 72), obsidian, EX, 0.21, EZ, g);
    const edge = add(new T.TorusGeometry(2.45, 0.012, 8, 120), seam, EX, 0.425, EZ, g, false);
    edge.rotation.x = Math.PI / 2;
    add(new T.CylinderGeometry(2.2, 2.2, 0.01, 72), graphite, EX, 0.43, EZ, g);
    plinth.userData.chapter = i;
    pickables.push(plinth);
  }

  function own(object, chapter) {
    object.traverse((o) => {
      if (o.isMesh) {
        o.userData.chapter = chapter;
        pickables.push(o);
      }
    });
  }
  const at = (i) => {
    const g = new T.Group();
    g.position.set(EX, 0.43, EZ);
    groups[i].add(g);
    return g;
  };

  // ── 01 The Core: a floating processor wrapped in gyroscope rings.
  {
    const g = at(R.intro);
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = '#ff8a3d';
    ctx.lineWidth = 3;
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    for (let k = 0; k < 46; k++) {
      let x = 40 + rand() * 432,
        y = 40 + rand() * 432;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let s = 0; s < 3; s++) {
        if (rand() > 0.5) x = Math.min(472, Math.max(40, x + (rand() - 0.5) * 220));
        else y = Math.min(472, Math.max(40, y + (rand() - 0.5) * 220));
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.fillStyle = '#ffb27a';
      ctx.fillRect(x - 5, y - 5, 10, 10);
    }
    ctx.clearRect(176, 176, 160, 160);
    const traces = new T.CanvasTexture(c);
    traces.colorSpace = T.SRGBColorSpace;
    const chipMat = new T.MeshPhysicalMaterial({
      color: 0x0d0f12,
      roughness: 0.25,
      metalness: 0.6,
      clearcoat: 1,
      emissive: 0xffffff,
      emissiveMap: traces,
      emissiveIntensity: 1.6,
    });
    const chip = new T.Group();
    chip.position.y = 2.1;
    g.add(chip);
    box(2.2, 0.16, 2.2, 0, 0, 0, chipMat, chip, 0.04);
    box(0.85, 0.12, 0.85, 0, 0.12, 0, steel, chip, 0.03);
    place(
      text('JS', {
        width: 0.7,
        size: 300,
        font: 'Geist',
        weight: 600,
        spacing: -10,
        color: '#1b1f24',
      }),
      0,
      0.185,
      0,
      chip,
    ).rotation.x = -Math.PI / 2;
    const pins = new T.InstancedMesh(new T.BoxGeometry(0.05, 0.03, 0.16), brass, 64);
    let n = 0;
    for (let s = 0; s < 4; s++)
      for (let k = 0; k < 16; k++) {
        const u = -0.95 + k * 0.127;
        const o = new T.Object3D();
        o.position.set(
          s < 2 ? u : (s === 2 ? -1 : 1) * 1.17,
          -0.02,
          s < 2 ? (s ? -1 : 1) * 1.17 : u,
        );
        if (s >= 2) o.rotation.y = Math.PI / 2;
        o.updateMatrix();
        pins.setMatrixAt(n++, o.matrix);
      }
    chip.add(pins);
    const gyro = [];
    [2.0, 2.35, 2.7].forEach((r, k) => {
      const ring = add(
        new T.TorusGeometry(r, 0.018, 10, 160),
        k === 1 ? amber : steel,
        0,
        2.1,
        0,
        g,
        false,
      );
      gyro.push(ring);
    });
    own(g, R.intro);
    tickers.push((t, dt, paused) => {
      if (paused) return;
      chip.rotation.y = t * 0.25;
      chip.rotation.x = 0.42 + Math.sin(t * 0.6) * 0.06;
      chip.position.y = 2.1 + Math.sin(t * 0.9) * 0.08;
      chipMat.emissiveIntensity = 1.3 + Math.sin(t * 2.2) * 0.45;
      gyro.forEach((r, k) => {
        r.rotation.x = t * (0.3 + k * 0.12) + k;
        r.rotation.y = t * (0.22 - k * 0.07);
      });
    });
  }

  // ── 02 Campus: glass towers whose floors part like the layers of a service architecture.
  let explode = false;
  {
    const g = at(R.lms);
    const layers = [];
    const towers = [
      ['COURSES', -1.25, 0.7, 5],
      ['ASSESS', 0, -0.35, 7],
      ['PROGRESS', 1.25, 0.6, 4],
    ];
    towers.forEach(([name, x, z, floors], k) => {
      const tower = new T.Group();
      tower.position.set(x, 0, z);
      g.add(tower);
      for (let f = 0; f < floors; f++) {
        const layer = new T.Group();
        layer.userData = { base: 0.2 + f * 0.42, f, k };
        tower.add(layer);
        box(0.9, 0.36, 0.9, 0, 0, 0, glass, layer, 0.04);
        add(
          new T.BoxGeometry(0.92, 0.014, 0.92),
          f % 2 ? amberSoft : coolSoft,
          0,
          -0.19,
          0,
          layer,
          false,
        );
        layers.push(layer);
      }
      place(
        text(name, { width: 1.1, size: 60, spacing: 14, color: '#c7d1db' }),
        0,
        0.03,
        0.62,
        tower,
      ).rotation.x = -Math.PI / 2;
    });
    // Data threads between the towers, each with a travelling pulse.
    const tops = towers.map(([, x, z, f]) => new T.Vector3(x, 0.2 + f * 0.42 + 0.3, z));
    const threads = [];
    [
      [0, 1],
      [1, 2],
      [0, 2],
    ].forEach(([a, b]) => {
      const curve = new T.QuadraticBezierCurve3(
        tops[a],
        tops[a]
          .clone()
          .lerp(tops[b], 0.5)
          .add(new T.Vector3(0, 0.9, 0)),
        tops[b],
      );
      add(new T.TubeGeometry(curve, 48, 0.006, 6), coolSoft, 0, 0, 0, g, false);
      const pulse = add(new T.SphereGeometry(0.045, 16, 12), amber, 0, 0, 0, g, false);
      threads.push({ curve, pulse });
    });
    own(g, R.lms);
    tickers.push((t, dt, paused) => {
      layers.forEach((l) => {
        const { base, f, k } = l.userData;
        l.position.y = T.MathUtils.damp(
          l.position.y,
          base + (explode ? f * 0.28 + 0.15 : 0),
          5,
          dt,
        );
        l.rotation.y = T.MathUtils.damp(
          l.rotation.y,
          explode ? (f - 2) * 0.12 * (k - 1 || 1) : 0,
          5,
          dt,
        );
      });
      threads.forEach((th, k) => {
        th.pulse.visible = !explode;
        if (!paused) th.curve.getPoint((t * 0.35 + k / 3) % 1, th.pulse.position);
      });
    });
  }

  // ── 03 Flow: a queue of light moving through three service gates, with a live wait estimate.
  let calls = 0;
  const queue = { length: 9, counters: 3, minutes: 4 };
  let refreshReadout, flow;
  {
    const g = at(R.smartqueue);
    const path = new T.CatmullRomCurve3([
      new T.Vector3(-1.9, 0.18, 1.5),
      new T.Vector3(-1.2, 0.18, 0.4),
      new T.Vector3(-0.9, 0.18, -0.6),
      new T.Vector3(0.2, 0.18, -0.25),
    ]);
    add(new T.TubeGeometry(path, 80, 0.006, 6), coolSoft, 0, 0, 0, g, false);
    const gates = [-0.95, 0.1, 1.15].map((z, k) => {
      const gate = new T.Group();
      gate.position.set(1.45, 0, z);
      g.add(gate);
      box(0.06, 1.25, 0.06, 0, 0.62, -0.36, steel, gate, 0.02);
      box(0.06, 1.25, 0.06, 0, 0.62, 0.36, steel, gate, 0.02);
      const top = light(AMBER, 0.8);
      add(new T.BoxGeometry(0.06, 0.04, 0.78), top, 0, 1.25, 0, gate, false);
      place(
        text(`0${k + 1}`, { width: 0.5, size: 90, spacing: 4, color: '#b9c3cd' }),
        0.05,
        1.45,
        0,
        gate,
        -Math.PI / 2,
      );
      return { gate, top, flash: 0 };
    });
    const orbMat = light(AMBER, 1.8);
    const orbs = Array.from({ length: 10 }, (_, k) => ({
      mesh: add(new T.SphereGeometry(0.075, 20, 14), orbMat, 0, 0.18, 0, g, false),
      slot: k,
      s: 0.9 - k * 0.09,
      serving: null,
    }));
    const readout = document.createElement('canvas');
    readout.width = 1024;
    readout.height = 420;
    const rtex = new T.CanvasTexture(readout);
    rtex.colorSpace = T.SRGBColorSpace;
    const screen = add(
      new T.PlaneGeometry(1.9, 0.78),
      new T.MeshBasicMaterial({ map: rtex, transparent: true, toneMapped: false }),
      -0.2,
      2.15,
      -1.4,
      g,
      false,
    );
    screen.rotation.y = -0.25;
    refreshReadout = () => {
      const ctx = readout.getContext('2d'),
        wait = Math.round((queue.length * queue.minutes) / queue.counters);
      ctx.clearRect(0, 0, 1024, 420);
      ctx.fillStyle = 'rgba(12,15,19,.82)';
      ctx.fillRect(0, 0, 1024, 420);
      ctx.fillStyle = '#ff8a3d';
      ctx.fillRect(0, 0, 6, 420);
      ctx.fillStyle = '#8f9aa6';
      ctx.font = '400 34px "Geist Mono", monospace';
      ctx.letterSpacing = '6px';
      ctx.fillText('PREDICTED WAIT', 50, 80);
      ctx.fillStyle = '#f2f5f8';
      ctx.font = '500 170px "Geist", sans-serif';
      ctx.letterSpacing = '-6px';
      ctx.fillText(`${wait} min`, 44, 260);
      ctx.fillStyle = '#8f9aa6';
      ctx.font = '400 30px "Geist Mono", monospace';
      ctx.letterSpacing = '4px';
      ctx.fillText(
        `${queue.length} IN QUEUE · ${queue.counters} COUNTERS · ${queue.minutes} MIN AVG`,
        50,
        360,
      );
      rtex.needsUpdate = true;
    };
    refreshReadout();
    own(g, R.smartqueue);
    flow = {
      call() {
        const head = orbs.find((o) => o.slot === 0 && !o.serving);
        if (!head) return null;
        const k = calls % 3;
        head.serving = { gate: gates[k], from: head.mesh.position.clone(), u: 0 };
        head.slot = -1;
        orbs.forEach((o) => o !== head && !o.serving && o.slot--);
        return k;
      },
    };
    tickers.push((t, dt, paused) => {
      orbs.forEach((o) => {
        if (o.serving) {
          const sv = o.serving;
          sv.u = Math.min(1, sv.u + dt * 1.6);
          const target = sv.gate.gate.position.clone().setY(0.62);
          o.mesh.position.lerpVectors(sv.from, target, sv.u * sv.u * (3 - 2 * sv.u));
          o.mesh.position.y += Math.sin(sv.u * Math.PI) * 0.5;
          if (sv.u >= 1) {
            sv.gate.flash = 1;
            o.serving = null;
            o.slot = orbs.filter((q) => q.slot >= 0 && !q.serving).length;
            o.s = -0.15;
          }
        } else {
          o.s = T.MathUtils.damp(o.s, 0.9 - o.slot * 0.09, 3, dt);
          path.getPoint(T.MathUtils.clamp(o.s, 0, 1), o.mesh.position);
          if (!paused) o.mesh.position.y += Math.sin(t * 3 + o.slot) * 0.012;
          o.mesh.scale.setScalar(T.MathUtils.clamp((o.s + 0.15) * 6, 0, 1));
        }
      });
      gates.forEach((gt) => {
        gt.flash = Math.max(0, gt.flash - dt * 1.2);
        gt.top.color.setHex(AMBER).multiplyScalar(0.8 + gt.flash * 5);
      });
    });
  }

  // ── 04 Pulse: a live heartbeat over a landscape of rising effort.
  let running = true;
  {
    const g = at(R.fitness);
    const count = 38,
      bars = new T.InstancedMesh(new T.BoxGeometry(0.11, 1, 0.11), steel, count);
    bars.instanceColor = new T.InstancedBufferAttribute(new Float32Array(count * 3), 3);
    const heights = [],
      col = new T.Color();
    for (let k = 0; k < count; k++) {
      const u = k / (count - 1);
      heights.push(0.25 + u * 1.3 + Math.sin(k * 1.7) * 0.18);
      bars.setColorAt(k, col.setHex(0x3a4250).lerp(new T.Color(AMBER), u * u));
    }
    g.add(bars);
    const o = new T.Object3D();
    const ecgPoints = 220,
      ecg = new T.BufferGeometry();
    ecg.setAttribute('position', new T.BufferAttribute(new Float32Array(ecgPoints * 3), 3));
    const trace = new T.Line(ecg, light(AMBER, 3));
    trace.position.set(0, 2.15, 0.9);
    g.add(trace);
    const head = add(new T.SphereGeometry(0.05, 16, 12), light(AMBER, 4), 0, 0, 0, trace, false);
    const gauss = (q, m, w) => Math.exp(-((q - m) ** 2) / (2 * w * w));
    const beat = (q) =>
      0.07 * gauss(q, 0.25, 0.03) -
      0.12 * gauss(q, 0.46, 0.012) +
      0.75 * gauss(q, 0.5, 0.013) -
      0.22 * gauss(q, 0.54, 0.012) +
      0.14 * gauss(q, 0.72, 0.04);
    const dial = add(
      new T.TorusGeometry(1.05, 0.02, 8, 120, Math.PI * 2 * 0.72),
      light(AMBER, 1.6),
      0,
      2.15,
      -0.6,
      g,
      false,
    );
    dial.rotation.z = Math.PI / 2;
    add(new T.TorusGeometry(1.05, 0.006, 6, 120), coolSoft, 0, 2.15, -0.6, g, false);
    place(
      text(['72%', 'WEEKLY GOAL'], {
        width: 1.1,
        size: 90,
        font: 'Geist',
        weight: 500,
        spacing: 2,
        color: '#eef2f6',
      }),
      0,
      2.15,
      -0.58,
      g,
    );
    own(g, R.fitness);
    let phase = 0;
    tickers.push((t, dt, paused) => {
      const live = running && !paused;
      if (live) phase += dt;
      for (let k = 0; k < count; k++) {
        const a = -1.75 + (k / (count - 1)) * 3.5,
          h = heights[k] * (live ? 1 + Math.sin(phase * 2.4 - k * 0.35) * 0.12 : 1);
        o.position.set(Math.sin(a) * 1.85, h / 2, -Math.cos(a) * 1.85 + 0.3);
        o.rotation.y = -a;
        o.scale.set(1, h, 1);
        o.updateMatrix();
        bars.setMatrixAt(k, o.matrix);
      }
      bars.instanceMatrix.needsUpdate = true;
      const p = ecg.attributes.position;
      for (let k = 0; k < ecgPoints; k++) {
        const x = -1.9 + (k / (ecgPoints - 1)) * 3.8;
        p.setXYZ(k, x, beat(((((x - phase * 1.4) / 1.25) % 1) + 1) % 1), 0);
      }
      p.needsUpdate = true;
      head.position.set(1.9, p.getY(ecgPoints - 1), 0);
    });
  }

  // ── 05 Trajectory: a rising timeline of glass slabs inside an orbit of skills.
  {
    const g = at(R.experience);
    const steps = [
      ['2023 — 2027', 'B.TECH IT · SKCET'],
      ['JUN — JUL 2025', 'MIST SOFTWARE'],
      ['MAY — JUN 2026', 'HCL · JAVA FULL STACK'],
    ];
    const nodes = [];
    steps.forEach(([when, what], k) => {
      const slab = new T.Group();
      slab.position.set(-1.25 + k * 1.25, 0.95 + k * 0.7, 0.8 - k * 0.95);
      slab.rotation.y = -0.4;
      g.add(slab);
      box(1.5, 0.9, 0.05, 0, 0, 0, glass, slab, 0.02);
      add(
        new T.BoxGeometry(1.5, 0.012, 0.012),
        k === 2 ? amber : coolSoft,
        0,
        -0.45,
        0.03,
        slab,
        false,
      );
      place(
        text([when, what], { width: 1.3, size: 62, spacing: 6, align: 'left', color: '#e6ebf0' }),
        0.02,
        0.02,
        0.04,
        slab,
      );
      nodes.push(slab.position.clone().add(new T.Vector3(0, -0.6, 0)));
    });
    add(new T.TubeGeometry(new T.CatmullRomCurve3(nodes), 60, 0.008, 6), amber, 0, 0, 0, g, false);
    nodes.forEach((p) => add(new T.SphereGeometry(0.05, 16, 12), amber, p.x, p.y, p.z, g, false));
    const orbit = new T.Group();
    orbit.position.y = 1.7;
    orbit.rotation.x = 0.35;
    g.add(orbit);
    add(new T.TorusGeometry(2.2, 0.005, 6, 160), coolSoft, 0, 0, 0, orbit, false).rotation.x =
      Math.PI / 2;
    for (let k = 0; k < 11; k++) {
      const a = (k / 11) * Math.PI * 2;
      add(
        new T.SphereGeometry(0.04, 12, 10),
        k % 4 ? cool : amber,
        Math.cos(a) * 2.2,
        0,
        Math.sin(a) * 2.2,
        orbit,
        false,
      );
    }
    own(g, R.experience);
    tickers.push((t, dt, paused) => {
      if (!paused) orbit.rotation.y = t * 0.15;
    });
  }

  // ── 06 Portal: a ring of light with a swirling field drawing particles inward.
  {
    const g = at(R.contact);
    const portal = new T.Group();
    portal.position.set(0, 2.3, -0.4);
    portal.rotation.y = -0.35;
    g.add(portal);
    add(new T.TorusGeometry(1.75, 0.045, 16, 160), amber, 0, 0, 0, portal, false);
    add(new T.TorusGeometry(1.92, 0.008, 8, 160), coolSoft, 0, 0, 0, portal, false);
    const swirl = new T.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      transparent: true,
      depthWrite: false,
      blending: T.AdditiveBlending,
      vertexShader:
        'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: `uniform float time;varying vec2 vUv;
        void main(){vec2 p=vUv-.5;float r=length(p)*2.;float a=atan(p.y,p.x);
        float s=sin(a*5.+r*9.-time*1.6)*.5+.5;float v=pow(s,3.)*smoothstep(1.,.2,r)*smoothstep(0.,.35,r);
        vec3 c=mix(vec3(1.,.48,.18),vec3(.8,.9,1.),r*.6);gl_FragColor=vec4(c*v*.9+c*.06*smoothstep(1.,0.,r),1.);}`,
    });
    add(new T.CircleGeometry(1.72, 96), swirl, 0, 0, 0, portal, false);
    const n = 420,
      pos = new Float32Array(n * 3),
      seed = new Float32Array(n);
    for (let k = 0; k < n; k++) seed[k] = Math.random();
    const pg = new T.BufferGeometry();
    pg.setAttribute('position', new T.BufferAttribute(pos, 3));
    pg.setAttribute('seed', new T.BufferAttribute(seed, 1));
    const sparks = new T.Points(
      pg,
      new T.ShaderMaterial({
        uniforms: { time: { value: 0 } },
        transparent: true,
        depthWrite: false,
        blending: T.AdditiveBlending,
        vertexShader: `uniform float time;attribute float seed;varying float vA;
          void main(){float u=fract(seed*7.3+time*.12);float r=mix(3.2,.1,u);float a=seed*40.+u*7.;
          vec3 p=vec3(cos(a)*r,sin(a)*r,(1.-u)*1.4*(seed-.5));vA=u*(1.-u)*4.;
          vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=(18.*seed+6.)/-mv.z;gl_Position=projectionMatrix*mv;}`,
        fragmentShader: `varying float vA;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(vec3(1.,.62,.3)*2.,smoothstep(.5,0.,d)*vA);}`,
      }),
    );
    portal.add(sparks);
    place(
      text('SAY HELLO', { width: 1.6, size: 60, spacing: 24, color: '#ffd2b0' }),
      0,
      -2.05,
      0.05,
      portal,
    );
    own(g, R.contact);
    tickers.push((t) => {
      swirl.uniforms.time.value = t;
      sparks.material.uniforms.time.value = t;
    });
  }

  // Shared readout screen used by the Checkout installation.
  function readout(parent, x, y, z, ry) {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 420;
    const tex = new T.CanvasTexture(c);
    tex.colorSpace = T.SRGBColorSpace;
    const screen = add(
      new T.PlaneGeometry(1.9, 0.78),
      new T.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false }),
      x,
      y,
      z,
      parent,
      false,
    );
    screen.rotation.y = ry;
    return (label, value, note) => {
      const ctx = c.getContext('2d');
      ctx.clearRect(0, 0, 1024, 420);
      ctx.fillStyle = 'rgba(12,15,19,.82)';
      ctx.fillRect(0, 0, 1024, 420);
      ctx.fillStyle = '#ff8a3d';
      ctx.fillRect(0, 0, 6, 420);
      ctx.fillStyle = '#8f9aa6';
      ctx.font = '400 34px "Geist Mono", monospace';
      ctx.letterSpacing = '6px';
      ctx.fillText(label, 50, 80);
      ctx.fillStyle = '#f2f5f8';
      ctx.font = '500 150px "Geist", sans-serif';
      ctx.letterSpacing = '-5px';
      ctx.fillText(value, 44, 250);
      ctx.fillStyle = '#8f9aa6';
      ctx.font = '400 30px "Geist Mono", monospace';
      ctx.letterSpacing = '4px';
      ctx.fillText(note, 50, 360);
      tex.needsUpdate = true;
    };
  }

  // ── The Stack: a tapering column of tiers, one per layer of the technical stack.
  let expanded = false;
  if (R.stack != null) {
    const g = at(R.stack);
    const tiers = [];
    const steelColor = new T.Color(STEEL),
      amberColor = new T.Color(AMBER);
    add(new T.CylinderGeometry(0.05, 0.05, 6.2, 12), coolSoft, 0, 3.1, 0, g, false);
    layers.forEach((name, k) => {
      const u = k / Math.max(1, layers.length - 1);
      const tier = new T.Group();
      tier.userData = { k, base: 0.32 + k * 0.5 };
      tier.position.y = tier.userData.base;
      g.add(tier);
      const r = 1.45 - u * 0.55;
      const disc = add(new T.CylinderGeometry(r, r, 0.26, 64), obsidian, 0, 0, 0, tier);
      const edge = add(
        new T.TorusGeometry(r, 0.014, 8, 96),
        light(steelColor.clone().lerp(amberColor, u).getHex(), 1.6 + u),
        0,
        0.135,
        0,
        tier,
        false,
      );
      edge.rotation.x = Math.PI / 2;
      const label = text(`${String(k + 1).padStart(2, '0')}  ${name.toUpperCase()}`, {
        width: 3,
        size: 80,
        spacing: 10,
        align: 'left',
        color: '#e8edf2',
      });
      // Planes are centred, so shift by half the label width to start the text clear of the disc.
      label.position.set(r + 0.15 + 1.5, 0, 0.35);
      label.rotation.y = -0.35;
      tier.add(label);
      tiers.push({ tier, disc });
    });
    own(g, R.stack);
    tickers.push((t, dt, paused) => {
      tiers.forEach(({ tier, disc }) => {
        const { k, base } = tier.userData;
        tier.position.y = T.MathUtils.damp(
          tier.position.y,
          expanded ? 0.35 + k * 0.66 : base,
          4,
          dt,
        );
        tier.position.x = T.MathUtils.damp(
          tier.position.x,
          expanded ? (k % 2 ? 0.25 : -0.25) : 0,
          4,
          dt,
        );
        if (!paused) disc.rotation.y = t * (k % 2 ? 0.2 : -0.2);
      });
    });
  }

  // ── Checkout: products orbit a wireframe basket; adding one updates the cart total.
  let addToCart;
  if (R.shop != null) {
    const g = at(R.shop);
    const basket = new T.LineSegments(
      new T.EdgesGeometry(new T.BoxGeometry(1.3, 0.8, 0.95)),
      new T.LineBasicMaterial({ color: new T.Color(AMBER).multiplyScalar(2.2), toneMapped: false }),
    );
    basket.position.set(0, 0.42, 0);
    g.add(basket);
    add(new T.BoxGeometry(1.24, 0.02, 0.9), graphite, 0, 0.03, 0, g);
    const prices = [1299, 899, 2499, 499, 1799, 649, 999, 1499];
    const tints = [AMBER, STEEL, 0x7fd1c7, AMBER, STEEL, 0xd6b38a, 0x7fd1c7, STEEL];
    const products = prices.map((price, k) => {
      const card = new T.Group();
      g.add(card);
      card.scale.setScalar(1.35);
      box(0.42, 0.56, 0.04, 0, 0, 0, obsidian, card, 0.03);
      add(new T.BoxGeometry(0.3, 0.2, 0.01), light(tints[k], 1.3), 0, 0.08, 0.026, card, false);
      add(new T.BoxGeometry(0.22, 0.02, 0.01), coolSoft, -0.04, -0.13, 0.026, card, false);
      add(new T.BoxGeometry(0.12, 0.02, 0.01), amberSoft, -0.09, -0.19, 0.026, card, false);
      return {
        card,
        price,
        angle: (k / prices.length) * Math.PI * 2,
        state: 'orbit',
        u: 0,
        from: new T.Vector3(),
        slot: 0,
      };
    });
    const show = readout(g, -0.5, 2.55, -1.3, -0.25);
    let items = 0,
      total = 0;
    const money = (v) => '₹' + v.toLocaleString('en-IN');
    const note = () => `${items} ITEM${items === 1 ? '' : 'S'} · JWT SESSION · SECURE CHECKOUT`;
    show('CART TOTAL', money(0), note());
    addToCart = () => {
      const p = products.find((q) => q.state === 'orbit');
      if (!p || items >= 5) {
        products.forEach((q) => (q.state = 'orbit'));
        items = total = 0;
        show('CART TOTAL', money(0), note());
        return 'Order placed · cart cleared';
      }
      p.state = 'fly';
      p.u = 0;
      p.from.copy(p.card.position);
      p.slot = items;
      items++;
      total += p.price;
      show('CART TOTAL', money(total), note());
      return `Added to cart · ${items} item${items === 1 ? '' : 's'} · ${money(total)}`;
    };
    own(g, R.shop);
    const goal = new T.Vector3();
    tickers.push((t, dt, paused) => {
      products.forEach((p, k) => {
        if (p.state === 'orbit') {
          const a = p.angle + (paused ? 0 : t * 0.22);
          p.card.position.set(
            Math.cos(a) * 1.85,
            1.55 + Math.sin(a * 2 + k) * 0.12,
            Math.sin(a) * 1.85,
          );
          p.card.rotation.set(0, -a + Math.PI / 2, 0);
        } else {
          p.u = Math.min(1, p.u + dt * 1.4);
          const e = p.u * p.u * (3 - 2 * p.u);
          goal.set(-0.4 + (p.slot % 3) * 0.4, 0.35 + Math.floor(p.slot / 3) * 0.12, 0);
          p.card.position.lerpVectors(p.from, goal, e);
          p.card.position.y += Math.sin(e * Math.PI) * 0.6;
          p.card.rotation.set((-Math.PI / 2) * e, 0, 0);
        }
      });
      basket.rotation.y = paused ? 0 : Math.sin(t * 0.4) * 0.15;
    });
  }

  // ── The Lab: a neural network, a dashboard and a test grid on one plinth.
  let runTests;
  if (R.lab != null) {
    const g = at(R.lab);
    const net = new T.Group();
    net.position.set(-1.25, 0, 0.35);
    net.rotation.y = -0.5;
    g.add(net);
    const counts = [5, 7, 7, 3],
      layout = [],
      nodes = [];
    counts.forEach((n, l) => {
      const column = [];
      for (let k = 0; k < n; k++) {
        const p = new T.Vector3(-0.75 + l * 0.5, 1.5 + (k - (n - 1) / 2) * 0.26, 0);
        const color = l === counts.length - 1 ? AMBER : STEEL;
        const mat = light(color, 1.2);
        nodes.push({ mat, l, k, color });
        add(new T.SphereGeometry(0.045, 14, 10), mat, p.x, p.y, p.z, net, false);
        column.push(p);
      }
      layout.push(column);
    });
    const segs = [];
    for (let l = 0; l < layout.length - 1; l++)
      for (const a of layout[l])
        for (const b of layout[l + 1]) segs.push(a.x, a.y, a.z, b.x, b.y, b.z);
    const lines = new T.BufferGeometry();
    lines.setAttribute('position', new T.Float32BufferAttribute(segs, 3));
    net.add(
      new T.LineSegments(
        lines,
        new T.LineBasicMaterial({
          color: 0x8fa6bf,
          transparent: true,
          opacity: 0.18,
          depthWrite: false,
        }),
      ),
    );
    place(
      text('RESNET50 · TENSORFLOW', { width: 1.3, size: 54, spacing: 10, color: '#aeb8c3' }),
      0,
      0.12,
      0.05,
      net,
    );
    const bi = new T.Group();
    bi.position.set(0.25, 0, -0.75);
    bi.rotation.y = -0.35;
    g.add(bi);
    [0.5, 0.8, 0.65, 1.1, 0.9, 1.35].forEach((h, k) =>
      box(0.16, h, 0.16, -0.5 + k * 0.2, h / 2 + 0.02, 0, k === 5 ? brass : steel, bi, 0.02),
    );
    const donut = add(
      new T.TorusGeometry(0.28, 0.05, 12, 64, Math.PI * 1.35),
      amber,
      0.15,
      1.95,
      0,
      bi,
      false,
    );
    add(new T.TorusGeometry(0.28, 0.012, 8, 64), coolSoft, 0.15, 1.95, 0, bi, false);
    place(
      text('POWER BI', { width: 1, size: 54, spacing: 10, color: '#aeb8c3' }),
      0,
      0.12,
      0.2,
      bi,
    );
    const grid = new T.Group();
    grid.position.set(1.35, 0, 0.55);
    grid.rotation.y = -0.6;
    g.add(grid);
    box(1.15, 1.45, 0.05, 0, 1.25, -0.05, graphite, grid, 0.02);
    const cells = [];
    for (let row = 0; row < 5; row++)
      for (let col = 0; col < 4; col++) {
        const mat = light(0x3a424c, 1);
        add(
          new T.BoxGeometry(0.17, 0.17, 0.02),
          mat,
          -0.39 + col * 0.26,
          1.78 - row * 0.26,
          0,
          grid,
          false,
        );
        cells.push(mat);
      }
    place(
      text('SELENIUM · TESTNG', { width: 1.1, size: 54, spacing: 10, color: '#aeb8c3' }),
      0,
      0.3,
      0.05,
      grid,
    );
    let started = -1;
    runTests = (time) => {
      started = time;
      return `Running the suite · ${cells.length} of ${cells.length} checks pass`;
    };
    own(g, R.lab);
    const pass = new T.Color(0x6ee7b7).multiplyScalar(2.2),
      idle = new T.Color(0x3a424c);
    tickers.push((t, dt, paused) => {
      nodes.forEach(({ mat, l, k, color }) => {
        const wave = paused ? 0 : Math.max(0, Math.sin(t * 2.2 - l * 1.1 + k * 0.4));
        mat.color.setHex(color).multiplyScalar(0.8 + wave * 2.2);
      });
      if (!paused) donut.rotation.z = t * 0.3;
      cells.forEach((mat, k) =>
        mat.color.copy(started >= 0 && t - started > k * 0.12 ? pass : idle),
      );
    });
  }

  return {
    groups,
    pickables,
    act(slug, time) {
      if (slug === 'stack') {
        expanded = !expanded;
        return expanded ? 'Column expanded · every layer of the stack' : 'Column collapsed';
      }
      if (slug === 'lms') {
        explode = !explode;
        return explode
          ? 'Architecture separated into its service layers'
          : 'Architecture reassembled';
      }
      if (slug === 'smartqueue') {
        const gate = flow.call();
        if (gate == null) return null;
        calls++;
        queue.length = queue.length > 4 ? queue.length - 1 : 12;
        refreshReadout();
        return `Visitor called to counter 0${gate + 1} · predicted wait now ${Math.round((queue.length * queue.minutes) / queue.counters)} min`;
      }
      if (slug === 'shop') return addToCart();
      if (slug === 'fitness') {
        running = !running;
        return running ? 'Pulse running' : 'Pulse paused';
      }
      if (slug === 'lab') return runTests(time);
      return null;
    },
    highlight(chapter) {
      rings.forEach((m, i) => m.color.setHex(AMBER).multiplyScalar(i === chapter ? 4.5 : 1.4));
    },
    setReflections(on) {
      reflector.visible = on;
      floorMat.opacity = on ? 0.86 : 1;
    },
    update(t, dt, z, paused) {
      groups.forEach((g) => (g.visible = Math.abs(g.position.z - z) < 32));
      for (const tick of tickers) tick(t, dt, paused);
    },
  };
}
