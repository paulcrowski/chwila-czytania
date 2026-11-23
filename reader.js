import { mountBookContent } from './reader-content.mjs';
import { mountReaderQuotes } from './reader-quotes.mjs';
import { trackReading } from './reader-activity.mjs';
import { mountReaderScroll } from './reader-scroll.mjs';
import { mountReaderAppearance } from './reader-appearance.mjs';
import { sampleFor } from './sample.mjs';
import { errorText, localizeDocument, translator } from './i18n.mjs';

const local = chrome.storage.local;
const samplePageKey = 'samplePage';
const saved = await local.get(['book', 'page', samplePageKey, 'language', 'readerAppearance']);
let language = saved.language ?? 'pl';
let t = translator(language);
const appearance = mountReaderAppearance(local, saved.readerAppearance, t);
let customBook = saved.book;
let legacyPage = (customBook ? saved.page : saved[samplePageKey]) ?? 0;
const openQuotes = location.hash === '#quotes';
const { scrollTo, setProgress } = mountReaderScroll();
const title = document.querySelector('#title');
const text = document.querySelector('#text');
const label = document.querySelector('#page');
const chapterPicker = document.querySelector('#chapter-picker');
const chapterSelect = document.querySelector('#chapter');
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

const quotes = await mountReaderQuotes({
  local, text, jump: (page, paragraph) => content.jump(page, paragraph),
  translate: (...args) => t(...args),
});
const content = mountBookContent({
  local, text, title, label, previous, next, chapterSelect,
  sentinel: document.querySelector('#next-fragment'),
  scrollTo, setProgress,
  onChange(book, bookId) {
    quotes.setBook(book, bookId);
  },
});

function renderChapters() {
  const oldValue = chapterSelect.value;
  const chapters = customBook?.chapters ?? [];
  chapterPicker.hidden = chapters.length < 2;
  const options = chapters.map((chapter, index) => {
    const option = document.createElement('option');
    option.value = chapter.startPage;
    option.textContent = chapter.title || t('chapterNumber', index + 1);
    return option;
  });
  chapterSelect.replaceChildren(...options);
  if (options.some(option => option.value === oldValue)) chapterSelect.value = oldValue;
}

function loadBook(showQuotes = false) {
  renderChapters();
  return content.load(customBook ?? sampleFor(language), customBook ? 'page' : samplePageKey, legacyPage, showQuotes);
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

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  if (changes.language) {
    language = changes.language.newValue ?? 'pl';
    t = translator(language);
    localizeDocument(language, t);
    appearance.setLanguage(t);
    renderAccess();
    quotes.render();
  }
  if (changes.readerAppearance) appearance.apply(changes.readerAppearance.newValue);
  if (changes.book) {
    customBook = changes.book.newValue;
    legacyPage = changes.page?.newValue ?? 0;
    loadBook().catch(console.error);
  } else if (changes.language) {
    if (customBook) renderChapters();
    else loadBook().catch(console.error);
  }
});

localizeDocument(language, t);
await loadBook(openQuotes);
if (openQuotes) quotes.open(scrollTo);
if (domain) {
  renderAccess();
  try {
    const navigation = performance.getEntriesByType('navigation')[0];
    accessResult = await chrome.runtime.sendMessage({
      type: 'show',
      countOpening: navigation?.type === 'navigate',
    });
    if (accessResult?.group) {
      trackReading(duration => {
        chrome.runtime.sendMessage({ type: 'reading-time', duration }).catch(() => {});
      });
    }
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
