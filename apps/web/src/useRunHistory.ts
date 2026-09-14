import { useCallback, useRef, useState } from 'react';
import type { Architecture } from '@stack-and-survive/schema';
import type { View } from './controller';
import { emptyHistory, historyKey, parseHistory, recordRun, summarizeRun, type RunHistory, type RunSummary } from './run-history';
import { buildRunReport, type RunReport } from './run-report';

export function useRunHistory() {
  const [history, setHistory] = useState(() => {
    try { return parseHistory(localStorage.getItem(historyKey)); } catch { return emptyHistory(); }
  });
  const current = useRef(history);
  const seen = useRef(new WeakSet<object>());
  const [latest, setLatest] = useState<RunSummary | null>(null);
  const [report, setReport] = useState<{ result: NonNullable<View['result']>; data: RunReport } | null>(null);
  const [message, setMessage] = useState('');
  const pendingWrite = useRef(false);
  const save = useCallback((next: RunHistory) => {
    current.current = next; setHistory(next);
    try {
      const raw = JSON.stringify(next);
      if (raw.length > 2000000) throw new Error('History exceeds storage budget');
      localStorage.setItem(historyKey, raw); pendingWrite.current = false; setMessage('');
    } catch { pendingWrite.current = true; setMessage('Run history could not be saved. Records remain available in this session.'); }
  }, []);
  const complete = useCallback((result: NonNullable<View['result']>, architecture: Architecture) => {
    if (seen.current.has(result)) return;
    try {
      const summary = summarizeRun(result, architecture, crypto.randomUUID());
      const data = buildRunReport(summary, current.current);
      const next = recordRun(current.current, summary);
      seen.current.add(result); setLatest(summary); setReport({ result, data }); save(next);
    } catch { setMessage('This run could not be recorded. Its game result remains available.'); }
  }, [save]);
  const clear = useCallback(() => {
    try {
      localStorage.removeItem(historyKey); pendingWrite.current = false;
      current.current = emptyHistory(); setHistory(current.current); setLatest(null); setReport(null); setMessage('Run history cleared. Other settings and level unlocks are unchanged.');
    } catch { setMessage('Run history could not be cleared. Existing records were preserved.'); }
  }, []);
  return { history, latest, report, message, complete, clear, retrySave: () => save(current.current), needsSave: pendingWrite.current };
}
