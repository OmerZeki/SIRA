/**
 * SIRA — Simple in-memory rate limiter
 * ====================================
 * For production with multiple instances, replace with Redis (e.g., Upstash Redis).
 * Current implementation uses per-process memory (works for single-instance deployments).
 */

interface RateLimitEntry {
  timestamps: number[];
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 10) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;

    // Clean up expired entries periodically
    setInterval(() => this.cleanup(), windowMs);
  }

  private cleanup() {
    const cutoff = Date.now() - this.windowMs;
    this.store.forEach((entry, key) => {
      entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
      if (entry.timestamps.length === 0) {
        this.store.delete(key);
      }
    });
  }

  check(key: string): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const cutoff = now - this.windowMs;

    let entry = this.store.get(key);
    if (!entry) {
      entry = { timestamps: [] };
      this.store.set(key, entry);
    }

    // Remove old timestamps
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

    if (entry.timestamps.length >= this.maxRequests) {
      return { allowed: false, remaining: 0 };
    }

    entry.timestamps.push(now);
    return { allowed: true, remaining: this.maxRequests - entry.timestamps.length };
  }
}

// OCR rate limiter: 10 requests per minute per agency
export const ocrRateLimiter = new RateLimiter(60000, 10);

// General API rate limiter: 100 requests per minute per IP
export const apiRateLimiter = new RateLimiter(60000, 100);
