import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useGlobalLeaderboard } from '../../src/useGlobalLeaderboard';
import { challengeLadder } from '../../../../packages/scenarios/src/ladder';

function Harness() {
  const state = useGlobalLeaderboard();
  const { fetchTop, clearRun } = state;
  const [level, setLevel] = useState(0);
  useEffect(() => { fetchTop(challengeLadder[level].challenge); clearRun(); }, [level, fetchTop, clearRun]);
  return <>
    <button type="button" onClick={() => setLevel(1)}>Next challenge</button>
    <button type="button" onClick={() => state.fetchTop(challengeLadder[level].challenge)}>Refresh</button>
    <button type="button" onClick={() => state.submitGlobal('TEST', challengeLadder[level].challenge, [], 'isolated-run')}>Submit</button>
    <button type="button" onClick={state.retryPending}>Retry</button>
    <pre data-testid="state">{JSON.stringify(state)}</pre>
  </>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><Harness /></StrictMode>);
