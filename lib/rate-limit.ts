/**
 * Simple in-memory rate limiter for the MVP.
 * In production, replace with Redis or Supabase-backed rate limiting.
 *
 * Limits:
 * - Anonymous: 3 searches per day (by IP hash)
 * - Authenticated free: 10 searches per month
 * - Pro: unlimited
 */

interface RateLimitEntry {
  count: number;
  resetAt: number; // Unix timestamp
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key);
  }
}, 60_000); // Every minute

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const LIMITS = {
  anonymous: { maxRequests: 3, windowMs: 24 * 60 * 60 * 1000 }, // 3/day
  authenticated: { maxRequests: 10, windowMs: 30 * 24 * 60 * 60 * 1000 }, // 10/month
  pro: { maxRequests: Infinity, windowMs: 0 },
} as const;

export type UserTier = 'anonymous' | 'authenticated' | 'pro';

export function checkRateLimit(
  identifier: string,
  tier: UserTier
): { allowed: boolean; remaining: number; resetAt: number } {
  const config = LIMITS[tier];

  if (config.maxRequests === Infinity) {
    return { allowed: true, remaining: Infinity, resetAt: 0 };
  }

  const key = `${tier}:${identifier}`;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    // New window
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
    };
  }

  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Hash an IP address for anonymous rate limiting.
 * Simple non-reversible hash — not cryptographic, just for bucketing.
 */
export function hashIp(ip: string): string {
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `ip_${Math.abs(hash).toString(36)}`;
}
