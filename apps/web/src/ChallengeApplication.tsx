import { challengeLadder } from '@stack-and-survive/scenarios/ladder';
import { TycoonGame } from './TycoonGame';
import { useChallengeLadder } from './useChallengeLadder';
import { unlockedLevel } from './ladder-progress';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Architecture } from '@stack-and-survive/schema';
import type { View } from './controller';
import { useRunHistory } from './useRunHistory';
import { RunHistoryPanel } from './RunHistoryPanel';
import { useLeaderboard } from './useLeaderboard';
import { LeaderboardPanel } from './LeaderboardPanel';
import { qualifiesForLeaderboard, type RankResult } from './leaderboard';
import { summarizeRun, type RunSummary } from './run-history';
import { useGlobalLeaderboard } from './useGlobalLeaderboard';
import { PlayerNameControl } from './PlayerNameControl';
import { objectiveSummary } from './mission-brief';

export function ChallengeApplication() {
  const ladder = useChallengeLadder();
  const records = useRunHistory();
  const leaderboard = useLeaderboard();
  const global = useGlobalLeaderboard();
  const [currentRank, setCurrentRank] = useState<RankResult | null>(null);
  const [currentRun, setCurrentRun] = useState<RunSummary | null>(null);
  const submittedRef = useRef<string | null>(null);
  const selected = challengeLadder[ladder.selected];

  // Fetch global Top 10 when challenge changes or on mount
  useEffect(() => {
    global.fetchTop(selected.challenge);
    global.clearRun();
  }, [selected.challenge.contentHash]);

  const complete = useCallback((result: NonNullable<View['result']>, architecture: Architecture) => {
    ladder.complete(result); records.complete(result, architecture);
    try {
      const run = summarizeRun(result, architecture, crypto.randomUUID());
      setCurrentRun(run);
      setCurrentRank(null);
      submittedRef.current = null;
      // Fetch latest global Top 10 on result
      global.clearRun();
      global.fetchTop(run.challenge);
      if (leaderboard.hasValidNickname && qualifiesForLeaderboard(run)) {
        const rank = leaderboard.submit(run);
        setCurrentRank(rank);
        submittedRef.current = run.id;
        global.submitGlobal(leaderboard.nickname, run.challenge, run.actions, run.id);
      }
    } catch { setCurrentRun(null); }
  }, [ladder.complete, records.complete, leaderboard, global]);

  const submitCurrent = useCallback((nicknameOverride?: string) => {
    if (!currentRun || submittedRef.current === currentRun.id) return;
    const rank = leaderboard.submit(currentRun, nicknameOverride);
    setCurrentRank(rank);
    if (rank) {
      submittedRef.current = currentRun.id;
      const name = nicknameOverride ?? leaderboard.nickname;
      if (name) global.submitGlobal(name, currentRun.challenge, currentRun.actions, currentRun.id);
    }
  }, [currentRun, leaderboard, global]);

  const nextAvailable = ladder.selected + 1 < challengeLadder.length && unlockedLevel(ladder.progress) > ladder.selected;
  const recordPanel = <RunHistoryPanel history={records.history} challenge={selected.challenge} message={records.message} clear={records.clear} retrySave={records.retrySave} needsSave={records.needsSave} />;
  const qualified = currentRun ? qualifiesForLeaderboard(currentRun) : false;
  const scenarioName = selected.challenge.workload.id === 'black-friday' ? 'Black Friday' : selected.challenge.workload.id;

  // Only show global entries if they match the current challenge
  const matchingGlobal = global.challengeHash === selected.challenge.contentHash;
  const leaderboardPanel = <LeaderboardPanel
    key={currentRun?.id ?? 'no-run'}
    entries={leaderboard.getEntries(selected.challenge)}
    currentRank={currentRank}
    nickname={leaderboard.nickname}
    hasValidNickname={leaderboard.hasValidNickname}
    onNicknameChange={leaderboard.setNickname}
    onSubmit={submitCurrent}
    personalBest={leaderboard.getBest(selected.challenge)}
    qualified={qualified}
    globalAvailable={matchingGlobal && global.available}
    globalEntries={matchingGlobal ? global.globalEntries : null}
    globalRankContext={matchingGlobal ? global.globalRankContext : null}
    globalLoading={global.loading}
    hasPending={global.hasPending}
    onRetry={global.retryPending}
    challengeName={scenarioName}
    score={currentRun?.score}
    availability={currentRun?.availability}
  />;
  return <TycoonGame key={`${selected.challenge.id}:${ladder.generation}`} challenge={selected.challenge} onResult={complete}
    runReport={records.report}
    nextLevel={nextAvailable ? () => ladder.select(ladder.selected + 1) : undefined}
    leaderboardContent={leaderboardPanel}
    resultContent={<details className="result-records"><summary>Run records &amp; personal best</summary>{recordPanel}</details>}
    titleContent={<section className="challenge-select" aria-label="Challenge selection">
      <label>Challenge<select aria-label="Challenge level" value={ladder.selected} onChange={e => ladder.select(Number(e.currentTarget.value))}>
        {challengeLadder.map((level, index) => <option key={level.challenge.id} value={index} disabled={index > unlockedLevel(ladder.progress)}>{index + 1}. {level.title} — {objectiveSummary(level.challenge)}{index > unlockedLevel(ladder.progress) ? ' — locked' : ladder.progress.completed.includes(level.challenge.canonical) ? ' — complete' : ''}</option>)}
      </select></label><p>{objectiveSummary(selected.challenge)}</p>
      <small className="ladder-explainer">Same {scenarioName} workload. Higher service objective.</small>
      <PlayerNameControl nickname={leaderboard.nickname} onSave={leaderboard.setNickname} optional />
      <small>Balance 0.3 · 10% sales reinvestment. Records and unlocks are separate from earlier balance versions.</small>
      {unlockedLevel(ladder.progress) !== ladder.selected && <button type="button" onClick={() => ladder.select(unlockedLevel(ladder.progress))}>Continue challenge</button>}
      {ladder.message && <p role="status">{ladder.message}</p>}
      <details><summary>Progress settings</summary><button type="button" onClick={ladder.reset}>Reset challenge progress</button></details>
      <details className="title-records"><summary>Run history</summary>{recordPanel}</details>
    </section>} />;
}
