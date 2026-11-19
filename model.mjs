import { appError } from './i18n.mjs';

export const DEFAULT_WAIT_SECONDS = 30;
export const MINUTES = { short: 10, long: 15 };
export const MAX_MINUTES = 1440;
export const BUCKETS = { block: 0, short: 1, long: 2 };
export const EMPTY_SITES = { block: [], short: [], long: [] };
export const EXAMPLE_SITES = {
  block: ['wyborcza.pl'],
  short: ['onet.pl'],
  long: ['gazeta.pl'],
};

export function readSites(fields) {
  const sites = structuredClone(EMPTY_SITES);
  const existing = [];
  for (const group of Object.keys(sites)) {
    for (const entry of fields[group].split(/[\s,]+/).filter(Boolean)) {
      let url;
      try {
        url = new URL(/^https?:\/\//i.test(entry) ? entry : 'https://' + entry);
      } catch {
        throw appError('domainInvalid');
      }
      const domain = normalizeDomain(url.hostname);
      if (existing.some(other => inDomain(domain, other) || inDomain(other, domain))) {
        throw appError('domainOverlap', domain);
      }
      existing.push(domain);
      sites[group].push(domain);
    }
  }
  if (existing.length > 100) throw appError('domainCount');
  return sites;
}

export function normalizeDomain(hostname) {
  const domain = hostname.toLowerCase().replace(/^www\./, '').replace(/\.$/, '');
  if (!/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z][a-z0-9-]*$/i.test(domain)) {
    throw appError('domainInvalid');
  }
  return domain;
}

export function domainOrigins(domain) {
  return ['http://*.' + domain + '/*', 'https://*.' + domain + '/*'];
}

export function readLimits(values) {
  const limits = {};
  for (const group of Object.keys(MINUTES)) {
    const raw = String(values[group] ?? '').trim();
    const minutes = Number(raw);
    if (!/^\d+$/.test(raw) || minutes < 1 || minutes > MAX_MINUTES) {
      throw appError('limitsInvalid', MAX_MINUTES);
    }
    limits[group] = minutes;
  }
  return limits;
}

export function readWaitSeconds(value) {
  const raw = String(value ?? '').trim();
  const seconds = Number(raw);
  if (!/^\d+$/.test(raw) || !Number.isSafeInteger(Date.now() + seconds * 1000)) {
    throw appError('waitInvalid');
  }
  return seconds;
}

export function inDomain(host, domain) {
  return host === domain || host.endsWith('.' + domain);
}

export function groupFor(sites, domain) {
  return Object.keys(sites).find(group => sites[group].includes(domain));
}

export function readerPath(domain) {
  return 'reader.html?site=' + domain;
}

export function portalUrl(source, domain) {
  try {
    const url = new URL(source);
    if (['http:', 'https:'].includes(url.protocol) && inDomain(url.hostname, domain)) {
      return url.href;
    }
  } catch {}
  return 'https://' + domain + '/';
}

export function redirectRules(sites, extensionUrl) {
  return Object.values(sites).flat().map((domain, index) => ({
    id: index + 1,
    priority: 1,
    action: {
      type: 'redirect',
      redirect: { regexSubstitution: extensionUrl(readerPath(domain)) + '#\\1' },
    },
    condition: {
      regexFilter: '^(https?://.*)$',
      requestDomains: [domain],
      resourceTypes: ['main_frame'],
    },
  }));
}

export function dayKey(date) {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('-');
}

export function newSession(group, now, minutes = MINUTES[group]) {
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return {
    day: dayKey(new Date(now)),
    endAt: Math.min(now + minutes * 60_000, +midnight),
    closed: false,
  };
}

export function sessionState(session, now) {
  if (!session || session.day !== dayKey(new Date(now))) return 'ready';
  return session.endAt > now && !session.closed ? 'active' : 'used';
}
