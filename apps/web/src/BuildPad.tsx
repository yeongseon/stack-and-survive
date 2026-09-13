import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ActionRequest, Controller } from './controller';

export function BuildPad({ controller, action, label, role, detail }: {
  controller: Controller; action: ActionRequest; label: string; role: string; detail: string;
}) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const reason = controller.actionReason(action);
  const close = () => { setOpen(false); trigger.current?.focus(); };
  return <div className="build-pad" onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } }}>
    <button ref={trigger} type="button" aria-label={label} aria-expanded={open} aria-disabled={reason !== null}
      onClick={() => setOpen(!open)} className="pad-trigger"><span aria-hidden="true">+</span><strong>{role}</strong><small className="pad-hint">{detail}</small></button>
    {open && createPortal(<section className="pad-details" aria-label={`${role} expansion`} onKeyDown={e => { if (e.key === 'Escape') close(); }}>
      <strong>{label}</strong><p>{detail}</p>{reason && <p role="status">{reason}</p>}
      <button type="button" disabled={reason !== null} onClick={() => { controller.queueAction(action); close(); }}>Confirm expansion</button>
      <button autoFocus type="button" onClick={close}>Cancel expansion</button>
    </section>, document.body)}
  </div>;
}
