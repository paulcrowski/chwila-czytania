export const WAIT_MS = 30_000;
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
      const url = new URL(/^https?:\/\//i.test(entry) ? entry : 'https://' + entry);
      const domain = url.hostname.replace(/^www\./, '').replace(/\.$/, '');
      if (!/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z][a-z0-9-]*$/i.test(domain)) {
        throw new Error('Wpisz nazwę domeny, np. onet.pl.');
      }
      if (existing.some(other => inDomain(domain, other) || inDomain(other, domain))) {
        throw new Error('Domena występuje już na liście: ' + domain);
      }
      existing.push(domain);
      sites[group].push(domain);
    }
  }
  if (existing.length > 100) throw new Error('Prototyp obsługuje do 100 domen.');
  return sites;
}

export function readLimits(values) {
  const limits = {};
  for (const group of Object.keys(MINUTES)) {
    const raw = String(values[group] ?? '').trim();
    const minutes = Number(raw);
    if (!/^\d+$/.test(raw) || minutes < 1 || minutes > MAX_MINUTES) {
      throw new Error('Podaj pełną liczbę minut od 1 do ' + MAX_MINUTES + '.');
    }
    limits[group] = minutes;
  }
  return limits;
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
