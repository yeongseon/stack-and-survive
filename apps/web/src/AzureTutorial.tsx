import { useEffect, useId, useRef, useState } from 'react';
import { azureTutorialSteps, saveTutorial, tutorialSeen } from './azure-tutorial';
import './azure-tutorial.css';
export function AzureTutorial({ compact = false }: { compact?: boolean }) {
  const [seen, setSeen] = useState(() => { try { return tutorialSeen(localStorage); } catch { return false; } });
  const [step, setStep] = useState<number | null>(null), [message, setMessage] = useState('');
  const trigger = useRef<HTMLButtonElement>(null), heading = useRef<HTMLHeadingElement>(null);
  const restoreFocus = useRef(false);
  const id = useId();
  useEffect(() => {
    const sync = () => { try { setSeen(tutorialSeen(localStorage)); } catch { setSeen(false); } };
    window.addEventListener('azure-tutorial-preference', sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('azure-tutorial-preference', sync); window.removeEventListener('storage', sync); };
  }, []);
  useEffect(() => {
    if (step !== null) heading.current?.focus({ preventScroll: true });
    else if (restoreFocus.current) { restoreFocus.current = false; trigger.current?.focus(); }
  }, [step]);
  const finish = (status: 'completed' | 'skipped') => {
    let saved = false;
    try { saved = saveTutorial(localStorage, status); } catch { saved = false; }
    restoreFocus.current = step !== null;
    setSeen(true); setStep(null); setMessage(saved ? '' : 'Tutorial preference could not be saved. You can still play.');
    if (saved) window.dispatchEvent(new Event('azure-tutorial-preference'));
    if (step === null) trigger.current?.focus();
  };
  const current = step === null ? null : azureTutorialSteps[step];
  return <section className={`azure-tutorial${compact ? ' is-compact' : ''}`} aria-label="Azure architecture tutorial">
    {step === null ? <div className="azure-tutorial-invite"><button ref={trigger} type="button" aria-expanded="false" aria-controls={id} onClick={() => setStep(0)}>{seen ? 'Replay Azure tutorial' : 'Explore Azure architecture · 4 steps'}</button>
      {!seen && <><span>Optional · no game actions are taken</span><button type="button" onClick={() => finish('skipped')}>Skip tutorial</button></>}</div>
      : <div id={id} className="azure-tutorial-content" onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); finish('skipped'); } }}>
        <small>OPTIONAL TUTORIAL · {step + 1} / 4</small>
        <h3 ref={heading} tabIndex={-1}>{current!.title}</h3><p>{current!.text}</p>
        <div className="azure-tutorial-map" data-highlight={current!.highlight} aria-label="Concept diagram: ingress to App Service to SQL Database">
          <span>Ingress</span><b aria-hidden="true">→</b><span data-tier="app">Azure App Service<small>Application tier</small></span><b aria-hidden="true">→</b><span data-tier="data">Azure SQL Database<small>Data tier</small></span>
        </div>
        <nav aria-label="Tutorial steps">{step > 0 && <button type="button" onClick={() => setStep(step - 1)}>Back</button>}<button type="button" onClick={() => step === 3 ? finish('completed') : setStep(step + 1)}>{step === 3 ? 'Finish tutorial' : 'Next step'}</button><button type="button" onClick={() => finish('skipped')}>Skip tutorial</button></nav>
      </div>}
    {message && <p role="status">{message}</p>}
  </section>;
}
