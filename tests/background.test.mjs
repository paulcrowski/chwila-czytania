import assert from 'node:assert/strict';
import { readSites, portalUrl, newSession, readLimits, readWaitSeconds, sessionState } from '../model.mjs';
import { makeBook } from '../book.mjs';

const sites = readSites({ block: 'wyborcza.pl', short: 'https://www.onet.pl/sport\nexample.com', long: 'gazeta.pl' });
assert.deepEqual(sites.short, ['onet.pl', 'example.com']);
assert.deepEqual(readLimits({ short: '1', long: 1440 }), { short: 1, long: 1440 });
for (const short of [0, 1441, '', '1.5', 'abc']) {
  assert.throws(() => readLimits({ short, long: 15 }), /pełną liczbę/);
}
assert.throws(() => readSites({ block: 'onet.pl', short: 'sport.onet.pl', long: '' }), /występuje/);
assert.equal(portalUrl('https://sport.onet.pl/a?q=x&v=y', 'onet.pl'), 'https://sport.onet.pl/a?q=x&v=y');
assert.equal(portalUrl('https://onet.pl.bad.test/', 'onet.pl'), 'https://onet.pl/');
const book = makeBook('Czytanie.txt', 'Raz\n\nDwa ' + 'słowo '.repeat(179));
assert.equal(book.title, 'Czytanie');
assert.equal(book.pages.length, 2);
assert.ok(book.pages[0].startsWith('Raz\n\nDwa'));
assert.equal(book.pages[1], 'słowo');
assert.throws(() => makeBook('Pusty.txt', '   '), /pusty/);
const nearMidnight = new Date(2026, 10, 19, 23, 57).getTime();
assert.equal(newSession('long', nearMidnight).endAt, +new Date(2026, 10, 20));
assert.equal(sessionState(newSession('long', nearMidnight), +new Date(2026, 10, 20)), 'ready');

function event() {
  return { addListener(fn) { this.fn = fn; } };
}
function storage() {
  const data = {};
  return {
    async get(keys) {
      return Object.fromEntries([keys].flat().map(key => [key, structuredClone(data[key])]));
    },
    async set(values) { Object.assign(data, structuredClone(values)); },
    async remove(key) { delete data[key]; },
  };
}
let dynamic = [];
let temporary = [];
let badge = "";
let permissions = true;
const requested = [];
let nextAllowed = false;
const tabs = new Map([
  [1, 'https://wykop.pl/wpis/123'],
  [2, 'https://wykop.pl.example.net/'],
  [3, 'https://allowed.example.org/'],
]);
const alarms = new Map();
const getURL = path => 'chrome-extension://test/' + path;
globalThis.chrome = {
  permissions: { async contains(details) { requested.push(details); return nextAllowed; } },
  runtime: { id: 'test', getURL, onInstalled: event(), onStartup: event(), onMessage: event() },
  action: {
    async setBadgeText({ text }) { badge = text; },
    async setBadgeBackgroundColor() {},
    async setTitle() {},
  },
  storage: { local: storage(), session: storage(), onChanged: event() },
  tabs: {
    onRemoved: event(), onUpdated: event(), onActivated: event(),
    async query() { return Promise.all(Array.from(tabs.keys(), id => this.get(id))); },
    async get(id) {
      if (!tabs.has(id)) throw new Error('No tab');
      const value = tabs.get(id);
      return typeof value === 'string' ? { id, url: permissions ? value : undefined } : { id, ...value };
    },
    async update(id, { url }) { tabs.set(id, url); },
  },
  alarms: {
    onAlarm: event(),
    async create(name, props) { alarms.set(name, props.when); },
    async clear(name) { return alarms.delete(name); },
  },
  declarativeNetRequest: {
    async getDynamicRules() { return dynamic; },
    async getSessionRules() { return temporary; },
    async updateDynamicRules({ removeRuleIds, addRules }) {
      dynamic = dynamic.filter(rule => !removeRuleIds.includes(rule.id)).concat(addRules);
    },
    async updateSessionRules({ removeRuleIds, addRules }) {
      temporary = temporary.filter(rule => !removeRuleIds.includes(rule.id)).concat(addRules);
    },
  },
};
let now = +new Date(2026, 10, 19, 9, 0);
Date.now = () => now;
await import('../background.js');
function send(message, path, id = 1) {
  return new Promise(resolve => {
    assert.equal(chrome.runtime.onMessage.fn(message, { id: 'test', url: getURL(path), tab: { id } }, resolve), true);
  });
}

