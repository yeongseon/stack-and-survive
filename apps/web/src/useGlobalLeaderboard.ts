import { useCallback, useEffect, useRef, useState } from 'react';
import { submitToGlobal, fetchGlobalTop, savePendingSubmission, loadPendingSubmission, clearPendingSubmission, type GlobalEntry, type GlobalRankContext, type PendingSubmission } from './global-leaderboard';
import type { Challenge } from '@stack-and-survive/scenarios/challenge';
import type { Action } from '@stack-and-survive/simulation/runtime';

export type GlobalState = {
  available: boolean;
  loading: boolean;
  challengeHash: string | null;
  globalEntries: GlobalEntry[] | null;
  globalRankContext: GlobalRankContext | null;
  hasPending: boolean;
  submitGlobal: (nickname: string, challenge: Challenge, actions: Action[], clientRunId: string) => void;
  retryPending: () => void;
  fetchTop: (challenge: Challenge) => void;
  clearRun: () => void;
};

export function useGlobalLeaderboard(): GlobalState {
  const [globalEntries, setGlobalEntries] = useState<GlobalEntry[] | null>(null);
  const [globalRankContext, setGlobalRankContext] = useState<GlobalRankContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [available, setAvailable] = useState(false);
  const [challengeHash, setChallengeHash] = useState<string | null>(null);
  const [hasPending, setHasPending] = useState(() => !!loadPendingSubmission());
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);

  const doSubmit = useCallback((pending: PendingSubmission, challenge: Challenge) => {
    setLoading(true);
    setChallengeHash(challenge.contentHash);
    submitToGlobal(pending.nickname, challenge, pending.actions, pending.clientRunId).then(result => {
      if (!mounted.current) return;
      setLoading(false);
      if (result) {
        setAvailable(true);
        setGlobalRankContext(result.rankContext);
        setGlobalEntries(result.top);
        clearPendingSubmission();
        setHasPending(false);
      } else {
        // Server failed — save for retry
        savePendingSubmission(pending);
        setHasPending(true);
      }
    });
  }, []);

  const submitGlobal = useCallback((nickname: string, challenge: Challenge, actions: Action[], clientRunId: string) => {
    const pending: PendingSubmission = { nickname, challengeContentHash: challenge.contentHash, clientRunId, actions };
    doSubmit(pending, challenge);
  }, [doSubmit]);

  const retryPending = useCallback(() => {
    const pending = loadPendingSubmission();
    if (!pending) return;
    // We need to find the challenge — import supported challenges
    import('@stack-and-survive/scenarios/ladder').then(({ challengeLadder }) => {
      const challenge = challengeLadder.find(l => l.challenge.contentHash === pending.challengeContentHash)?.challenge;
      if (challenge) doSubmit(pending, challenge);
      else { clearPendingSubmission(); setHasPending(false); }
    });
  }, [doSubmit]);

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

  return { available, loading, challengeHash, globalEntries, globalRankContext, hasPending, submitGlobal, retryPending, fetchTop, clearRun };
}
