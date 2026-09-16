import { useCallback, useMemo, useState } from 'react';
import { loadLeaderboard, saveLeaderboard, loadNickname, saveNickname, normalizeNickname, addEntry, entryFromRun, rankRun, qualifiesForLeaderboard, challengeEntries, personalBest, validateNickname, type Leaderboard } from './leaderboard';
import type { RunSummary } from './run-history';
import type { Challenge } from '@stack-and-survive/scenarios/challenge';

export function useLeaderboard() {
  const [board, setBoard] = useState<Leaderboard>(loadLeaderboard);
  const [nickname, setNicknameState] = useState(loadNickname);

  const setNickname = useCallback((name: string) => {
    const normalized = normalizeNickname(name);
    setNicknameState(normalized);
    if (!validateNickname(normalized)) saveNickname(normalized);
  }, []);

  const hasValidNickname = !validateNickname(nickname);

  const submit = useCallback((run: RunSummary) => {
    if (!qualifiesForLeaderboard(run) || !hasValidNickname) return null;
    const entry = entryFromRun(run, nickname);
    const updated = addEntry(board, entry);
    setBoard(updated);
    saveLeaderboard(updated);
    return rankRun(updated, run, nickname);
  }, [board, nickname, hasValidNickname]);

  const getRank = useCallback((run: RunSummary) => rankRun(board, run, nickname), [board, nickname]);

  const getEntries = useCallback((challenge: Challenge) => challengeEntries(board, challenge), [board]);

  const getBest = useCallback((challenge: Challenge) => personalBest(board, challenge, nickname), [board, nickname]);

  return useMemo(() => ({ board, nickname, hasValidNickname, setNickname, submit, getRank, getEntries, getBest, nicknameError: validateNickname(nickname) }), [board, nickname, hasValidNickname, setNickname, submit, getRank, getEntries, getBest]);
}
