import { MAX_READING_SLICE_MS, READING_INTERVAL_MS } from './reading-progress.mjs';

export function trackReading(record) {
  let startedAt;
  let timer;
  function flush() {
    if (startedAt === undefined) return;
    const now = performance.now();
    const duration = Math.round(now - startedAt);
    startedAt = now;
    if (duration > 0 && duration <= MAX_READING_SLICE_MS) record(duration);
  }
  function stop() {
    clearInterval(timer);
    timer = undefined;
    flush();
    startedAt = undefined;
  }
  function sync() {
    if (document.visibilityState !== 'visible' || !document.hasFocus()) {
      stop();
    } else if (timer === undefined) {
      startedAt = performance.now();
      timer = setInterval(flush, READING_INTERVAL_MS);
    }
  }
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('focus', sync);
  window.addEventListener('blur', stop);
  window.addEventListener('pagehide', stop);
  window.addEventListener('pageshow', sync);
  sync();
}