const configured = { block: ['wykop.pl'], short: ['onet.pl'], long: ['gazeta.pl'] };
assert.deepEqual(await send({ type: 'save-sites', sites: configured }, 'options.html'), {});
assert.equal(tabs.get(1), getURL('reader.html?site=wykop.pl#https://wykop.pl/wpis/123'), 'A Wykop tab already open when the rule is saved must go to the reader');
assert.equal(tabs.get(2), 'https://wykop.pl.example.net/');
assert.equal(tabs.get(3), 'https://allowed.example.org/');

const updateUrl = (id, url, change = { url }) => {
  tabs.set(id, url);
  chrome.tabs.onUpdated.fn(id, change, { id, url });
};
const flush = () => send({ type: 'show' }, 'reader.html?site=wykop.pl', 99);
updateUrl(1, 'https://www.wykop.pl/link/123');
await flush();
assert.equal(tabs.get(1), getURL('reader.html?site=wykop.pl#https://www.wykop.pl/link/123'));

updateUrl(1, 'https://wykop.pl/wpis/cached', { status: 'complete' });
await flush();
assert.equal(tabs.get(1), getURL('reader.html?site=wykop.pl#https://wykop.pl/wpis/cached'));

tabs.set(1, { url: 'https://wykop.pl/wpis/old', pendingUrl: 'https://allowed.example.org/' });
chrome.tabs.onActivated.fn({ tabId: 1 });
await flush();
assert.equal(tabs.get(1).pendingUrl, 'https://allowed.example.org/');

const onet = 'reader.html?site=onet.pl#https://onet.pl/';
assert.equal((await send({ type: 'show' }, onet, 4)).readyAt, now + 30_000);
now += 30_000;
assert.equal((await send({ type: 'enter' }, onet, 4)).url, 'https://onet.pl/');
updateUrl(4, 'https://onet.pl/');
await flush();
assert.equal(tabs.get(4), 'https://onet.pl/', 'A running timed session must still allow the site');
now += 600_000;
updateUrl(4, 'https://onet.pl/nowa');
await flush();
assert.equal(tabs.get(4), getURL('reader.html?site=onet.pl#https://onet.pl/nowa'));

permissions = false;
tabs.set(1, 'https://wykop.pl/');
chrome.tabs.onActivated.fn({ tabId: 1 });
await flush();
assert.equal(tabs.get(1), 'https://wykop.pl/', 'A site whose URL is withheld cannot be inspected');
permissions = true;
chrome.tabs.onActivated.fn({ tabId: 1 });
await flush();
assert.equal(tabs.get(1), getURL('reader.html?site=wykop.pl#https://wykop.pl/'));
tabs.set(1, 'https://wykop.pl/wpis/restored');
chrome.runtime.onStartup.fn();
await flush();
assert.equal(tabs.get(1), getURL('reader.html?site=wykop.pl#https://wykop.pl/wpis/restored'));
console.log('PASS — existing Wykop tab, cached navigation, subdomains, active timed access and expiry');

