import { challengeLadder } from '@stack-and-survive/scenarios/ladder';
import { TycoonGame } from './TycoonGame';
import { useChallengeLadder } from './useChallengeLadder';
import { unlockedLevel } from './ladder-progress';

export function ChallengeApplication() {
  const ladder = useChallengeLadder();
  const selected = challengeLadder[ladder.selected];
  const nextAvailable = ladder.selected + 1 < challengeLadder.length && unlockedLevel(ladder.progress) > ladder.selected;
  return <TycoonGame key={`${selected.challenge.id}:${ladder.generation}`} challenge={selected.challenge} onResult={ladder.complete}
    nextLevel={nextAvailable ? () => ladder.select(ladder.selected + 1) : undefined}
    titleContent={<section className="challenge-select" aria-label="Challenge selection">
      <label>Challenge<select aria-label="Challenge level" value={ladder.selected} onChange={e => ladder.select(Number(e.currentTarget.value))}>
        {challengeLadder.map((level, index) => <option key={level.challenge.id} value={index} disabled={index > unlockedLevel(ladder.progress)}>{index + 1}. {level.title}{index > unlockedLevel(ladder.progress) ? ' — locked' : ladder.progress.completed.includes(level.challenge.canonical) ? ' — complete' : ''}</option>)}
      </select></label><p>{selected.description}</p>
      {unlockedLevel(ladder.progress) !== ladder.selected && <button type="button" onClick={() => ladder.select(unlockedLevel(ladder.progress))}>Continue challenge</button>}
      {ladder.message && <p role="status">{ladder.message}</p>}
      <details><summary>Progress settings</summary><button type="button" onClick={ladder.reset}>Reset challenge progress</button></details>
    </section>} />;
}
