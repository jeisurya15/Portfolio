import * as T from 'three';

export function createAtmosphere(scene, groups) {
  // Light shafts fall from the ceiling slit onto each plinth. Edges fade with view angle so
  // the cone reads as lit air rather than geometry.
  const shaft = new T.ShaderMaterial({
    uniforms: { tint: { value: new T.Color(0xffc9a0) }, strength: { value: 0.16 } },
    vertexShader: `varying vec3 vN;varying vec3 vV;varying float vY;
      void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);vY=uv.y;gl_Position=projectionMatrix*mv;}`,
    fragmentShader: `uniform vec3 tint;uniform float strength;varying vec3 vN;varying vec3 vV;varying float vY;
      void main(){float f=pow(abs(dot(vN,vV)),2.2);gl_FragColor=vec4(tint,f*strength*smoothstep(0.,.45,vY)*smoothstep(1.,.75,vY));}`,
    transparent: true,
    depthWrite: false,
    side: T.DoubleSide,
    blending: T.AdditiveBlending,
  });
  const pools = [];
  groups.forEach((g) => {
    const cone = new T.Mesh(new T.CylinderGeometry(0.35, 2.6, 9.6, 48, 1, true), shaft);
    cone.position.set(4.5, 5.2, -3);
    cone.renderOrder = 3;
    g.add(cone);
    // A soft pool of light where the shaft lands on the plinth.
    const pool = new T.Mesh(
      new T.CircleGeometry(2.6, 64),
      new T.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: T.AdditiveBlending,
        uniforms: { glow: { value: 0.12 } },
        vertexShader:
          'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
        fragmentShader:
          'uniform float glow;varying vec2 vUv;void main(){float d=length(vUv-.5)*2.;gl_FragColor=vec4(vec3(1.,.78,.6),smoothstep(1.,0.,d)*glow);}',
      }),
    );
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(4.5, 0.44, -3);
    g.add(pool);
    pools.push(pool);
  });

  // Warm embers rising and flickering through the hall, animated entirely on the GPU.
  const count = 3200,
    pos = new Float32Array(count * 3),
    seed = new Float32Array(count);
  const span = groups.length * 24 + 20;
  for (let i = 0; i < count; i++) {
    pos.set([(Math.random() - 0.5) * 19, Math.random() * 9.5, 12 - Math.random() * span], i * 3);
    seed[i] = Math.random();
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.BufferAttribute(pos, 3));
  geo.setAttribute('seed', new T.BufferAttribute(seed, 1));
  const dust = new T.Points(
    geo,
    new T.ShaderMaterial({
      uniforms: { time: { value: 0 }, ratio: { value: Math.min(devicePixelRatio, 1.5) } },
      transparent: true,
      depthWrite: false,
      blending: T.AdditiveBlending,
      vertexShader: `uniform float time,ratio;attribute float seed;varying float vA;
        void main(){vec3 p=position;p.y=mod(p.y+time*(.04+seed*.06),9.5);p.x+=sin(time*.3+seed*30.)*.25;
        vec4 mv=modelViewMatrix*vec4(p,1.);float d=-mv.z;vA=smoothstep(28.,6.,d)*smoothstep(2.5,5.,d)*(.25+seed*.75);
        gl_PointSize=min(ratio*(2.+seed*seed*9.)*6./d,14.*ratio);vA*=.55+.45*sin(time*(1.5+seed*4.)+seed*60.);gl_Position=projectionMatrix*mv;}`,
      fragmentShader: `varying float vA;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(mix(vec3(1.,.55,.25),vec3(1.,.9,.75),vA)*1.6,smoothstep(.5,.0,d)*vA*.7);}`,
    }),
  );
  dust.frustumCulled = false;
  scene.add(dust);

  // A soft contact shadow anchors the character even outside the shadow camera.
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d'),
    gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(0,0,0,.75)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  const shadow = new T.Mesh(
    new T.PlaneGeometry(1.4, 1.4),
    new T.MeshBasicMaterial({ map: new T.CanvasTexture(c), transparent: true, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  scene.add(shadow);

  return {
    update(t, dt, position, active, focus, paused) {
      shadow.position.set(position.x, 0.004, position.z);
      if (!paused) dust.material.uniforms.time.value = t;
      pools.forEach((p, i) => {
        const u = p.material.uniforms.glow;
        u.value = T.MathUtils.damp(u.value, i === active ? 0.22 + focus * 0.08 : 0.08, 3, dt);
      });
    },
  };
}
