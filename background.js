import {
  DEFAULT_WAIT_SECONDS, BUCKETS, EMPTY_SITES, MINUTES, domainOrigins, groupFor, inDomain, newSession, normalizeDomain, portalUrl,
  readLimits, readSites, readWaitSeconds, readerPath, redirectRules, sessionState,
} from './model.mjs';
import { appError, translator } from './i18n.mjs';

const dnr = chrome.declarativeNetRequest;
const local = chrome.storage.local;
const session = chrome.storage.session;
const alarmName = group => 'access-' + group;
const BADGE_ALARM = 'session-badge';
const allowId = group => 1000 + BUCKETS[group];
let pending = Promise.resolve();

function queue(operation) {
  const result = pending.then(operation);
  pending = result.catch(() => {});
  return result;
}

chrome.runtime.onInstalled.addListener(() => queue(restoreTabs).catch(console.error));
chrome.runtime.onStartup.addListener(() => queue(restoreTabs).catch(console.error));
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === BADGE_ALARM || alarm.name.startsWith('access-')) {
    queue(refresh).catch(console.error);
  }
});
// Network rules cover requests. Tab events also catch restored or cached pages
// and navigations within a site that do not make a main-frame request.
chrome.tabs.onUpdated.addListener((tabId, change, tab) => {
  if ((change.url || change.status === 'complete') && isWebUrl(tab.url)) {
    queue(() => checkTab(tabId)).catch(console.error);
  }
});
chrome.tabs.onActivated.addListener(({ tabId }) => queue(() => checkTab(tabId)).catch(console.error));
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.language) queue(refresh).catch(console.error);
});
chrome.tabs.onRemoved.addListener(tabId => session.remove('gate-' + tabId));
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (sender.id !== chrome.runtime.id) return false;
  queue(() => handle(message, sender)).then(respond, error => {
    respond({ error: error.message, errorInfo: error.i18n });
  });
  return true;
});

async function refresh() {
  const { sites = EMPTY_SITES, access = {}, limits = MINUTES, waitSeconds = DEFAULT_WAIT_SECONDS } =
    await local.get(['sites', 'access', 'limits', 'waitSeconds']);
  await syncAllowRules(sites, access);
  return { sites, access, limits, waitSeconds };
}

async function replaceRedirects(sites) {
  const previous = await dnr.getDynamicRules();
  await dnr.updateDynamicRules({
    removeRuleIds: previous.map(rule => rule.id),
    addRules: redirectRules(sites, path => chrome.runtime.getURL(path)),
  });
}

async function syncAllowRules(sites, access) {
  const now = Date.now();
  const previous = await dnr.getSessionRules();
  const allowed = [];
  for (const group of Object.keys(MINUTES)) {
    const current = access[group];
    if (sessionState(current, now) === 'active' && sites[group].length) {
      await chrome.alarms.create(alarmName(group), { when: current.endAt });
      allowed.push({
        id: allowId(group),
        priority: 2,
        action: { type: 'allow' },
        condition: { requestDomains: sites[group], resourceTypes: ['main_frame'] },
      });
    } else {
      await chrome.alarms.clear(alarmName(group));
    }
  }

  const managed = previous.filter(rule => Object.keys(MINUTES).some(group => allowId(group) === rule.id));
  await dnr.updateSessionRules({ removeRuleIds: managed.map(rule => rule.id), addRules: allowed });

  await updateBadge(sites, access, now);

  for (const group of Object.keys(MINUTES)) {
    const current = access[group];
    if (current && !current.closed && sessionState(current, now) !== 'active') {
      await returnToReading(sites[group]);
      current.closed = true;
      await local.set({ access });
    }
  }
}

async function updateBadge(sites, access, now) {
  const endTimes = Object.keys(MINUTES)
    .filter(group => sites[group].length && sessionState(access[group], now) === 'active')
    .map(group => access[group].endAt);

  if (!endTimes.length) {
    await chrome.alarms.clear(BADGE_ALARM);
    await chrome.action.setBadgeText({ text: '' });
    await chrome.action.setTitle({ title: 'Chwila czytania' });
    return;
  }

  const remaining = Math.min(...endTimes) - now;
  const minutes = Math.ceil(remaining / 60_000);
  await chrome.action.setBadgeBackgroundColor({ color: '#30523b' });
  await chrome.action.setBadgeText({ text: String(minutes) });
  const { language } = await local.get('language');
  await chrome.action.setTitle({ title: translator(language)('badgeTime', minutes) });

  // Alarms can run at most twice per minute. Line up the badge with the next
  // whole-minute change, while the separate access alarm handles expiration.
  const untilChange = remaining - (minutes - 1) * 60_000;
  if (minutes > 1) {
    await chrome.alarms.create(BADGE_ALARM, { when: now + Math.max(30_000, untilChange + 1) });
  } else {
    await chrome.alarms.clear(BADGE_ALARM);
  }
}

function isWebUrl(url) {
  return url?.startsWith('https://') || url?.startsWith('http://');
}

function blockedDomains(sites, access) {
  const now = Date.now();
  return Object.entries(sites).flatMap(([group, domains]) =>
    group === 'block' || sessionState(access[group], now) !== 'active' ? domains : []
  );
}

