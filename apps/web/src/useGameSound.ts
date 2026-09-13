import { useEffect, useRef, useState } from 'react';
import type { Controller } from './controller';
import { GameSound, parseSoundSettings, soundSettingsKey, type SoundSettings } from './game-sound';
import { createSynthSound } from './synth-sound';

export function useGameSound(controller: Controller) {
  const [message, setMessage] = useState('Sound is off by default. Enable it with a user action.');
  const [settings, setSettings] = useState<SoundSettings>(() => {
    try { return parseSoundSettings(localStorage.getItem(soundSettingsKey)); }
    catch { return parseSoundSettings(null); }
  });
  const engine = useRef<GameSound | null>(null);
  const latestSettings = useRef(settings);
  const hapticsAvailable = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
  useEffect(() => {
    let mounted = true;
    const report = (message: string) => { if (mounted) setMessage(message); };
    const sound = new GameSound(controller.getSnapshot(), latestSettings.current, () => createSynthSound(report),
      () => performance.now(), report, hapticsAvailable ? duration => { if (!navigator.vibrate(duration) && duration > 0) report('Vibration was declined by this browser. Visual feedback remains enabled.'); } : undefined);
    engine.current = sound;
    const unsubscribe = controller.subscribe(() => sound.update(controller.getSnapshot()));
    const visibility = () => sound.setVisible(document.visibilityState === 'visible');
    visibility(); document.addEventListener('visibilitychange', visibility);
    return () => { mounted = false; unsubscribe(); document.removeEventListener('visibilitychange', visibility); sound.dispose(); engine.current = null; };
  }, [controller, hapticsAvailable]);
  const change = (next: SoundSettings) => {
    latestSettings.current = next; setSettings(next); engine.current?.setSettings(next);
    try { localStorage.setItem(soundSettingsKey, JSON.stringify({ version: 1, ...next })); }
    catch { setMessage('Sound preference could not be saved; the current session still works.'); }
  };
  return { settings, message, hapticsAvailable,
    unlock: () => { void engine.current?.unlockFromGesture(); },
    click: () => engine.current?.click(),
    toggle: () => { const next = { ...latestSettings.current, muted: !latestSettings.current.muted }; change(next); if (!next.muted) void engine.current?.unlockFromGesture(); else setMessage('Sound muted.'); },
    volume: (volume: number) => change({ ...latestSettings.current, volume }),
    haptics: (haptics: boolean) => { change({ ...latestSettings.current, haptics }); if (haptics) void engine.current?.unlockFromGesture(); },
  };
}
export type GameSoundControls = ReturnType<typeof useGameSound>;
