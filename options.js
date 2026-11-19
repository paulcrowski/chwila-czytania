import { DEFAULT_WAIT_SECONDS, EMPTY_SITES, EXAMPLE_SITES, MINUTES, domainOrigins, readLimits, readSites, readWaitSeconds } from './model.mjs';
import { sampleFor } from './sample.mjs';
import { appError, checkResponse, errorText, localizeDocument, translator } from './i18n.mjs';
import { makeBook } from './book.mjs';

const local = chrome.storage.local;
const { sites, limits = MINUTES, book: savedBook, language = 'pl', waitSeconds = DEFAULT_WAIT_SECONDS } =
  await local.get(['sites', 'limits', 'book', 'language', 'waitSeconds']);
let currentLanguage = language;
let current = savedBook;
let t = translator(language);
let savedSites = sites;
let savedLimits = limits;
let savedWaitSeconds = waitSeconds;
let draftSites = structuredClone(sites ?? EXAMPLE_SITES);
let saving = false;

const save = document.querySelector('#save');
const siteStatus = document.querySelector('#site-status');
const siteState = document.querySelector('#site-state');
const waitInput = document.querySelector('#wait-seconds');
const bookInput = document.querySelector('#book');
const bookStatus = document.querySelector('#book-status');
const currentBook = document.querySelector('#current-book');
const languageSelect = document.querySelector('#language');
const languageStatus = document.querySelector('#language-status');

const groups = Object.keys(EMPTY_SITES);
const fields = Object.fromEntries(groups.map(group => [group, {
  fieldset: document.querySelector('[data-group="' + group + '"]'),
  entry: document.getElementById(group + '-add'),
  list: document.getElementById(group + '-domains'),
  minutes: document.getElementById(group + '-minutes'),
}]));

function limitValues() {
  return Object.fromEntries(Object.keys(MINUTES).map(group => [group, fields[group].minutes.value]));
}

function pendingSites(includeEntry) {
  return readSites(Object.fromEntries(groups.map(group => {
    const extra = includeEntry(group) ? fields[group].entry.value : '';
    return [group, [...draftSites[group], extra].join('\n')];
  })));
}

function updateState() {
  const minutes = limitValues();
  const dirty = !savedSites
    || groups.some(group => fields[group].entry.value.trim() || draftSites[group].join() !== savedSites[group].join())
    || Object.keys(MINUTES).some(group => minutes[group] !== String(savedLimits[group]))
    || waitInput.value !== String(savedWaitSeconds);

  save.disabled = saving || !dirty;
  siteState.toggleAttribute('data-dirty', dirty && !saving);
  siteState.textContent = t(saving ? 'saving' : dirty ? 'unsaved' : 'saved');
}

function status(message = '') {
  siteStatus.textContent = message;
  siteStatus.hidden = !message;
}

function onChange() {
  status();
  updateState();
}

function renderGroup(group) {
  const { list, entry } = fields[group];
  list.replaceChildren(...draftSites[group].map((domain, index) => {
    const item = document.createElement('li');
    const name = document.createElement('span');
    const remove = document.createElement('button');
    name.textContent = domain;
    remove.type = 'button';
    remove.textContent = '×';
    remove.setAttribute('aria-label', t('removeDomain', domain));
    remove.addEventListener('click', () => {
      draftSites[group].splice(index, 1);
      renderGroup(group);
      onChange();
      const next = list.children[index] ?? list.children[index - 1];
      (next?.querySelector('button') ?? entry).focus();
    });
    item.append(name, remove);
    return item;
  }));
}

function addDomains(group) {
  const { entry } = fields[group];
  if (!entry.value.trim()) {
    entry.focus();
    return;
  }
  try {
    draftSites = pendingSites(key => key === group);
    entry.value = '';
    renderGroup(group);
    onChange();
  } catch (error) {
    status(errorText(t, error));
  }
  entry.focus();
}

