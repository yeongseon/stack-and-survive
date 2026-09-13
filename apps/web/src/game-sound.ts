import type { View } from './controller';

export type SoundCue = 'click' | 'build' | 'complete' | 'warning' | 'filter' | 'cache' | 'success' | 'failure';
export type SoundSettings = { muted: boolean; volume: number; haptics: boolean };
export const defaultSoundSettings: SoundSettings = { muted: true, volume: .35, haptics: false };
export const soundSettingsKey = 'stack-and-survive.sound.v1';
export function parseSoundSettings(raw: string | null): SoundSettings {
  if (!raw) return { ...defaultSoundSettings };
  try {
    const data = JSON.parse(raw);
    if (data?.version !== 1 || typeof data.muted !== 'boolean' || typeof data.haptics !== 'boolean'
      || typeof data.volume !== 'number' || !Number.isFinite(data.volume) || data.volume < 0 || data.volume > 1) return { ...defaultSoundSettings };
    return { muted: data.muted, volume: data.volume, haptics: data.haptics };
  } catch { return { ...defaultSoundSettings }; }
}

export function transitionSound(previous: View, next: View): SoundCue | null {
  if (next.error) return null;
  const before = previous.state.runtime, after = next.state.runtime;
  if (after.status === 'FAILED' && before.status !== 'FAILED') return 'failure';
  if (after.status === 'COMPLETED' && before.status !== 'COMPLETED') return 'success';
  if (after.status !== 'RUNNING') return null;
  if (after.architecture.resources.some(resource => {
    const old = before.architecture.resources.find(r => r.id === resource.id);
    return old && (resource.instances > old.instances || old.remaining > 0 && resource.remaining === 0);
  })) return 'complete';
  if (before.scaleDue === null && after.scaleDue !== null || after.architecture.resources.some(r => !before.architecture.resources.some(old => old.id === r.id))) return 'build';
  const old = previous.snapshot?.requests, current = next.snapshot?.requests;
  if (!current || previous.snapshot === next.snapshot || before.status !== 'RUNNING') return null;
  if (next.snapshot?.critical && !previous.snapshot?.critical) return 'warning';
  if (current.edge.filtered.bot > 0 && (!old || old.edge.filtered.bot === 0)) return 'filter';
  if (current.cache.hits > 0 && (!old || old.cache.hits === 0)) return 'cache';
  return null;
}

export interface SoundPort {
  resume(): Promise<void>;
  volume(value: number): void;
  ambient(enabled: boolean): void;
  play(cue: SoundCue): void;
  silence(): void;
  dispose(): void;
}

export class GameSound {
  private port: SoundPort | null = null;
  private previous: View;
  private armed = false;
  private visible = true;
  private disposed = false;
  private generation = 0;
  private unlocking = false;
  private ready = false;
  private lastCues = new Map<SoundCue, number>();
  private hapticsFailed = false;
  settings: SoundSettings;
  constructor(initial: View, settings: SoundSettings, private create: () => SoundPort, private now: () => number,
    private report: (message: string) => void, private vibrate?: (duration: number) => void) {
    this.previous = initial; this.settings = { ...settings };
  }
  async unlockFromGesture() {
    if (this.disposed || this.unlocking || this.settings.muted && !this.settings.haptics) return;
    this.armed = true;
    if (this.settings.muted) return;
    const generation = ++this.generation;
    this.unlocking = true;
    try {
      this.port ??= this.create();
      const port = this.port;
      await port.resume();
      if (this.disposed || generation !== this.generation || this.port !== port) return;
      this.ready = true;
      this.syncAmbient();
      if (this.port && !this.settings.muted) this.report('Sound enabled.');
    } catch {
      if (!this.disposed && generation === this.generation) this.audioFailed();
    } finally { this.unlocking = false; }
  }
  private audioFailed() {
    const port = this.port; this.port = null; this.ready = false;
    try { port?.dispose(); }
    catch { if (!this.disposed) this.report('Audio cleanup failed; sound has been detached.'); }
    if (!this.disposed) this.report('Sound is unavailable. All game controls and visual cues remain available. Toggle sound to retry.');
  }
  private usePort(operation: (port: SoundPort) => void) {
    if (!this.port || this.disposed) return;
    try { operation(this.port); } catch { this.audioFailed(); }
  }
  private vibration(duration: number) {
    if (!this.vibrate || this.hapticsFailed) return;
    try { this.vibrate(duration); }
    catch {
      this.hapticsFailed = true;
      if (!this.disposed) this.report('Vibration is unavailable. Visual feedback remains enabled.');
    }
  }
  setSettings(settings: SoundSettings) {
    if (this.disposed) return;
    this.settings = parseSoundSettings(JSON.stringify({ version: 1, ...settings }));
    if (this.settings.muted || this.settings.volume === 0) this.usePort(port => port.silence());
    if (!this.settings.haptics) this.vibration(0);
    this.syncAmbient();
  }
  setVisible(visible: boolean) {
    if (this.disposed) return;
    this.visible = visible;
    if (!visible) { this.usePort(port => port.silence()); this.vibration(0); }
    else this.syncAmbient();
  }
  private syncAmbient() {
    if (!this.ready) return;
    this.usePort(port => {
      port.volume(this.settings.muted ? 0 : this.settings.volume);
      port.ambient(this.armed && this.visible && !this.settings.muted && this.settings.volume > 0
        && !this.previous.error && this.previous.state.runtime.status === 'RUNNING');
    });
  }
  private emit(cue: SoundCue) {
    if (!this.armed || !this.visible || this.disposed || this.previous.error) return;
    const now = this.now();
    const interval = cue === 'warning' ? 8000 : cue === 'cache' || cue === 'filter' ? 500 : 120;
    if (now - (this.lastCues.get(cue) ?? -Infinity) < interval) return;
    this.lastCues.set(cue, now);
    if (this.ready && !this.settings.muted && this.settings.volume > 0) this.usePort(port => port.play(cue));
    if (this.settings.haptics && ['complete', 'success', 'failure'].includes(cue)) this.vibration(cue === 'failure' ? 70 : 30);
  }
  click() { if (this.previous.state.runtime.status === 'RUNNING') this.emit('click'); }
  update(next: View) {
    if (this.disposed) return;
    const cue = transitionSound(this.previous, next);
    const previous = this.previous;
    this.previous = next;
    if (next.error && next.error !== previous.error || next.state.runtime.status !== 'RUNNING' && next.state.runtime.status !== previous.state.runtime.status) {
      this.usePort(port => port.silence()); this.vibration(0);
    }
    if (next.state.runtime.status === 'PREPARATION' && previous.state.runtime.status !== 'PREPARATION') this.lastCues.clear();
    this.syncAmbient();
    if (cue) this.emit(cue);
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true; this.generation++; this.armed = false;
    this.audioFailed(); this.vibration(0);
  }
}
