import { useCallback, useEffect, useRef, useState } from 'react';
import { submitToGlobal, fetchGlobalTop, type GlobalEntry } from './global-leaderboard';
import type { Challenge } from '@stack-and-survive/scenarios/challenge';
import type { Action } from '@stack-and-survive/simulation/runtime';

export type GlobalState = {
  available: boolean;
  loading: boolean;
  globalEntries: GlobalEntry[] | null;
  globalRank: number | null;
  submitGlobal: (nickname: string, challenge: Challenge, actions: Action[]) => void;
  fetchTop: (challenge: Challenge) => void;
};

export function useGlobalLeaderboard(): GlobalState {
  const [globalEntries, setGlobalEntries] = useState<GlobalEntry[] | null>(null);
  const [globalRank, setGlobalRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [available, setAvailable] = useState(false);
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);

  const submitGlobal = useCallback((nickname: string, challenge: Challenge, actions: Action[]) => {
    setLoading(true);
    submitToGlobal(nickname, challenge, actions).then(result => {
      if (!mounted.current) return;
      setLoading(false);
      if (result) {
        setAvailable(true);
        setGlobalRank(result.rank);
        setGlobalEntries(result.top);
      }
    });
  }, []);

  const fetchTop = useCallback((challenge: Challenge) => {
    fetchGlobalTop(challenge).then(entries => {
      if (!mounted.current) return;
      if (entries) { setAvailable(true); setGlobalEntries(entries); }
    });
  }, []);

  return { available, loading, globalEntries, globalRank, submitGlobal, fetchTop };
}
