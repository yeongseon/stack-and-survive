import { canonicalPlayerStart } from '../packages/cloud-domain/src/index';
import { infrastructureScalingChallenge, parseChallenge } from '../packages/scenarios/src/challenge';
import { replayRun } from '../packages/simulation/src/replay';
import { parseAction, type Action } from '../packages/simulation/src/runtime';
type Plan = [number, Action['type'], ('cache' | 'edge')?][];
const plans: Record<string, Plan> = {
  baseline: [],
  horizontalCache: [[0,'DEPLOY_RESOURCE','cache'],[0,'SCALE_OUT'],[8,'SCALE_OUT'],[16,'SCALE_OUT']],
  efficientLayers: [[16,'SCALE_OUT'],[17,'DEPLOY_RESOURCE','cache'],[57,'DEPLOY_RESOURCE','edge'],[57,'SCALE_OUT']],
  twoPremium: [[0,'SCALE_UP_APP'],[6,'SCALE_UP_APP'],[12,'SCALE_OUT'],[0,'DEPLOY_RESOURCE','cache']],
  verticalEfficient: [[0,'SCALE_UP_APP'],[6,'SCALE_OUT'],[0,'DEPLOY_RESOURCE','cache'],[57,'DEPLOY_RESOURCE','edge']],
  latePremium: [[0,'SCALE_OUT'],[8,'SCALE_OUT'],[16,'SCALE_OUT'],[0,'DEPLOY_RESOURCE','cache'],[60,'SCALE_IN'],[64,'SCALE_UP_APP'],[120,'SCALE_IN'],[124,'SCALE_UP_APP'],[160,'SCALE_DOWN_APP']],
  evolvingLate: [[16,'SCALE_OUT'],[17,'DEPLOY_RESOURCE','cache'],[57,'DEPLOY_RESOURCE','edge'],[57,'SCALE_OUT'],[120,'SCALE_OUT'],[130,'SCALE_IN'],[140,'SCALE_UP_APP'],[145,'SCALE_UP_DATABASE'],[155,'SCALE_UP_DATABASE'],[165,'ADD_READ_REPLICA']],
  verticalSQL: [[0,'SCALE_OUT'],[8,'SCALE_OUT'],[16,'SCALE_OUT'],[0,'SCALE_UP_DATABASE'],[10,'SCALE_UP_DATABASE']],
  readReplica: [[0,'SCALE_OUT'],[8,'SCALE_OUT'],[16,'SCALE_OUT'],[0,'ADD_READ_REPLICA']],
  evolving: [[0,'DEPLOY_RESOURCE','cache'],[0,'SCALE_OUT'],[8,'SCALE_OUT'],[16,'SCALE_OUT'],[26,'SCALE_IN'],[30,'SCALE_UP_APP'],[40,'SCALE_UP_DATABASE'],[50,'ADD_READ_REPLICA'],[58,'DEPLOY_RESOURCE','edge'],[100,'SCALE_DOWN_APP'],[145,'REMOVE_READ_REPLICA']],
};
for (const mix of ['standard', 'reads', 'writes'] as const) {
  const challenge = mix === 'standard' ? infrastructureScalingChallenge : parseChallenge({ ...infrastructureScalingChallenge,
    id: `scaling-${mix}`, workload: { ...infrastructureScalingChallenge.workload, businessMix: { browse: mix === 'reads' ? .95 : .55, order: mix === 'reads' ? .05 : .45 } } });
  for (const [plan, schedule] of Object.entries(plans)) {
    const actions = schedule.map(([time,type,kind], sequence) => parseAction({time,type,sequence,...(kind ? {kind,x:0,y:0}: {})})).sort((a,b)=>a.time-b.time || a.sequence-b.sequence).map((a,sequence)=>({...a,sequence}));
    const result = replayRun({ challenge, initialArchitecture: canonicalPlayerStart(), actions });
    console.log(JSON.stringify({ mix,plan,status:result.status,elapsed:result.elapsed,score:result.score,availability:+(result.availability*100).toFixed(3),cost:+result.cost.toFixed(3),value:+result.nbv.toFixed(3),rejected:result.actionLog.filter(a=>!a.accepted).length }));
  }
}
