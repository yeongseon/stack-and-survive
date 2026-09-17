import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createController } from '../../src/controller';
import { summarizeRun } from '../../src/run-history';
import { useLeaderboard } from '../../src/useLeaderboard';
import { useGlobalLeaderboard } from '../../src/useGlobalLeaderboard';
import { qualifiesForLeaderboard, type RankResult } from '../../src/leaderboard';
import { PlayerNameControl } from '../../src/PlayerNameControl';
import { LeaderboardPanel } from '../../src/LeaderboardPanel';
import '../../src/style.css';
import '../../src/player-console.css';

const controller = createController({ start: () => () => {} }, undefined, true);
const failed = new URL(location.href).searchParams.has('failed');
controller.start();
if (!failed) {
  controller.queueAction({ type: 'DEPLOY_RESOURCE', kind: 'cache', x: 0, y: 0 });
  controller.queueAction({ type: 'DEPLOY_RESOURCE', kind: 'edge', x: 0, y: 0 });
  controller.queueAction({ type: 'SCALE_OUT' });
  for (let i = 0; i < 10; i++) controller.inspectNextTick();
  controller.queueAction({ type: 'SCALE_OUT' });
}
while (!controller.getSnapshot().result) controller.inspectNextTick();
const view = controller.getSnapshot();
const run = summarizeRun(view.result!, view.state.runtime.architecture, 'identity-fixture');
controller.destroy();

function IdentityFixture() {
  const board = useLeaderboard(), global = useGlobalLeaderboard();
  const { fetchTop } = global;
  const [result, setResult] = useState(false), [rank, setRank] = useState<RankResult | null>(null);
  const submitted = useRef(false);
  useEffect(() => { fetchTop(run.challenge); }, [fetchTop]);
  const submit = (name?: string) => {
    if (submitted.current) return;
    const next = board.submit(run, name);
    if (!next) return;
    submitted.current = true; setRank(next);
    global.submitGlobal(name ?? board.nickname, run.challenge, run.actions, run.id);
  };
  const showResult = () => {
    setResult(true);
    if (board.hasValidNickname && !new URL(location.href).searchParams.has('manual')) submit();
  };
  return <main className="tycoon-game" style={{ padding: 24, minHeight: '100vh' }}>
    <p>ISOLATED TEST FIXTURE — not gameplay evidence</p>
    {!result ? <><PlayerNameControl nickname={board.nickname} onSave={board.setNickname} optional /><button type="button" onClick={showResult}>Show actual engine result</button></> : <>
      <h2>Score {run.score}</h2>
      <LeaderboardPanel qualified={qualifiesForLeaderboard(run)} entries={board.getEntries(run.challenge)} currentRank={rank} nickname={board.nickname}
        hasValidNickname={board.hasValidNickname} onNicknameChange={board.setNickname} onSubmit={submit} personalBest={board.getBest(run.challenge)}
        globalAvailable={global.available} globalEntries={global.globalEntries} globalRankContext={global.globalRankContext} globalLoading={global.loading}
        hasPending={global.hasPending} onRetry={global.retryPending} score={run.score} availability={run.availability} />
    </>}
  </main>;
}
createRoot(document.getElementById('root')!).render(<IdentityFixture />);
