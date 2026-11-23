import { dayKey } from './model.mjs';

export const READING_INTERVAL_MS = 5_000;
export const MAX_READING_SLICE_MS = READING_INTERVAL_MS * 2;
const zero = { openings: 0, readingMs: 0, portalOpens: 0 };

function recentDays(now) {
  const day = new Date(now);
  day.setHours(12, 0, 0, 0);
  return Array.from({ length: 7 }, () => {
    const key = dayKey(day);
    day.setDate(day.getDate() - 1);
    return key;
  });
}

function combine(a = zero, b = zero) {
  return {
    openings: (a.openings ?? 0) + (b.openings ?? 0),
    readingMs: (a.readingMs ?? 0) + (b.readingMs ?? 0),
    portalOpens: (a.portalOpens ?? 0) + (b.portalOpens ?? 0),
  };
}

function countDays(progress, now) {
  const previous = progress?.days ?? { [progress?.day]: progress?.today };
  return Object.fromEntries(recentDays(now).map(day => [day, combine(previous[day])]));
}

export function readingSummary(progress, now = Date.now()) {
  const day = dayKey(new Date(now));
  const days = countDays(progress, now);
  return {
    day,
    today: days[day],
    week: Object.values(days).reduce(combine, zero),
    total: combine(progress?.total),
  };
}

export function addReadingProgress(progress, openings, readingMs, now = Date.now(), portalOpens = 0) {
  const days = countDays(progress, now);
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);
  const day = dayKey(new Date(now));
  const todayReading = Math.min(readingMs, now - +midnight);
  const yesterday = dayKey(new Date(+midnight - 1));
  days[day] = combine(days[day], { openings, readingMs: todayReading, portalOpens });
  days[yesterday] = combine(days[yesterday], { readingMs: readingMs - todayReading });
  return {
    days,
    total: combine(progress?.total, { openings, readingMs, portalOpens }),
  };
}
