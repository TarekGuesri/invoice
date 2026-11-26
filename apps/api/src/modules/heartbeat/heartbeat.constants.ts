export const SYSTEM_QUEUE = 'system'
export const HEARTBEAT_JOB = 'heartbeat'
/** Redis key holding the ISO timestamp of the last processed heartbeat. */
export const HEARTBEAT_KEY = 'worker:heartbeat'
export const HEARTBEAT_INTERVAL_MS = 5 * 60_000
/** Two missed beats plus some slack before the worker is reported stale. */
export const HEARTBEAT_STALE_AFTER_MS = 2 * HEARTBEAT_INTERVAL_MS + 60_000
