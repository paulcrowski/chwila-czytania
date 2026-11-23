import assert from 'node:assert/strict';
import test from 'node:test';
import { trackReading } from '../reader-activity.mjs';

test('counts only foreground reading and ignores long gaps', () => {
  const windowEvents = {};
  const documentEvents = {};
  let now = 0;
  let focused = false;
  let tick;
  globalThis.performance = { now: () => now };
  globalThis.setInterval = callback => { tick = callback; return 1; };
  globalThis.clearInterval = () => { tick = undefined; };
  globalThis.window = { addEventListener(name, listener) { windowEvents[name] = listener; } };
  globalThis.document = {
    visibilityState: 'hidden',
    hasFocus: () => focused,
    addEventListener(name, listener) { documentEvents[name] = listener; },
  };

  const readings = [];
  trackReading(duration => readings.push(duration));
  assert.equal(tick, undefined);

  now = 30_000;
  document.visibilityState = 'visible';
  documentEvents.visibilitychange();
  assert.equal(tick, undefined);
  focused = true;
  windowEvents.focus();
  now += 5000;
  tick();

  now += 1600;
  focused = false;
  windowEvents.blur();
  document.visibilityState = 'hidden';
  documentEvents.visibilitychange();
  assert.equal(tick, undefined);
  assert.deepEqual(readings, [5000, 1600]);

  now += 120_000;
  document.visibilityState = 'visible';
  focused = true;
  windowEvents.focus();
  now += 40_000;
  tick();
  now += 2100;
  windowEvents.pagehide();
  assert.deepEqual(readings, [5000, 1600, 2100]);
});