const popup = 'popup.html';
const popupRule = { type: 'add-current-site', domain: 'example.org', group: 'block' };
const stale = await chrome.storage.local.get(['sites', 'limits']);
assert.match((await send(popupRule, popup)).error, /nie przyznał/);
assert.deepEqual((await chrome.storage.local.get(['sites'])).sites, stale.sites);
nextAllowed = true;
const added = await send(popupRule, popup);
assert.deepEqual(added, { group: 'block', active: false });
assert.deepEqual(requested.at(-1).origins, ['http://*.example.org/*', 'https://*.example.org/*']);
assert.equal(tabs.get(3), getURL('reader.html?site=example.org#https://allowed.example.org/'));
const afterAdd = await chrome.storage.local.get(['sites']);
assert.deepEqual(afterAdd.sites.block, ['wykop.pl', 'example.org']);
assert.match((await send({ type: 'save-sites', sites: stale.sites, limits: stale.limits, expectedSites: stale.sites, expectedLimits: stale.limits }, 'options.html')).error, /innym oknie/);
assert.deepEqual((await chrome.storage.local.get(['sites'])).sites.block, ['wykop.pl', 'example.org']);
assert.match((await send({ ...popupRule, domain: 'sub.wykop.pl' }, popup)).error, /występuje już/);
assert.match((await send({ ...popupRule, group: 'other' }, popup)).error, /poprawną/);
assert.deepEqual(await send({ ...popupRule, group: 'long' }, popup), { group: 'long', active: false });
const moved = (await chrome.storage.local.get(['sites'])).sites;
assert.deepEqual(moved.block, ['wykop.pl']);
assert.deepEqual(moved.long, ['gazeta.pl', 'example.org']);
assert.deepEqual(await send({ type: 'save-sites', sites: moved, limits: stale.limits, expectedSites: moved, expectedLimits: stale.limits }, 'options.html'), {});
console.log('PASS — scoped permission, append and move, immediate block, overlap validation, stale options protection');

const timed = 'reader.html?site=example.org#https://example.org/wpis/12';
assert.equal((await chrome.storage.local.get(['waitSeconds'])).waitSeconds, 30);
for (const invalid of ['', '-1', '0.5', '99x', Infinity, 10 ** 30]) {
  assert.throws(() => readWaitSeconds(invalid), /pełną liczbę sekund/);
}
let previousWait = 30;
for (const [index, waitSeconds] of [60, 120, 0].entries()) {
  const config = await chrome.storage.local.get(['sites', 'limits']);
  const options = { type: 'save-sites', ...config, expectedSites: config.sites, expectedLimits: config.limits,
    expectedWaitSeconds: previousWait, waitSeconds };
  assert.deepEqual(await send(options, 'options.html'), {});
  assert.equal((await chrome.storage.local.get(['waitSeconds'])).waitSeconds, waitSeconds);
  const tabId = 20 + index;
  const start = now;
  const shown = await send({ type: 'show' }, timed, tabId);
  assert.equal(shown.readyAt, start + waitSeconds * 1000);
  assert.equal((await chrome.storage.local.get(['access'])).access.long, undefined);
  if (waitSeconds > 0) {
    now = shown.readyAt - 1;
    assert.match((await send({ type: 'enter' }, timed, tabId)).error, /Odczekaj/);
  }
  previousWait = waitSeconds;
}
assert.deepEqual(await send({ ...popupRule, domain: 'another.example.net' }, popup), { group: 'block', active: false });
assert.equal((await chrome.storage.local.get(['waitSeconds'])).waitSeconds, 0);
const config = await chrome.storage.local.get(['sites', 'limits']);
const invalidSave = { type: 'save-sites', ...config, expectedSites: config.sites, expectedLimits: config.limits, expectedWaitSeconds: 0 };
assert.match((await send({ ...invalidSave, waitSeconds: -1 }, 'options.html')).error, /pełną liczbę sekund/);
assert.match((await send({ ...invalidSave, expectedWaitSeconds: 120, waitSeconds: 60 }, 'options.html')).error, /innym oknie/);
assert.equal((await chrome.storage.local.get(['waitSeconds'])).waitSeconds, 0);
assert.deepEqual(await send({ type: 'enter' }, timed, 22), { url: 'https://example.org/wpis/12' });
assert.equal((await chrome.storage.local.get(['access'])).access.long.startAt, now);
assert.deepEqual(await send({ type: 'show' }, blockedSite(), 30), { group: 'block' });
function blockedSite() { return 'reader.html?site=wykop.pl#https://wykop.pl/'; }
console.log('PASS — default 30, editable 60/120/0, no early entry, explicit click at zero, persistence');

const rejected = await send({ ...popupRule, domain: 'sub.wykop.pl' }, popup);
assert.equal(rejected.errorInfo.key, 'domainOverlap');
const { translator, errorText } = await import('../i18n.mjs');
assert.match(errorText(translator('en'), rejected), /overlaps.*sub\.wykop\.pl/);
console.log('PASS — worker errors carry translatable metadata');
