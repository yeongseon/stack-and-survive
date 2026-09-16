import { useCallback, useEffect, useRef, useState } from 'react';
import { submitToGlobal, fetchGlobalTop, type GlobalEntry, type GlobalRankContext } from './global-leaderboard';
import type { Challenge } from '@stack-and-survive/scenarios/challenge';
import type { Action } from '@stack-and-survive/simulation/runtime';

export type GlobalState = {
  available: boolean;
  loading: boolean;
  challengeHash: string | null;
  globalEntries: GlobalEntry[] | null;
  globalRankContext: GlobalRankContext | null;
  submitGlobal: (nickname: string, challenge: Challenge, actions: Action[], clientRunId: string) => void;
  fetchTop: (challenge: Challenge) => void;
  clearRun: () => void;
};

export function useGlobalLeaderboard(): GlobalState {
  const [globalEntries, setGlobalEntries] = useState<GlobalEntry[] | null>(null);
  const [globalRankContext, setGlobalRankContext] = useState<GlobalRankContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [available, setAvailable] = useState(false);
  const [challengeHash, setChallengeHash] = useState<string | null>(null);
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);

  const submitGlobal = useCallback((nickname: string, challenge: Challenge, actions: Action[], clientRunId: string) => {
    setLoading(true);
    setChallengeHash(challenge.contentHash);
    submitToGlobal(nickname, challenge, actions, clientRunId).then(result => {
      if (!mounted.current) return;
      setLoading(false);
      if (result) {
        setAvailable(true);
        setGlobalRankContext(result.rankContext);
        setGlobalEntries(result.top);
      }
    });
  }, []);

  const fetchTop = useCallback((challenge: Challenge) => {
    setChallengeHash(challenge.contentHash);
    fetchGlobalTop(challenge).then(entries => {
      if (!mounted.current) return;
      if (entries !== null) {
        setAvailable(true);
        setGlobalEntries(entries);
      }
    });
  }, []);

  const clearRun = useCallback(() => {
    setGlobalRankContext(null);
  }, []);

  return { available, loading, challengeHash, globalEntries, globalRankContext, submitGlobal, fetchTop, clearRun };
}
