import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkRateLimit, checkPerMinuteLimit, hashIp } from '@/lib/rate-limit';

beforeEach(() => {
  vi.useFakeTimers();
});

describe('checkRateLimit', () => {
  it('allows pro tier unlimited requests', () => {
    const result = checkRateLimit('user-pro', 'pro');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(Infinity);
    expect(result.resetAt).toBe(0);
  });

  it('allows anonymous up to 3 requests per day', () => {
    const r1 = checkRateLimit('anon-1', 'anonymous');
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = checkRateLimit('anon-1', 'anonymous');
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = checkRateLimit('anon-1', 'anonymous');
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);

    const r4 = checkRateLimit('anon-1', 'anonymous');
    expect(r4.allowed).toBe(false);
    expect(r4.remaining).toBe(0);
  });

  it('allows authenticated up to 10 requests per month', () => {
    for (let i = 0; i < 10; i++) {
      const r = checkRateLimit('auth-1', 'authenticated');
      expect(r.allowed).toBe(true);
    }
    const blocked = checkRateLimit('auth-1', 'authenticated');
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it('resets after window expires', () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit('anon-reset', 'anonymous');
    }
    expect(checkRateLimit('anon-reset', 'anonymous').allowed).toBe(false);

    vi.advanceTimersByTime(25 * 60 * 60 * 1000);

    const after = checkRateLimit('anon-reset', 'anonymous');
    expect(after.allowed).toBe(true);
    expect(after.remaining).toBe(2);
  });

  it('tracks different identifiers independently', () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit('user-a', 'anonymous');
    }
    expect(checkRateLimit('user-a', 'anonymous').allowed).toBe(false);
    expect(checkRateLimit('user-b', 'anonymous').allowed).toBe(true);
  });

  it('returns a future resetAt timestamp', () => {
    const now = Date.now();
    const result = checkRateLimit('anon-ts', 'anonymous');
    expect(result.resetAt).toBeGreaterThan(now);
  });
});

describe('checkPerMinuteLimit', () => {
  it('allows requests up to maxPerMinute', () => {
    const r1 = checkPerMinuteLimit('pm-1', 5);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(4);

    for (let i = 0; i < 4; i++) {
      checkPerMinuteLimit('pm-1', 5);
    }

    const blocked = checkPerMinuteLimit('pm-1', 5);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it('resets after 60 seconds', () => {
    for (let i = 0; i < 5; i++) {
      checkPerMinuteLimit('pm-reset', 5);
    }
    expect(checkPerMinuteLimit('pm-reset', 5).allowed).toBe(false);

    vi.advanceTimersByTime(61_000);

    const after = checkPerMinuteLimit('pm-reset', 5);
    expect(after.allowed).toBe(true);
    expect(after.remaining).toBe(4);
  });

  it('tracks different identifiers independently', () => {
    for (let i = 0; i < 2; i++) {
      checkPerMinuteLimit('pm-a', 2);
    }
    expect(checkPerMinuteLimit('pm-a', 2).allowed).toBe(false);
    expect(checkPerMinuteLimit('pm-b', 2).allowed).toBe(true);
  });
});

describe('hashIp', () => {
  it('returns a string prefixed with ip_', () => {
    const result = hashIp('192.168.1.1');
    expect(result).toMatch(/^ip_/);
  });

  it('produces consistent hashes for the same input', () => {
    expect(hashIp('10.0.0.1')).toBe(hashIp('10.0.0.1'));
  });

  it('produces different hashes for different IPs', () => {
    expect(hashIp('10.0.0.1')).not.toBe(hashIp('10.0.0.2'));
  });

  it('handles empty string', () => {
    const result = hashIp('');
    expect(result).toBe('ip_0');
  });

  it('handles IPv6 addresses', () => {
    const result = hashIp('::1');
    expect(result).toMatch(/^ip_/);
    expect(result.length).toBeGreaterThan(3);
  });
});
