/**
 * Rate limiter simplificado para endpoints sensibles.
 * In-memory: no persiste entre reinicios de Vercel, pero previene abusos básicos.
 * Se puede reemplazar por una solución basada en Vercel KV o Edge Config en el futuro.
 */

type RateLimitEntry = {
  timestamps: number[];
};

const globalForRateLimit = globalThis as unknown as {
  __rateLimitStore?: Map<string, RateLimitEntry>;
};

const store = globalForRateLimit.__rateLimitStore ?? new Map<string, RateLimitEntry>();
if (!globalForRateLimit.__rateLimitStore) {
  globalForRateLimit.__rateLimitStore = store;
}

export function checkRateLimit(
  key: string,
  maxRequests: number = 5,
  windowMs: number = 60_000
): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry) {
    store.set(key, { timestamps: [now] });
    return { allowed: true, retryAfter: 0 };
  }

  // Limpiar timestamps viejos
  entry.timestamps = entry.timestamps.filter(t => now - t < windowMs);

  if (entry.timestamps.length >= maxRequests) {
    const oldest = entry.timestamps[0];
    const retryAfter = Math.ceil((oldest + windowMs - now) / 1000);
    return { allowed: false, retryAfter };
  }

  entry.timestamps.push(now);

  if (store.size > 5000) {
    for (const [k, v] of store.entries()) {
      v.timestamps = v.timestamps.filter((t) => now - t < windowMs);
      if (v.timestamps.length === 0) {
        store.delete(k);
      }
    }
  }

  return { allowed: true, retryAfter: 0 };
}
