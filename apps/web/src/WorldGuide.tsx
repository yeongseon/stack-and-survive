import type { View } from './controller';
import { guideHint } from './world-guide';
import type { WorldGuideControls } from './useWorldGuide';

export function WorldGuide({ view, guide, returnFocus }: { view: View; guide: WorldGuideControls; returnFocus: () => void }) {
  if (!guide.visible || view.state.runtime.status === 'PREPARATION') return null;
  const hint = guideHint(view, guide.stage);
  return <section className="world-guide" aria-label="World guide">
    <div><small>{guide.stage === 'observe' ? '1 / 3 · Observe' : guide.stage === 'decide' ? '2 / 3 · Decide' : '3 / 3 · Compare'}</small>
      <h2>{hint.title}</h2><p>{hint.text}</p></div>
    <div className="guide-actions"><button type="button" onClick={() => { guide.next(); if (guide.stage === 'compare') returnFocus(); }}>{guide.stage === 'compare' ? 'Finish guide' : 'Next guide tip'}</button>
      <button type="button" onClick={() => { guide.skip(); returnFocus(); }}>Skip guide</button></div>
  </section>;
}
