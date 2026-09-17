import { useEffect, useId, useRef, useState } from 'react';
import { normalizeNickname, validateNickname } from './leaderboard';

export function PlayerNameControl({ nickname, onSave, join = false, afterSave, changeLabel = 'Change', optional = false }: {
  nickname: string; onSave: (name: string) => void; join?: boolean; afterSave?: () => void; changeLabel?: string; optional?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(nickname);
  const [touched, setTouched] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    if (!join) return;
    const frame = requestAnimationFrame(() => input.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [join]);
  const error = validateNickname(draft);
  const visible = editing || join;
  const close = () => { setEditing(false); setDraft(nickname); setTouched(false); requestAnimationFrame(() => trigger.current?.focus()); };
  return <div className={`player-name-control${join ? ' player-name-join' : ''}`}>
    {visible ? <form onSubmit={event => {
      event.preventDefault(); setTouched(true);
      if (error) { input.current?.focus(); return; }
      onSave(normalizeNickname(draft)); setEditing(false); setTouched(false);
      if (afterSave) afterSave(); else requestAnimationFrame(() => trigger.current?.focus());
    }} onKeyDown={event => {
      if (event.key === 'Escape' && editing && !join) { event.preventDefault(); event.stopPropagation(); close(); }
    }}>
      <label htmlFor={id}>Player name{optional && <small> · optional</small>}</label>
      <div className="player-name-fields"><input ref={input} id={id} aria-label="Player name" aria-invalid={touched && !!error}
        aria-describedby={`${id}-help${touched && error ? ` ${id}-error` : ''}`} value={draft} maxLength={16} autoComplete="off" spellCheck={false}
        onChange={event => { setDraft(event.target.value); setTouched(true); }} />
        <button type="submit" disabled={!!error}>{join ? 'Join Leaderboard' : 'Save name'}</button>
        {!join && <button type="button" onClick={close}>Cancel</button>}
      </div>
      <small id={`${id}-help`}>2–16 letters, numbers, hyphens or underscores.{optional && ' Start Game never requires a name.'}</small>
      {touched && error && <output id={`${id}-error`} className="leaderboard-error">{error.replace('Nickname', 'Player name')}</output>}
    </form> : <div className="player-name-summary">
      <span>{nickname ? <>Playing as <strong>{nickname}</strong></> : 'Player name · optional'}</span>
      <button ref={trigger} type="button" onClick={() => { setDraft(nickname); setTouched(false); setEditing(true); requestAnimationFrame(() => input.current?.focus()); }}>{nickname ? changeLabel : 'Add player name'}</button>
    </div>}
  </div>;
}
