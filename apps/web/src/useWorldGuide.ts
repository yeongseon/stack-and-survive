import { useRef, useState } from 'react';
import { guideStorageKey, parseGuideRecord, type GuideRecord, type GuideStage } from './world-guide';

export function useWorldGuide() {
  const [record, setRecord] = useState<GuideRecord>(() => {
    try { return parseGuideRecord(localStorage.getItem(guideStorageKey)); } catch { return 'new'; }
  });
  const [stage, setStage] = useState<GuideStage>('observe');
  const [visible, setVisible] = useState(record === 'new');
  const [message, setMessage] = useState('');
  const latestStage = useRef(stage);
  const set = (next: GuideStage) => { latestStage.current = next; setStage(next); };
  const save = (next: GuideRecord) => {
    setRecord(next);
    try {
      if (next === 'new') localStorage.removeItem(guideStorageKey);
      else localStorage.setItem(guideStorageKey, JSON.stringify({ version: 1, status: next }));
      setMessage('');
    } catch { setMessage('Guide preference could not be saved. This session still works.'); }
  };
  return { visible, stage, record, message,
    skip: () => { save('skipped'); setVisible(false); },
    next: () => {
      if (latestStage.current === 'observe') set('decide');
      else if (latestStage.current === 'decide') set('compare');
      else { save('completed'); setVisible(false); }
    },
    replay: () => { save('new'); set('observe'); setVisible(true); },
    newAttempt: () => { if (record === 'new') { set('observe'); setVisible(true); } },
  };
}
export type WorldGuideControls = ReturnType<typeof useWorldGuide>;
