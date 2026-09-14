import { blackFridayChallenge, parseChallenge } from './challenge';

export const challengeLadder = Object.freeze([
  Object.freeze({ title: 'Survive', description: 'Keep the business operating for 180 seconds.', challenge: blackFridayChallenge }),
  Object.freeze({ title: 'Reliable Business', description: 'Complete the same workload with at least 99% availability.', challenge: parseChallenge({
    ...blackFridayChallenge, id: 'black-friday-reliable', objective: { id: 'availability-99', version: 1, kind: 'availability', target: .99 },
  }) }),
  Object.freeze({ title: 'Customer First', description: 'Complete the same workload with at least 99.9% availability.', challenge: parseChallenge({
    ...blackFridayChallenge, id: 'black-friday-customer-first', objective: { id: 'availability-999', version: 1, kind: 'availability', target: .999 },
  }) }),
]);
