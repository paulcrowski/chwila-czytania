import { EMPTY_SITES, MINUTES, sessionState } from './model.mjs';

const list = document.querySelector('#sessions');
const idle = document.querySelector('#idle');
let settings = await chrome.storage.local.get(['access', 'sites']);

function format(seconds) {
  return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
}

function render() {
  const { access = {}, sites = EMPTY_SITES } = settings;
  const now = Date.now();
  const rows = [];
  for (const [group, minutes] of Object.entries(MINUTES)) {
    const session = access[group];
    if (!sites[group].length || sessionState(session, now) !== 'active') continue;

    const remaining = Math.ceil((session.endAt - now) / 1000);
    const elapsed = Math.max(0, Math.floor((now - (session.startAt ?? session.endAt - minutes * 60_000)) / 1000));
    const row = document.createElement('li');
    const title = document.createElement('strong');
    const timer = document.createElement('span');
    const domain = sites[group].includes(session.domain) ? session.domain : sites[group][0];
    title.textContent = domain + ' · grupa ' + minutes + ' min';
    timer.textContent = 'Zostało ' + format(remaining) + ' · minęło ' + format(elapsed);
    row.append(title, timer);
    rows.push(row);
  }
  list.replaceChildren(...rows);
  list.hidden = rows.length === 0;
  idle.hidden = rows.length > 0;
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  for (const key of ['access', 'sites']) {
    if (changes[key]) settings[key] = changes[key].newValue;
  }
  render();
});
render();
setInterval(render, 1000);
