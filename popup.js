import { EMPTY_SITES, MINUTES, domainOrigins, groupFor, inDomain, normalizeDomain, sessionState } from './model.mjs';
import { appError, checkResponse, errorText, localizeDocument, translator } from './i18n.mjs';

const list = document.querySelector('#sessions');
const idle = document.querySelector('#idle');
const form = document.querySelector('#current-site');
const domainLabel = document.querySelector('#current-domain');
const rule = document.querySelector('#current-rule');
const save = document.querySelector('#save-rule');
const status = document.querySelector('#rule-status');
const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
let settings = await chrome.storage.local.get(['access', 'sites', 'limits', 'language']);
let t = translator(settings.language);
localizeDocument(settings.language, t);
let domain;
let hasAccess = false;
let saving = false;

function domainFromTab(url) {
  try {
    const page = new URL(url);
    if (page.protocol !== 'http:' && page.protocol !== 'https:') return;
    const host = normalizeDomain(page.hostname);
    const configured = Object.values(settings.sites ?? EMPTY_SITES).flat();
    return configured.find(existing => inDomain(host, existing)) ?? host;
  } catch {
    return undefined;
  }
}

function ruleLabel(group) {
  if (group === 'block') return t('block');
  const minutes = (settings.limits ?? MINUTES)[group];
  return t(group === 'short' ? 'group1' : 'group2') + ' · ' + minutes + ' min';
}

function renderRule() {
  if (!domain) return;
  for (const option of rule.options) option.textContent = ruleLabel(option.value);
  const savedGroup = groupFor(settings.sites ?? EMPTY_SITES, domain);
  const sameRule = savedGroup === rule.value;
  domainLabel.textContent = domain + (savedGroup ? ' · ' + ruleLabel(savedGroup) : '');
  rule.disabled = saving;
  save.disabled = saving || (sameRule && hasAccess);
  save.textContent = t(sameRule && !hasAccess ? 'grantAccess' : 'saveRule');
}

function notice(message) {
  status.textContent = message;
  status.hidden = !message;
}

async function setUpCurrentSite() {
  domain = domainFromTab(tab?.url);
  if (!domain) return;
  hasAccess = await chrome.permissions.contains({ origins: domainOrigins(domain) });
  const savedGroup = groupFor(settings.sites ?? EMPTY_SITES, domain);
  rule.value = savedGroup ?? 'block';
  form.hidden = false;
  renderRule();
  if (savedGroup && !hasAccess) notice(t('accessNeeded'));
}

rule.addEventListener('change', () => {
  notice('');
  renderRule();
});
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!domain || saving || save.disabled) return;
  const selected = rule.value;
  saving = true;
  notice(t('saving'));
  renderRule();
  try {
    const origins = domainOrigins(domain);
    if (!(await chrome.permissions.request({ origins }))) {
      throw appError('accessDenied');
    }
    const result = checkResponse(await chrome.runtime.sendMessage({ type: 'add-current-site', domain, group: selected }));
    hasAccess = true;
    notice(t(result.active ? 'ruleSavedActive' : 'ruleSavedReader'));
  } catch (error) {
    notice(errorText(t, error));
  } finally {
    saving = false;
    renderRule();
  }
});

function format(seconds) {
  return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
}

function render() {
  const { access = {}, sites = EMPTY_SITES } = settings;
  const now = Date.now();
  const rows = [];
  for (const group of Object.keys(MINUTES)) {
    const session = access[group];
    if (!sites[group].length || sessionState(session, now) !== 'active') continue;
    const minutes = session.minutes ?? MINUTES[group];

    const remaining = Math.ceil((session.endAt - now) / 1000);
    const elapsed = Math.max(0, Math.floor((now - (session.startAt ?? session.endAt - minutes * 60_000)) / 1000));
    const row = document.createElement('li');
    const title = document.createElement('strong');
    const timer = document.createElement('span');
    const domain = sites[group].includes(session.domain) ? session.domain : sites[group][0];
    title.textContent = t('sessionTitle', domain, minutes);
    timer.textContent = t('timerDetails', format(remaining), format(elapsed));
    row.append(title, timer);
    rows.push(row);
  }
  list.replaceChildren(...rows);
  list.hidden = rows.length === 0;
  idle.hidden = rows.length > 0;
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  for (const key of ['access', 'sites', 'limits']) {
    if (changes[key]) settings[key] = changes[key].newValue;
  }
  if (changes.language) {
    t = translator(changes.language.newValue);
    localizeDocument(changes.language.newValue, t);
    notice('');
  }
  renderRule();
  render();
});
setUpCurrentSite().catch(() => {
  form.hidden = false;
  save.disabled = true;
  notice(t('accessCheckFailed'));
});
render();
setInterval(render, 1000);
