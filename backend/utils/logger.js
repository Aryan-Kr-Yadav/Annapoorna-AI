/* Minimal structured logger so we don't sprinkle raw console.log everywhere. */

const timestamp = () => new Date().toISOString();

export const logger = {
  info: (...args) => console.log(`[INFO ${timestamp()}]`, ...args),
  warn: (...args) => console.warn(`[WARN ${timestamp()}]`, ...args),
  error: (...args) => console.error(`[ERROR ${timestamp()}]`, ...args),
};
