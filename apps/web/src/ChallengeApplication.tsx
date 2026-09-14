import { challengeLadder } from '@stack-and-survive/scenarios/ladder';
import { TycoonGame } from './TycoonGame';
import { useChallengeLadder } from './useChallengeLadder';
import { unlockedLevel } from './ladder-progress';
import { useCallback } from 'react';
import type { Architecture } from '@stack-and-survive/schema';
import type { View } from './controller';
import { useRunHistory } from './useRunHistory';
import { RunHistoryPanel } from './RunHistoryPanel';

export function ChallengeApplication() {
  const ladder = useChallengeLadder();
  const records = useRunHistory();
  const complete = useCallback((result: NonNullable<View['result']>, architecture: Architecture) => {
    ladder.complete(result); records.complete(result, architecture);
  }, [ladder.complete, records.complete]);
  const selected = challengeLadder[ladder.selected];
  const nextAvailable = ladder.selected + 1 < challengeLadder.length && unlockedLevel(ladder.progress) > ladder.selected;
  const recordPanel = <RunHistoryPanel history={records.history} challenge={selected.challenge} message={records.message} clear={records.clear} retrySave={records.retrySave} needsSave={records.needsSave} />;
  return <TycoonGame key={`${selected.challenge.id}:${ladder.generation}`} challenge={selected.challenge} onResult={complete}
    runReport={records.report}
    nextLevel={nextAvailable ? () => ladder.select(ladder.selected + 1) : undefined}
    resultContent={<details className="result-records"><summary>Run records &amp; personal best</summary>{recordPanel}</details>}
    titleContent={<section className="challenge-select" aria-label="Challenge selection">
      <label>Challenge<select aria-label="Challenge level" value={ladder.selected} onChange={e => ladder.select(Number(e.currentTarget.value))}>
        {challengeLadder.map((level, index) => <option key={level.challenge.id} value={index} disabled={index > unlockedLevel(ladder.progress)}>{index + 1}. {level.title}{index > unlockedLevel(ladder.progress) ? ' — locked' : ladder.progress.completed.includes(level.challenge.canonical) ? ' — complete' : ''}</option>)}
      </select></label><p>{selected.description}</p>
      {unlockedLevel(ladder.progress) !== ladder.selected && <button type="button" onClick={() => ladder.select(unlockedLevel(ladder.progress))}>Continue challenge</button>}
      {ladder.message && <p role="status">{ladder.message}</p>}
      <details><summary>Progress settings</summary><button type="button" onClick={ladder.reset}>Reset challenge progress</button></details>
      <details className="title-records"><summary>Run history</summary>{recordPanel}</details>
    </section>} />;
}
