import { useEffect, useRef, useState } from 'react';
import type { Architecture } from '@stack-and-survive/schema';
import type { View } from './controller';
import type { RunSummary } from './run-history';
import { buildExportRequest, copyToClipboard, downloadText, type ExportResponse } from './export-azure';
import { requestAgentExport, type AgentStep, type AgentVerification } from './export-agent';
import './export-azure.css';
import { azureLearn } from './azure-learn';

export function ExportAzurePanel({ result, run, architecture }: { result: NonNullable<View['result']>; run: RunSummary; architecture: Architecture }) {
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [response, setResponse] = useState<ExportResponse | null>(null);
  const [copyStatus, setCopyStatus] = useState('');
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [verification, setVerification] = useState<AgentVerification | null>(null);
  const generation = useRef(0), busy = useRef(false);
  useEffect(() => { generation.current++; busy.current = false; setState('idle'); setResponse(null); setCopyStatus(''); setSteps([]); setVerification(null); return () => { generation.current++; }; }, [result, architecture]);
  async function generate() {
    if (busy.current) return;
    busy.current = true; const requestId = ++generation.current; setState('loading'); setCopyStatus(''); setSteps([]); setVerification(null);
    let value: Awaited<ReturnType<typeof requestAgentExport>>;
    try { value = await requestAgentExport(buildExportRequest(result, run, architecture)); } catch { value = { export: null, steps: [] }; }
    if (requestId !== generation.current) return;
    busy.current = false; setResponse(value.export); setState(value.export ? 'ready' : 'error');
    if (value.export) { setSteps(value.verification.steps); setVerification(value.verification); } else setSteps(value.steps);
  }
  async function copy() {
    if (!response) return; const requestId = generation.current;
    const copied = await copyToClipboard(response.bicep);
    if (requestId === generation.current) setCopyStatus(copied ? 'Bicep copied.' : 'Copy unavailable. Select the code or download the file.');
  }
  return <section className="export-azure" aria-label="Export to Azure" aria-busy={state === 'loading'}>
    <p className="report-kicker">Architecture Export Agent</p>
    {(state === 'idle' || state === 'loading' || state === 'error') && <>
      <button type="button" className="report-alternate" disabled={state === 'loading'} onClick={() => { void generate(); }}>{state === 'loading' ? 'Generating and checking Bicep…' : state === 'error' ? 'Retry Export to Azure' : 'Export to Azure'}<span>Generate, compile and check this architecture →</span></button>
      <p>On request, this run's simulation numbers and architecture are sent to the optional API and Azure OpenAI. No player name is included.</p>
      {state === 'error' && <p role="status">Export unavailable right now.</p>}
      {state === 'loading' && <p role="status">Waiting for verified tool results. Up to two candidate checks; no resources will be deployed.</p>}
    </>}
    {steps.length > 0 && <section aria-label="Agent verification steps" className="export-agent-trace">
      <h4>Actual tool results</h4>
      <ol>{steps.map((step, index) => <li key={`${index}-${step.tool}`}>{step.attempt > 0 ? `Candidate ${step.attempt} · ` : ''}{({ mapping: 'Azure mapping lookup', policy: 'Output safety policy', compile: 'Bicep compilation', architecture: 'Final architecture check' })[step.tool]} — {step.status}</li>)}</ol>
      {verification ? <><p>{verification.attempts === 1 ? 'First candidate verified; no repair was needed.' : 'Two candidates checked; the revised candidate passed.'}</p><p>Verified artifact SHA-256: <code>{verification.artifactSha256}</code></p></> : <p>Verification did not complete. No downloadable artifact is offered.</p>}
      <p>These are completed tool outcomes, not hidden reasoning or a deployment/security approval.</p>
    </section>}
    {state === 'ready' && response && <>
      <h3>{response.title}</h3>
      <ul>{response.resources.map(resource => <li key={resource.gameResource}><strong>{resource.gameResource} → {resource.azureService} ({resource.sku})</strong><p>{resource.reason}</p>
        <a href={azureLearn[resource.gameResource].url} target="_blank" rel="noopener noreferrer">Microsoft Learn: {azureLearn[resource.gameResource].title} (opens in new tab)</a>
      </li>)}</ul>
      <details><summary>main.bicep</summary><pre tabIndex={0} aria-label="Bicep template"><code>{response.bicep}</code></pre></details>
      <details><summary>main.parameters.json</summary><pre tabIndex={0} aria-label="Bicep parameters"><code>{response.parametersJson}</code></pre></details>
      <div className="export-azure-actions">
        <button type="button" onClick={() => { void copy(); }}>Copy Bicep</button>
        <button type="button" onClick={() => downloadText('main.bicep', response.bicep)}>Download main.bicep</button>
        <button type="button" onClick={() => downloadText('main.parameters.json', response.parametersJson)}>Download main.parameters.json</button>
      </div>
      <output aria-live="polite">{copyStatus}</output>
      <h4>Review requirements</h4><ul>{response.caveats.map((caveat, index) => <li key={`${index}-${caveat}`}>{caveat}</li>)}</ul>
      <p className="export-azure-note">Generated by Azure OpenAI from this run's numbers. Game capacities and costs are not Azure specifications. Review before deploying; nothing was deployed.</p>
    </>}
  </section>;
}
