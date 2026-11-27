/** Per client IP, on every auth route (brute-force protection). */
export const AUTH_THROTTLE = { limit: 10, ttl: 60_000 }

/** Per client IP, on everything else. */
export const DEFAULT_THROTTLE = { limit: 120, ttl: 60_000 }
