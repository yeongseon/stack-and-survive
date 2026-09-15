import { expect, it } from 'vitest';
import { blackFridayChallenge, blackFridayChallengeV02 } from '@stack-and-survive/scenarios/challenge';
import { historyKey, parseHistory, emptyHistory } from './run-history';
import { progressKey, parseProgress, emptyProgress, recordCompletion } from './ladder-progress';
import { baseline } from '@stack-and-survive/cloud-domain';
import { simulateScenario } from '@stack-and-survive/simulation/results';

it('uses separate balance namespaces and never treats old success as current progress',()=>{
  expect(historyKey).not.toBe('stack-and-survive.history.v1');
  expect(progressKey).not.toBe('stack-and-survive.progress.v1');
  const old=JSON.stringify({version:1,completed:[blackFridayChallengeV02.canonical]});
  expect(parseProgress(old)).toEqual(emptyProgress());
  expect(parseProgress(JSON.stringify({version:1,completed:[blackFridayChallenge.canonical]})).completed).toHaveLength(1);
  const result=simulateScenario(baseline(4,true),blackFridayChallengeV02.workload);
  expect(result.status).toBe('COMPLETED');
  expect(recordCompletion(emptyProgress(),{...result,challenge:blackFridayChallengeV02,objectiveMet:true})).toEqual(emptyProgress());
});
it('rejects old rule records instead of replaying them under reinvestment',()=>{
  const raw=JSON.stringify({version:1,runs:[{id:'old',challenge:blackFridayChallengeV02}],bests:[],highestLevel:0});
  expect(parseHistory(raw)).toEqual(emptyHistory());
});