function confirmation(nextSites, nextLimits, nextWaitSeconds) {
  const changes = [];
  for (const group of groups) {
    const previous = savedSites?.[group] ?? [];
    const added = nextSites[group].filter(domain => !previous.includes(domain));
    if (!added.length) continue;
    const scope = group === 'block' ? t('permanentBlock') : t('minutesPerDay', nextLimits[group]);
    changes.push(added.join(', ') + ' · ' + scope);
  }
  const removed = Object.values(savedSites ?? EMPTY_SITES).flat().filter(domain => !Object.values(nextSites).flat().includes(domain));
  if (removed.length) changes.push(t('domainRemoved', removed.join(', ')));
  for (const [group, name] of [['short', 'group1'], ['long', 'group2']]) {
    if (nextLimits[group] !== savedLimits[group]) changes.push(t('newLimit', t(name), nextLimits[group]));
  }
  if (nextWaitSeconds !== savedWaitSeconds) {
    changes.push(nextWaitSeconds === 0 ? t('noWait') : t('newWait', nextWaitSeconds));
  }
  return changes.length ? changes.join('. ') + '.' : '';
}

for (const group of groups) {
  const { fieldset, entry, minutes } = fields[group];
  if (minutes) {
    minutes.value = limits[group];
    minutes.addEventListener('input', onChange);
  }
  entry.addEventListener('input', onChange);
  entry.addEventListener('keydown', event => {
    if (event.key !== 'Enter' || event.isComposing) return;
    event.preventDefault();
    addDomains(group);
  });
  fieldset.querySelector('.add').addEventListener('click', () => addDomains(group));
}
waitInput.value = waitSeconds;
waitInput.addEventListener('input', onChange);
function applyLanguage() {
  t = translator(currentLanguage);
  localizeDocument(currentLanguage, t);
  languageSelect.value = currentLanguage;
  for (const group of groups) renderGroup(group);
  currentBook.textContent = t('currentBook', (current ?? sampleFor(currentLanguage)).title);
  status();
  bookStatus.textContent = '';
  updateState();
}

languageSelect.addEventListener('change', async () => {
  const nextLanguage = languageSelect.value;
  languageSelect.disabled = true;
  languageStatus.hidden = true;
  try {
    await local.set({ language: nextLanguage });
    currentLanguage = nextLanguage;
    applyLanguage();
  } catch {
    languageSelect.value = currentLanguage;
    languageStatus.textContent = t('languageError');
    languageStatus.hidden = false;
  } finally {
    languageSelect.disabled = false;
  }
});
applyLanguage();

document.querySelector('#sites').addEventListener('submit', async event => {
  event.preventDefault();
  if (saving) return;
  try {
    const nextSites = pendingSites(() => true);
    const nextLimits = readLimits(limitValues());
    const nextWaitSeconds = readWaitSeconds(waitInput.value);
    saving = true;
    waitInput.disabled = true;
    for (const field of Object.values(fields)) field.fieldset.disabled = true;
    updateState();
    status();

    const origins = Object.values(nextSites).flat().flatMap(domainOrigins);
    if (origins.length && !(await chrome.permissions.request({ origins }))) {
      throw appError('savePermission');
    }
    const response = await chrome.runtime.sendMessage({
      type: 'save-sites',
      sites: nextSites,
      limits: nextLimits,
      waitSeconds: nextWaitSeconds,
      expectedSites: savedSites ?? null,
      expectedLimits: savedLimits,
      expectedWaitSeconds: savedWaitSeconds,
    });
    checkResponse(response);

    status(confirmation(nextSites, nextLimits, nextWaitSeconds));
    savedSites = nextSites;
    savedLimits = nextLimits;
    savedWaitSeconds = nextWaitSeconds;
    waitInput.value = nextWaitSeconds;
    draftSites = structuredClone(nextSites);
    for (const group of groups) {
      const { entry, minutes } = fields[group];
      entry.value = '';
      if (minutes) minutes.value = nextLimits[group];
      renderGroup(group);
    }
  } catch (error) {
    status(t('saveError', errorText(t, error)));
  } finally {
    saving = false;
    waitInput.disabled = false;
    for (const field of Object.values(fields)) field.fieldset.disabled = false;
    updateState();
  }
});

bookInput.addEventListener('change', async () => {
  const file = bookInput.files[0];
  if (!file) return;
  bookInput.disabled = true;
  try {
    if (!file.name.toLowerCase().endsWith('.txt')) throw appError('txtOnly');
    const book = makeBook(file.name, await file.text());
    await local.set({ book, page: 0 });
    current = book;
    currentBook.textContent = t('currentBook', book.title);
    bookStatus.textContent = t('bookReady');
  } catch (error) {
    bookStatus.textContent = errorText(t, error);
  } finally {
    bookInput.value = '';
    bookInput.disabled = false;
  }
});
