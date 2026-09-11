import { expect, it } from 'vitest';
import { projectStatus } from './status';
it('does not claim the game is implemented', () => {
  expect(projectStatus()).toContain('Gameplay implementation is in progress.');
});
