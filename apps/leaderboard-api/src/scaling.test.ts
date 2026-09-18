import { expect, it } from 'vitest';
import { infrastructureScalingChallenge, blackFridayChallengeV03 } from '@stack-and-survive/scenarios/challenge';
import { handleSubmit } from './handler';
import { InMemoryStorage } from './storage';
import { parseAction } from '@stack-and-survive/simulation/runtime';
it('verifies new scaling actions using server replay rather than client score', async () => {
  const storage = new InMemoryStorage();
  const actions = [
    {type:'SCALE_UP_APP',time:0,sequence:0},
    {type:'DEPLOY_RESOURCE',kind:'cache',x:0,y:0,time:0,sequence:1},
    {type:'SCALE_OUT',time:6,sequence:2},
    {type:'DEPLOY_RESOURCE',kind:'edge',x:0,y:0,time:57,sequence:3},
  ].map(parseAction);
  const body = {nickname:'SCALING',clientRunId:'scaling-test-run-1',challengeContentHash:infrastructureScalingChallenge.contentHash,actions};
  const response = await handleSubmit(storage, JSON.stringify(body));
  expect(response.accepted).toBe(true); expect(response.top[0].score).toBe(9474);
  await expect(handleSubmit(storage, JSON.stringify({...body,challengeContentHash:blackFridayChallengeV03.contentHash}))).rejects.toThrow('Objective not met');
  await expect(handleSubmit(storage, JSON.stringify({...body,actions:[{...actions[0],tier:999}]}))).rejects.toThrow('Unsupported action field');
  const legacyActions = [
    {type:'SCALE_OUT',time:16,sequence:0},
    {type:'DEPLOY_RESOURCE',kind:'cache',x:0,y:0,time:17,sequence:1},
    {type:'DEPLOY_RESOURCE',kind:'edge',x:0,y:0,time:57,sequence:2},
    {type:'SCALE_OUT',time:57,sequence:3},
  ].map(parseAction);
  const legacy = await handleSubmit(storage,JSON.stringify({...body,clientRunId:'legacy-scaling-test-1',challengeContentHash:blackFridayChallengeV03.contentHash,actions:legacyActions}));
  expect(legacy.accepted).toBe(true); expect(legacy.top).toHaveLength(1); expect(legacy.top[0].score).toBe(9474);
});
