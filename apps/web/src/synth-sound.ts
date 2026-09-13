import type { SoundCue, SoundPort } from './game-sound';

const notes: Record<SoundCue, number[]> = {
  click: [520], build: [220, 330], complete: [440, 660], warning: [180, 160],
  cache: [740], filter: [260], success: [440, 550, 660], failure: [240, 180, 120],
};
export function createSynthSound(report: (message: string) => void): SoundPort {
  if (typeof AudioContext === 'undefined') throw new Error('Web Audio unavailable');
  const context = new AudioContext();
  const master = context.createGain(); master.gain.value = 0; master.connect(context.destination);
  const voices = new Set<OscillatorNode>();
  let hum: OscillatorNode | null = null;
  let closed = false;
  const stopHum = () => { if (hum) { const node = hum; hum = null; node.stop(); } };
  const silence = () => { stopHum(); for (const node of voices) { node.stop(); voices.delete(node); } };
  return {
    resume: () => context.resume(),
    volume(value) { if (!closed) master.gain.setTargetAtTime(Math.max(0, Math.min(1, value)), context.currentTime, .025); },
    ambient(enabled) {
      if (!enabled || closed || context.state !== 'running') { stopHum(); return; }
      if (hum) return;
      if (voices.size >= 8) return;
      const node = context.createOscillator(), gain = context.createGain();
      node.frequency.value = 72; gain.gain.value = .012;
      node.connect(gain); gain.connect(master); node.onended = () => { node.disconnect(); gain.disconnect(); };
      hum = node; node.start();
    },
    play(cue) {
      if (closed || context.state !== 'running') return;
      if (cue === 'success' || cue === 'failure') silence();
      if (voices.size + (hum ? 1 : 0) + notes[cue].length > 8) return;
      notes[cue].forEach((frequency, index) => {
        const node = context.createOscillator(), gain = context.createGain();
        node.type = cue === 'warning' || cue === 'failure' ? 'triangle' : 'sine';
        node.frequency.value = frequency;
        const time = context.currentTime + index * .09;
        gain.gain.setValueAtTime(0, time); gain.gain.linearRampToValueAtTime(.09, time + .012);
        gain.gain.exponentialRampToValueAtTime(.0001, time + .14);
        node.connect(gain); gain.connect(master); voices.add(node);
        node.onended = () => { voices.delete(node); node.disconnect(); gain.disconnect(); };
        node.start(time); node.stop(time + .16);
      });
    },
    silence,
    dispose() {
      if (closed) return; closed = true; silence(); master.disconnect();
      void context.close().catch(() => report('Audio device cleanup failed; sound remains disabled.'));
    },
  };
}
