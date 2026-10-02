/**
 * Minimal in-memory sliding-window rate limiter.
 * No Redis dependency — swap with a Redis backend in production
 * without changing call sites.
 */

interface Bucket {
  hits: number[];
}

const buckets = new Map<string, Bucket>();

export interface RateLimitOptions {
  /** max requests per window */
  max: number;
  /** window in ms */
  windowMs: number;
}

export function checkRateLimit(key: string, opts: RateLimitOptions): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { hits: [] };
    buckets.set(key, bucket);
  }
  bucket.hits = bucket.hits.filter((t) => now - t < opts.windowMs);
  if (bucket.hits.length >= opts.max) {
    const oldest = bucket.hits[0];
    return { allowed: false, retryAfterMs: opts.windowMs - (now - oldest) };
  }
  bucket.hits.push(now);
  return { allowed: true, retryAfterMs: 0 };
}

/** Presets per spec §43. Never rely on frontend limits. */
export const RATE_LIMITS = {
  taskStart: { max: 10, windowMs: 60_000 }, // 10 starts/min per user
  proofSubmit: { max: 5, windowMs: 60_000 }, // 5 proofs/min per user
  withdrawal: { max: 3, windowMs: 3_600_000 }, // 3 withdrawals/hour per user
  referral: { max: 20, windowMs: 3_600_000 }, // 20 referral claims/hour
  campaignCreate: { max: 5, windowMs: 3_600_000 }, // 5 campaigns/hour per project
} as const;
