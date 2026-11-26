// Generative ambience: a slow detuned pad, plus a soft chime tuned to each station.
// Nothing plays until the visitor turns sound on.
const SCALE = [0, 3, 5, 7, 10, 12];

export function createAudio() {
  let ctx = null,
    master = null,
    on = false;
  function start() {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 520;
    filter.Q.value = 0.6;
    filter.connect(master);
    const lfo = ctx.createOscillator(),
      depth = ctx.createGain();
    lfo.frequency.value = 0.05;
    depth.gain.value = 260;
    lfo.connect(depth).connect(filter.frequency);
    lfo.start();
    [55, 82.41, 110.3, 164.81].forEach((f, i) => {
      const o = ctx.createOscillator(),
        g = ctx.createGain();
      o.type = i % 2 ? 'triangle' : 'sine';
      o.frequency.value = f;
      o.detune.value = (i - 1.5) * 6;
      g.gain.value = [0.32, 0.12, 0.1, 0.05][i];
      o.connect(g).connect(filter);
      o.start();
    });
  }
  return {
    get on() {
      return on;
    },
    toggle() {
      on = !on;
      if (on && !ctx) start();
      if (!ctx) return on;
      if (on) ctx.resume();
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(on ? 0.16 : 0, ctx.currentTime, 0.6);
      return on;
    },
    chime(station) {
      if (!on || !ctx) return;
      const t = ctx.currentTime,
        f = 440 * 2 ** (SCALE[station % SCALE.length] / 12);
      for (const [mult, level] of [
        [1, 0.05],
        [2, 0.018],
      ]) {
        const o = ctx.createOscillator(),
          g = ctx.createGain();
        o.frequency.value = f * mult;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(level, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
        o.connect(g).connect(ctx.destination);
        o.start(t);
        o.stop(t + 2.5);
      }
    },
  };
}
