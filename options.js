import { EMPTY_SITES, EXAMPLE_SITES, MINUTES, readLimits, readSites } from './model.mjs';
import { SAMPLE } from './sample.mjs';
import { makeBook } from './book.mjs';

const local = chrome.storage.local;
const { sites, limits = MINUTES, book = SAMPLE } = await local.get(['sites', 'limits', 'book']);
let savedSites = sites;
let savedLimits = limits;
let draftSites = structuredClone(sites ?? EXAMPLE_SITES);
let saving = false;

const save = document.querySelector('#save');
const siteStatus = document.querySelector('#site-status');
const siteState = document.querySelector('#site-state');
const bookInput = document.querySelector('#book');
const bookStatus = document.querySelector('#book-status');
const currentBook = document.querySelector('#current-book');

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
    || Object.keys(MINUTES).some(group => minutes[group] !== String(savedLimits[group]));

  save.disabled = saving || !dirty;
  siteState.toggleAttribute('data-dirty', dirty && !saving);
  siteState.textContent = saving ? 'Zapisywanie…' : dirty ? 'Niezapisane zmiany' : 'Zapisano ustawienia';
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
    remove.setAttribute('aria-label', 'Usuń ' + domain);
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
    status(error.message);
  }
  entry.focus();
}

function confirmation(nextSites, nextLimits) {
  const changes = [];
  for (const group of groups) {
    const previous = savedSites?.[group] ?? [];
    const added = nextSites[group].filter(domain => !previous.includes(domain));
    if (!added.length) continue;
    const scope = group === 'block' ? 'stała blokada' : nextLimits[group] + ' min dziennie';
    changes.push(added.join(', ') + ' · ' + scope);
  }
  const removed = Object.values(savedSites ?? EMPTY_SITES).flat().filter(domain => !Object.values(nextSites).flat().includes(domain));
  if (removed.length) changes.push(removed.join(', ') + ' · usunięto z reguł');
  for (const [group, name] of [['short', 'Grupa 1'], ['long', 'Grupa 2']]) {
    if (nextLimits[group] !== savedLimits[group]) changes.push(name + ' · nowy limit ' + nextLimits[group] + ' min');
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
  renderGroup(group);
}
currentBook.textContent = 'W czytniku: ' + book.title;
updateState();

document.querySelector('#sites').addEventListener('submit', async event => {
  event.preventDefault();
  if (saving) return;
  try {
    const nextSites = pendingSites(() => true);
    const nextLimits = readLimits(limitValues());
    saving = true;
    for (const field of Object.values(fields)) field.fieldset.disabled = true;
    updateState();
    status();

    const origins = Object.values(nextSites).flat().flatMap(domain => [
      'http://*.' + domain + '/*', 'https://*.' + domain + '/*',
    ]);
    if (origins.length && !(await chrome.permissions.request({ origins }))) {
      throw new Error('Zezwól Chrome na obsługę wpisanych domen, aby zapisać reguły.');
    }
    const response = await chrome.runtime.sendMessage({ type: 'save-sites', sites: nextSites, limits: nextLimits });
    if (response.error) throw new Error(response.error);

    status(confirmation(nextSites, nextLimits));
    savedSites = nextSites;
    savedLimits = nextLimits;
    draftSites = structuredClone(nextSites);
    for (const group of groups) {
      const { entry, minutes } = fields[group];
      entry.value = '';
      if (minutes) minutes.value = nextLimits[group];
      renderGroup(group);
    }
  } catch (error) {
    status('Zapis nie powiódł się. ' + error.message);
  } finally {
    saving = false;
    for (const field of Object.values(fields)) field.fieldset.disabled = false;
    updateState();
  }
});

bookInput.addEventListener('change', async () => {
  const file = bookInput.files[0];
  if (!file) return;
  bookInput.disabled = true;
  try {
    if (!file.name.toLowerCase().endsWith('.txt')) throw new Error('Wybierz plik z rozszerzeniem .txt.');
    const book = makeBook(file.name, await file.text());
    await local.set({ book, page: 0 });
    currentBook.textContent = 'W czytniku: ' + book.title;
    bookStatus.textContent = 'Książka jest gotowa do czytania.';
  } catch (error) {
    bookStatus.textContent = error.message;
  } finally {
    bookInput.value = '';
    bookInput.disabled = false;
  }
});
