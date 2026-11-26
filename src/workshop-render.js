import * as T from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// Film finish applied after tone mapping: split-tone grade (cool shadows, warm highlights),
// lens vignette, faint chromatic fringe and animated grain.
const FinishShader = {
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
    grain: { value: 0.045 },
    fringe: { value: 0.0016 },
  },
  vertexShader:
    'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader: `
    uniform sampler2D tDiffuse;uniform float time,grain,fringe;varying vec2 vUv;
    float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
    void main(){
      vec2 d=vUv-.5;float r=dot(d,d);
      vec3 c;c.r=texture2D(tDiffuse,vUv+d*fringe*r*8.).r;c.g=texture2D(tDiffuse,vUv).g;c.b=texture2D(tDiffuse,vUv-d*fringe*r*8.).b;
      float l=dot(c,vec3(.299,.587,.114));
      c*=mix(vec3(1.),vec3(.9,1.,1.08),smoothstep(.35,0.,l)*.7);
      c*=mix(vec3(1.),vec3(1.07,1.,.9),smoothstep(.35,1.,l)*.6);
      c=clamp((c-.5)*1.06+.5,0.,1.);
      c*=smoothstep(.95,.18,r*1.55);
      c+=(hash(vUv*vec2(1920.,1080.)+fract(time)*97.)-.5)*grain;
      gl_FragColor=vec4(c,1.);
    }`,
};

export function createRenderer(host, scene, camera, { small }) {
  const renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  host.append(renderer.domElement);

  // Image-based lighting gives metal, glass and lacquer real reflections instead of flat colour.
  const pmrem = new T.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.5;

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  // Shallow depth of field keeps the eye on the character and the installation.
  const bokeh = new BokehPass(scene, camera, { focus: 9, aperture: 0.00035, maxblur: 0.006 });
  composer.addPass(bokeh);
  const bloom = new UnrealBloomPass(new T.Vector2(innerWidth, innerHeight), 0.62, 0.7, 0.82);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const finish = new ShaderPass(FinishShader);
  composer.addPass(finish);

  // Quality steps down automatically when the device cannot hold a smooth frame rate.
  const levels = [
    { ratio: 1.5, bloom: true, reflections: true, depth: true },
    { ratio: 1.15, bloom: true, reflections: false, depth: false },
    { ratio: 0.85, bloom: false, reflections: false, depth: false },
  ];
  let level = small ? 1 : 0,
    frames = 0,
    elapsed = 0,
    onLevel = () => {};
  function apply() {
    const l = levels[level];
    renderer.setPixelRatio(Math.min(devicePixelRatio, l.ratio));
    bloom.enabled = l.bloom;
    bokeh.enabled = l.depth;
    composer.setSize(innerWidth, innerHeight);
    onLevel(l);
  }
  return {
    renderer,
    composer,
    get quality() {
      return levels[level];
    },
    onQuality(fn) {
      onLevel = fn;
      apply();
    },
    focus(distance) {
      const u = bokeh.uniforms.focus;
      u.value += (distance - u.value) * 0.08;
    },
    resize() {
      renderer.setSize(innerWidth, innerHeight);
      apply();
    },
    render(dt, time) {
      finish.uniforms.time.value = time;
      composer.render();
      frames++;
      elapsed += dt;
      if (elapsed > 2.5) {
        const average = elapsed / frames;
        if (average > 1 / 40 && level < levels.length - 1) {
          level++;
          apply();
        }
        frames = elapsed = 0;
      }
    },
  };
}
