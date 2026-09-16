import { describe, expect, it } from 'vitest';
import { RateLimiter } from './rate-limit';

describe('RateLimiter', () => {
  it('allows requests within limit', () => {
    const limiter = new RateLimiter(3, 60000);
    expect(limiter.check('a')).toBe(true);
    expect(limiter.check('a')).toBe(true);
    expect(limiter.check('a')).toBe(true);
    expect(limiter.remaining('a')).toBe(0);
  });

  it('blocks requests exceeding limit', () => {
    const limiter = new RateLimiter(2, 60000);
    limiter.check('a');
    limiter.check('a');
    expect(limiter.check('a')).toBe(false);
  });

  it('tracks keys independently', () => {
    const limiter = new RateLimiter(1, 60000);
    expect(limiter.check('a')).toBe(true);
    expect(limiter.check('b')).toBe(true);
    expect(limiter.check('a')).toBe(false);
    expect(limiter.check('b')).toBe(false);
  });

  it('reports remaining requests', () => {
    const limiter = new RateLimiter(5, 60000);
    expect(limiter.remaining('x')).toBe(5);
    limiter.check('x');
    expect(limiter.remaining('x')).toBe(4);
  });

  it('cleans up expired entries', () => {
    const limiter = new RateLimiter(1, 1); // 1ms window
    limiter.check('a');
    // After cleanup with expired window, should allow again
    setTimeout(() => {
      limiter.cleanup();
      expect(limiter.check('a')).toBe(true);
    }, 5);
  });
});
