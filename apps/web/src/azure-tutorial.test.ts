import { describe, expect, it } from 'vitest';
import { azureTutorialKey, azureTutorialSteps, saveTutorial, tutorialSeen } from './azure-tutorial';
describe('optional conceptual tutorial', () => {
  it('has exactly four short steps and separate preference storage', () => {
    expect(azureTutorialSteps).toHaveLength(4);
    for (const step of azureTutorialSteps) expect(step.text.length).toBeLessThan(220);
    expect(azureTutorialKey).not.toBe('stack-and-survive.guide.v1');
  });
  it('persists completion and skip without touching other data', () => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
    expect(tutorialSeen(storage)).toBe(false);
    expect(saveTutorial(storage, 'completed')).toBe(true); expect(tutorialSeen(storage)).toBe(true);
    expect(saveTutorial(storage, 'skipped')).toBe(true); expect(values.size).toBe(1);
  });
  it('handles blocked storage without preventing play', () => {
    expect(tutorialSeen({ getItem: () => { throw new Error('blocked'); } })).toBe(false);
    expect(saveTutorial({ setItem: () => { throw new Error('blocked'); } }, 'completed')).toBe(false);
  });
});
