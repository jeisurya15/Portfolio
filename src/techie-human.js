import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function createTechie(scene) {
  const root = new T.Group(),
    pelvis = new T.Group(),
    chest = new T.Group();
  scene.add(root);
  root.add(pelvis);
  pelvis.add(chest);
  const mat = (color, roughness = 0.85) => new T.MeshStandardMaterial({ color, roughness });
  const skin = mat(0xc78d68),
    hair = mat(0x18191b),
    cloth = mat(0xa86c43),
    cuffs = mat(0x69452f),
    shirt = mat(0xd3cabb);
  const denim = mat(0x263747),
    seam = mat(0x4a5863),
    shoes = mat(0x253235),
    rubber = mat(0xddd6c5),
    pack = mat(0x283e3f),
    leather = mat(0x162b2c);
  const metal = new T.MeshStandardMaterial({ color: 0xa9b9b2, roughness: 0.35, metalness: 0.7 });
  const lens = new T.MeshPhysicalMaterial({
    color: 0x85b1b5,
    roughness: 0.15,
    transparent: true,
    opacity: 0.45,
  });
  function mesh(geo, material, x, y, z, parent = chest) {
    const o = new T.Mesh(geo, material);
    o.position.set(x, y, z);
    o.castShadow = true;
    o.receiveShadow = true;
    parent.add(o);
    return o;
  }
  const box = (w, h, d, x, y, z, m, p) =>
    mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(w, h, d) * 0.2), m, x, y, z, p);
  function ellipsoid(x, y, z, sx, sy, sz, m, p) {
    const o = mesh(new T.SphereGeometry(1, 24, 16), m, x, y, z, p);
    o.scale.set(sx, sy, sz);
    return o;
  }
  function tube(points, r, m, p) {
    return mesh(
      new T.TubeGeometry(
        new T.CatmullRomCurve3(points.map((v) => new T.Vector3(...v))),
        20,
        r,
        6,
        false,
      ),
      m,
      0,
      0,
      0,
      p,
    );
  }
  // Tapered jacket, natural shoulders, collar, zipper, hem and visible stitching.
  const torso = mesh(new T.CylinderGeometry(0.29, 0.23, 0.66, 24), cloth, 0, 1.38, 0);
  torso.scale.z = 0.65;
  ellipsoid(0, 1.63, 0, 0.34, 0.18, 0.2, cloth);
  const hem = mesh(new T.CylinderGeometry(0.23, 0.24, 0.08, 24), cuffs, 0, 1.055, 0);
  hem.scale.z = 0.7;
  box(0.17, 0.48, 0.035, 0, 1.42, -0.195, shirt);
  for (const side of [-1, 1]) {
    tube(
      [
        [side * 0.06, 1.67, -0.21],
        [side * 0.08, 1.45, -0.22],
        [side * 0.09, 1.1, -0.17],
      ],
      0.009,
      metal,
    );
    tube(
      [
        [side * 0.12, 1.3, -0.195],
        [side * 0.22, 1.19, -0.17],
      ],
      0.009,
      cuffs,
    );
    ellipsoid(side * 0.12, 1.7, 0.08, 0.18, 0.095, 0.15, cuffs);
  }
  mesh(new T.CylinderGeometry(0.068, 0.08, 0.17, 16), skin, 0, 1.8, 0);
  const head = new T.Group();
  head.position.set(0, 2.01, -0.015);
  chest.add(head);
  ellipsoid(0, 0, 0, 0.145, 0.205, 0.143, skin, head);
  ellipsoid(0, -0.11, -0.025, 0.108, 0.09, 0.11, skin, head);
  ellipsoid(0, -0.015, -0.141, 0.031, 0.047, 0.035, skin, head);
  ellipsoid(0, 0.102, 0.022, 0.151, 0.127, 0.143, hair, head);
  for (let i = 0; i < 5; i++) {
    const lock = ellipsoid(
      -0.106 + i * 0.05,
      0.17 + Math.sin(i * 0.7) * 0.02,
      -0.04,
      0.065,
      0.067,
      0.105,
      hair,
      head,
    );
    lock.rotation.z = -0.3;
  }
  for (const side of [-1, 1]) {
    ellipsoid(side * 0.147, -0.015, 0.005, 0.027, 0.047, 0.026, skin, head);
    box(0.113, 0.073, 0.015, side * 0.067, 0.02, -0.137, leather, head);
    box(0.09, 0.05, 0.012, side * 0.067, 0.02, -0.147, lens, head);
    box(0.012, 0.013, 0.16, side * 0.125, 0.035, -0.065, leather, head);
  }
  box(0.027, 0.012, 0.017, 0, 0.03, -0.145, metal, head);
  const backpack = new T.Group();
  chest.add(backpack);
  box(0.39, 0.49, 0.19, 0, 1.4, 0.24, pack, backpack);
  box(0.32, 0.15, 0.055, 0, 1.24, 0.35, leather, backpack);
  box(0.29, 0.014, 0.012, 0, 1.37, 0.344, metal, backpack);
  box(0.025, 0.055, 0.012, 0.126, 1.35, 0.357, metal, backpack);
  box(0.12, 0.045, 0.02, 0, 1.52, 0.341, shirt, backpack);
  // A small status light on the pack ties the character to the hall's amber accents.
  box(
    0.07,
    0.014,
    0.012,
    0.12,
    1.24,
    0.38,
    new T.MeshBasicMaterial({ color: new T.Color(0xff7a2f).multiplyScalar(3), toneMapped: false }),
    backpack,
  );
  tube(
    [
      [-0.08, 1.66, 0.23],
      [-0.07, 1.72, 0.23],
      [0.07, 1.72, 0.23],
      [0.08, 1.66, 0.23],
    ],
    0.016,
    leather,
    backpack,
  );
  for (const side of [-1, 1]) {
    tube(
      [
        [side * 0.15, 1.1, 0.2],
        [side * 0.21, 1.38, -0.18],
        [side * 0.23, 1.68, -0.1],
        [side * 0.18, 1.69, 0.24],
      ],
      0.027,
      leather,
    );
    box(0.037, 0.045, 0.014, side * 0.205, 1.36, -0.206, metal);
    tube(
      [
        [side * 0.16, 1.2, 0.346],
        [side * 0.17, 1.55, 0.335],
      ],
      0.003,
      seam,
      backpack,
    );
  }
  const arms = [],
    legs = [];
  for (const side of [-1, 1]) {
    const upper = new T.Group();
    upper.position.set(side * 0.31, 1.64, 0);
    chest.add(upper);
    ellipsoid(0, -0.16, 0, 0.087, 0.23, 0.095, cloth, upper);
    const fore = new T.Group();
    fore.position.y = -0.33;
    upper.add(fore);
    ellipsoid(0, -0.15, 0, 0.068, 0.19, 0.072, cloth, fore);
    mesh(new T.CylinderGeometry(0.068, 0.061, 0.055, 16), cuffs, 0, -0.3, 0, fore);
    ellipsoid(0, -0.38, -0.003, 0.052, 0.09, 0.037, skin, fore);
    ellipsoid(-side * 0.042, -0.36, -0.02, 0.022, 0.047, 0.025, skin, fore);
    if (side === -1) {
      box(0.09, 0.05, 0.085, 0, -0.31, 0, leather, fore);
      box(0.06, 0.035, 0.01, 0, -0.31, -0.048, metal, fore);
    }
    arms.push({ upper, fore, side });
    const hip = new T.Group();
    hip.position.set(side * 0.135, 1.02, 0);
    pelvis.add(hip);
    const thigh = mesh(new T.CylinderGeometry(0.115, 0.085, 0.52, 16), denim, 0, -0.26, 0, hip);
    thigh.scale.z = 0.9;
    ellipsoid(0, -0.025, 0, 0.116, 0.12, 0.108, denim, hip);
    const knee = new T.Group();
    knee.position.y = -0.52;
    hip.add(knee);
    ellipsoid(0, 0, 0, 0.085, 0.095, 0.083, denim, knee);
    const calf = mesh(new T.CylinderGeometry(0.086, 0.059, 0.5, 16), denim, 0, -0.25, 0, knee);
    calf.scale.z = 0.95;
    tube(
      [
        [side * 0.087, -0.02, 0],
        [side * 0.07, -0.25, 0],
        [side * 0.058, -0.47, 0],
      ],
      0.003,
      seam,
      knee,
    );
    const foot = new T.Group();
    foot.position.y = -0.5;
    knee.add(foot);
    box(0.16, 0.105, 0.31, 0, 0.01, -0.068, shoes, foot);
    box(0.169, 0.04, 0.32, 0, -0.045, -0.068, rubber, foot);
    for (let j = 0; j < 3; j++) box(0.09, 0.008, 0.014, 0, 0.068, -0.04 - j * 0.034, rubber, foot);
    legs.push({ hip, knee, foot, side });
  }
  // Foot placement uses actual travelled distance. A two-bone solve preserves floor contact.
  let distance = 0,
    blend = 0;
  return {
    root,
    update(dt, speed, time, paused, look = 0) {
      const velocity = Math.abs(speed),
        moving = paused ? 0 : Math.min(1, velocity / 0.7);
      blend = T.MathUtils.damp(blend, moving, 9, dt);
      distance += paused ? 0 : velocity * dt;
      const cycle = (distance / 1.2) % 1,
        phase = cycle * Math.PI * 2,
        bob = 0.016 * Math.cos(phase * 2) * blend;
      pelvis.position.y = bob;
      pelvis.rotation.z = Math.sin(phase) * 0.018 * blend;
      legs.forEach((leg, i) => {
        const p = (cycle + i * 0.5) % 1,
          stance = 0.62;
        let z, lift;
        if (p < stance) {
          z = T.MathUtils.lerp(-0.372, 0.372, p / stance);
          lift = 0;
        } else {
          const u = (p - stance) / (1 - stance);
          z = T.MathUtils.lerp(0.372, -0.372, u * u * (3 - 2 * u));
          lift = Math.sin(u * Math.PI) * 0.16;
        }
        z *= blend;
        lift *= blend;
        const y = 0.067 + lift - (1.02 + bob),
          a = 0.52,
          b = 0.5,
          d = T.MathUtils.clamp(Math.hypot(y, z), 0.02, a + b - 0.001),
          alpha = Math.atan2(-z, -y),
          bend = Math.acos(T.MathUtils.clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1));
        leg.hip.rotation.x = alpha + bend;
        leg.knee.rotation.x = -Math.acos(
          T.MathUtils.clamp((d * d - a * a - b * b) / (2 * a * b), -1, 1),
        );
        leg.foot.rotation.x = -leg.hip.rotation.x - leg.knee.rotation.x;
      });
      arms.forEach((arm, i) => {
        arm.upper.rotation.x = -Math.sin(phase + i * Math.PI) * 0.3 * blend - 0.055;
        arm.upper.rotation.z = arm.side * 0.055;
        arm.fore.rotation.x = -0.13 - Math.max(0, Math.sin(phase + i * Math.PI)) * 0.13 * blend;
      });
      chest.rotation.y = Math.sin(phase) * 0.045 * blend;
      chest.rotation.x = 0.035 * blend;
      backpack.rotation.x = Math.sin(phase * 2) * 0.012 * blend;
      torso.scale.y = paused ? 1 : 1 + Math.sin(time * 1.6) * 0.006 * (1 - blend);
      head.rotation.y = T.MathUtils.damp(head.rotation.y, look, 4, dt);
    },
  };
}
