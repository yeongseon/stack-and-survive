import { useCallback, useRef, useState } from 'react';
import { challengeLadder } from '@stack-and-survive/scenarios/ladder';
import type { View } from './controller';
import { emptyProgress, parseProgress, progressKey, recordCompletion, unlockedLevel, type LadderProgress } from './ladder-progress';

export function useChallengeLadder() {
  const [progress, setProgress] = useState(() => {
    try { return parseProgress(localStorage.getItem(progressKey)); } catch { return emptyProgress(); }
  });
  const current = useRef(progress);
  const [selected, setSelected] = useState(0);
  const [generation, setGeneration] = useState(0);
  const [message, setMessage] = useState('');
  const save = useCallback((next: LadderProgress) => {
    current.current = next; setProgress(next);
    try { localStorage.setItem(progressKey, JSON.stringify(next)); setMessage(''); }
    catch { setMessage('Progress could not be saved. This session remains playable.'); }
  }, []);
  const complete = useCallback((result: NonNullable<View['result']>) => {
    const next = recordCompletion(current.current, result);
    if (next.completed.length !== current.current.completed.length) save(next);
  }, [save]);
  const select = (index: number) => {
    if (Number.isInteger(index) && index >= 0 && index <= unlockedLevel(current.current) && index < challengeLadder.length) {
      setSelected(index); setGeneration(n => n + 1);
    }
  };
  return { progress, selected, generation, message, select, complete,
    reset: () => { save(emptyProgress()); setSelected(0); setGeneration(n => n + 1); },
  };
}
