import { sampleFor } from './sample.mjs';
import { errorText, localizeDocument, translator } from './i18n.mjs';

const local = chrome.storage.local;
const samplePageKey = 'samplePage';
const saved = await local.get(['book', 'page', samplePageKey, 'language']);
let language = saved.language ?? 'pl';
let t = translator(language);
let customBook = saved.book;
let page = (customBook ? saved.page : saved[samplePageKey]) ?? 0;
const title = document.querySelector('#title');
const text = document.querySelector('#text');
const label = document.querySelector('#page');
const previous = document.querySelector('#previous');
const next = document.querySelector('#next');
const portal = document.querySelector('#portal');
const access = document.querySelector('#access');
const enter = document.querySelector('#enter');
const domain = new URLSearchParams(location.search).get('site');
let accessResult;
let countdown;
let checkFailed = false;
let opening = false;
let openFailed = false;

function renderPage() {
  const book = customBook ?? sampleFor(language);
  page = Math.max(0, Math.min(page, book.pages.length - 1));
  title.textContent = book.title;
  text.textContent = book.pages[page];
  title.lang = text.lang = book.language ?? '';
  label.textContent = (page + 1) + ' / ' + book.pages.length;
  previous.disabled = page === 0;
  next.disabled = page === book.pages.length - 1;
}

function move(offset) {
  page += offset;
  renderPage();
  local.set({ [customBook ? 'page' : samplePageKey]: page });
}

function renderAccess() {
  clearTimeout(countdown);
  enter.hidden = true;
  if (!domain) return;
  portal.hidden = false;
  const result = accessResult;
  if (checkFailed) {
    access.textContent = t('refreshReader');
  } else if (!result) {
    access.textContent = t('checkingAccess');
  } else if (result.error) {
    access.textContent = errorText(t, result);
  } else if (result.group === 'block') {
    access.textContent = domain + ' · ' + t('permanentBlock');
  } else if (result.used) {
    access.textContent = t('dailyUsed', domain, result.minutes);
  } else if (result.readyAt !== undefined) {
    const seconds = Math.max(0, Math.ceil((result.readyAt - Date.now()) / 1000));
    enter.hidden = false;
    enter.disabled = opening || seconds > 0;
    enter.textContent = seconds ? t('openAfter', seconds) : t('openSite');
    if (seconds) {
      access.textContent = t('readFirst', domain);
      countdown = setTimeout(renderAccess, 250);
    } else if (openFailed) {
      access.textContent = t('tryOpenAgain');
    } else {
      access.textContent = t(result.endAt ? 'alreadyActive' : 'timeOnClick', domain, result.minutes);
    }
  } else {
    portal.hidden = true;
  }
}

previous.addEventListener('click', () => move(-1));
next.addEventListener('click', () => move(1));
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  if (changes.language) {
    language = changes.language.newValue ?? 'pl';
    t = translator(language);
    localizeDocument(language, t);
    renderAccess();
  }
  if (changes.book) {
    customBook = changes.book.newValue;
    page = changes.page?.newValue ?? 0;
  }
  if (changes.book || changes.language) renderPage();
});

localizeDocument(language, t);
renderPage();
if (domain) {
  renderAccess();
  try {
    accessResult = await chrome.runtime.sendMessage({ type: 'show' });
  } catch {
    checkFailed = true;
  }
  renderAccess();
  enter.addEventListener('click', async () => {
    opening = true;
    openFailed = false;
    renderAccess();
    try {
      const result = await chrome.runtime.sendMessage({ type: 'enter' });
      if (result.url) location.replace(result.url);
      else accessResult = result;
    } catch {
      openFailed = true;
    } finally {
      opening = false;
      renderAccess();
    }
  });
}