async function redirectTab(tab, domains) {
  if (!isWebUrl(tab?.url) || (tab.pendingUrl && tab.pendingUrl !== tab.url)) return;
  const url = new URL(tab.url);
  const domain = domains.find(candidate => inDomain(url.hostname, candidate));
  if (domain) {
    await chrome.tabs.update(tab.id, {
      url: chrome.runtime.getURL(readerPath(domain)) + '#' + url.href,
    });
  }
}

async function returnToReading(domains) {
  if (!domains.length) return;
  const tabs = await chrome.tabs.query({});
  await Promise.allSettled(tabs.map(tab => redirectTab(tab, domains)));
}

async function checkTab(tabId) {
  const tab = await chrome.tabs.get(tabId).catch(() => undefined);
  if (!isWebUrl(tab?.url)) return;
  const { sites = EMPTY_SITES, access = {} } = await local.get(['sites', 'access']);
  await redirectTab(tab, blockedDomains(sites, access));
}

async function restoreTabs() {
  const { sites, access } = await refresh();
  await returnToReading(blockedDomains(sites, access));
}

async function saveSiteConfiguration(config, sites, limits, waitSeconds = config.waitSeconds ?? DEFAULT_WAIT_SECONDS) {
  const { sites: previous = EMPTY_SITES, access = {} } = config;
  await replaceRedirects(sites);
  try {
    await local.set({ sites, limits, waitSeconds });
  } catch (error) {
    await replaceRedirects(previous);
    throw error;
  }
  await syncAllowRules(sites, access);
  await returnToReading(blockedDomains(sites, access));
}

async function handle(message, sender) {
  if (message.type === 'save-sites' && sender.url === chrome.runtime.getURL('options.html')) {
    const config = await local.get(['sites', 'access', 'limits', 'waitSeconds']);
    const { limits = MINUTES, waitSeconds = DEFAULT_WAIT_SECONDS } = config;
    if (message.expectedSites !== undefined && (
      JSON.stringify(message.expectedSites) !== JSON.stringify(config.sites ?? null)
      || JSON.stringify(message.expectedLimits) !== JSON.stringify(limits)
      || (message.expectedWaitSeconds !== undefined && message.expectedWaitSeconds !== waitSeconds)
    )) {
      throw appError('settingsConflict');
    }
    const nextLimits = message.limits ? readLimits(message.limits) : limits;
    const nextWaitSeconds = message.waitSeconds === undefined ? waitSeconds : readWaitSeconds(message.waitSeconds);
    await saveSiteConfiguration(config, message.sites, nextLimits, nextWaitSeconds);
    return {};
  }

  if (message.type === 'add-current-site' && sender.url === chrome.runtime.getURL('popup.html')) {
    const { domain, group } = message;
    if (typeof domain !== 'string' || normalizeDomain(domain) !== domain || typeof group !== 'string' || !Object.hasOwn(EMPTY_SITES, group)) {
      throw appError('ruleInvalid');
    }

    const config = await local.get(['sites', 'access', 'limits', 'waitSeconds']);
    const { sites = EMPTY_SITES, access = {}, limits = MINUTES } = config;
    const fields = Object.fromEntries(Object.entries(sites).map(([key, domains]) => {
      const next = domains.filter(item => key === group || item !== domain);
      if (key === group && !next.includes(domain)) next.push(domain);
      return [key, next.join('\n')];
    }));
    const nextSites = readSites(fields);
    if (!(await chrome.permissions.contains({ origins: domainOrigins(domain) }))) {
      throw appError('permissionMissing');
    }

    await saveSiteConfiguration(config, nextSites, limits);
    return { group, active: sessionState(access[group], Date.now()) === 'active' };
  }

  const tabId = sender.tab?.id;
  if (tabId === undefined || !sender.url?.startsWith(chrome.runtime.getURL('reader.html?'))) {
    throw appError('readerTab');
  }
  const reader = new URL(sender.url);
  const domain = reader.searchParams.get('site');
  const { sites, access, limits, waitSeconds } = await refresh();
  const group = groupFor(sites, domain);
  if (group === undefined) return {};
  if (group === 'block') return { group };

  const now = Date.now();
  const state = sessionState(access[group], now);
  const minutes = limits[group];
  const usedMinutes = access[group]?.minutes ?? MINUTES[group];
  if (state === 'used') return { group, used: true, minutes: usedMinutes };
  const target = portalUrl(reader.hash.slice(1), domain);
  if (state === 'active') {
    if (message.type === 'enter') return { url: target };
    return { group, readyAt: now, endAt: access[group].endAt, minutes: usedMinutes };
  }

  const gateKey = 'gate-' + tabId;
  if (message.type === 'show') {
    const readyAt = now + waitSeconds * 1000;
    await session.set({ [gateKey]: { domain, readyAt } });
    return { group, readyAt, minutes };
  }
  const gate = (await session.get(gateKey))[gateKey];
  if (message.type !== 'enter' || gate?.domain !== domain || now < gate.readyAt) {
    throw appError('gateNotReady');
  }

  access[group] = { ...newSession(group, now, minutes), startAt: now, domain, minutes };
  await local.set({ access });
  await syncAllowRules(sites, access);
  await session.remove(gateKey);
  return { url: target };
}
