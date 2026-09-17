import { useCallback, useEffect, useRef, useState } from 'react';
import { globalLeaderboardConfigured, submitToGlobal, fetchGlobalTop, savePendingSubmission, loadPendingSubmission, clearPendingSubmission, type GlobalEntry, type GlobalRankContext, type PendingSubmission } from './global-leaderboard';
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
  const boardRequest = useRef(0);
  const submissionRequest = useRef(0);
  const activeSubmission = useRef(false);
  const selectedHash = useRef<string | null>(null);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  const doSubmit = useCallback((pending: PendingSubmission, challenge: Challenge) => {
    if (!globalLeaderboardConfigured || activeSubmission.current) return;
    const request = ++submissionRequest.current;
    ++boardRequest.current;
    activeSubmission.current = true;
    setLoading(true);
    setGlobalRankContext(null);
    savePendingSubmission(pending);
    setHasPending(true);
    submitToGlobal(pending.nickname, challenge, pending.actions, pending.clientRunId).then(result => {
      const saved = loadPendingSubmission();
      const samePending = saved?.clientRunId === pending.clientRunId && saved.challengeContentHash === pending.challengeContentHash
        && saved.nickname === pending.nickname && JSON.stringify(saved.actions) === JSON.stringify(pending.actions);
      if (result && samePending) {
        clearPendingSubmission();
        if (mounted.current) setHasPending(false);
      }
      if (!mounted.current || request !== submissionRequest.current) return;
      activeSubmission.current = false;
      setLoading(false);
      if (result) {
        if (selectedHash.current === challenge.contentHash) {
          ++boardRequest.current;
          setAvailable(true);
          setGlobalRankContext(result.rankContext);
          setGlobalEntries(result.top);
        }
        setHasPending(!!loadPendingSubmission());
      } else {
        // Server failed — save for retry
        savePendingSubmission(pending);
        setHasPending(true);
        if (selectedHash.current === challenge.contentHash) {
          setAvailable(false);
          setGlobalEntries(null);
        }
      }
    }).catch(() => { if (mounted.current) setLoading(false); });
  }, []);

  const submitGlobal = useCallback((nickname: string, challenge: Challenge, actions: Action[], clientRunId: string) => {
    const pending: PendingSubmission = { nickname, challengeContentHash: challenge.contentHash, clientRunId, actions };
    doSubmit(pending, challenge);
  }, [doSubmit]);

  const retryPending = useCallback(() => {
    if (!globalLeaderboardConfigured) return;
    const pending = loadPendingSubmission();
    if (!pending) return;
    // We need to find the challenge — import supported challenges
    import('@stack-and-survive/scenarios/ladder').then(({ challengeLadder }) => {
      if (!mounted.current) return;
      const challenge = challengeLadder.find(l => l.challenge.contentHash === pending.challengeContentHash)?.challenge;
      if (challenge) doSubmit(pending, challenge);
      else { clearPendingSubmission(); setHasPending(false); }
    }).catch(() => { /* dynamic import failed — retry later */ });
  }, [doSubmit]);

  const fetchTop = useCallback((challenge: Challenge) => {
    const request = ++boardRequest.current;
    if (selectedHash.current !== challenge.contentHash) setGlobalRankContext(null);
    selectedHash.current = challenge.contentHash;
    setChallengeHash(challenge.contentHash);
    setAvailable(false);
    setGlobalEntries(null);
    fetchGlobalTop(challenge).then(entries => {
      if (!mounted.current || request !== boardRequest.current) return;
      if (entries !== null) {
        setAvailable(true);
        setGlobalEntries(entries);
      }
    }).catch(() => { /* fetch failed gracefully */ });
  }, []);

  const clearRun = useCallback(() => {
    ++submissionRequest.current;
    activeSubmission.current = false;
    setLoading(false);
    setGlobalRankContext(null);
  }, []);

  return { available, loading, challengeHash, globalEntries, globalRankContext, hasPending, submitGlobal, retryPending, fetchTop, clearRun };
}
