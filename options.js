import { EMPTY_SITES, EXAMPLE_SITES, MINUTES, readSites } from './model.mjs';
import { SAMPLE } from './sample.mjs';
import { makeBook } from './book.mjs';

const fields = Object.fromEntries(Object.keys(EXAMPLE_SITES).map(key => [key, document.getElementById(key)]));
const save = document.querySelector('#save');
const bookInput = document.querySelector('#book');
const bookStatus = document.querySelector('#book-status');
const siteStatus = document.querySelector('#site-status');
const siteState = document.querySelector('#site-state');
const currentBook = document.querySelector('#current-book');
const local = chrome.storage.local;
const { sites, book = SAMPLE } = await local.get(['sites', 'book']);

for (const [key, field] of Object.entries(fields)) {
  field.value = (sites ?? EXAMPLE_SITES)[key].join('\n');
}
currentBook.textContent = 'W czytniku: ' + book.title;
let savedSites = sites;
const fieldValues = () => Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, field.value]));
let savedValues = fieldValues();

function updateSaveState() {
  const dirty = !savedSites || Object.keys(fields).some(key => fields[key].value !== savedValues[key]);
  save.disabled = !dirty;
  siteState.textContent = dirty ? 'Niezapisane zmiany' : 'Lista stron jest zapisana';
}

function successMessage(next, previous = EMPTY_SITES) {
  const changes = [];
  for (const [group, domains] of Object.entries(next)) {
    const added = domains.filter(domain => !previous[group].includes(domain));
    if (!added.length) continue;
    const label = added.join(', ');
    changes.push(group === 'block'
      ? label + ' · stała blokada'
      : label + ' · grupa ' + MINUTES[group] + ' min');
  }
  const removed = Object.values(previous).flat().filter(domain => !Object.values(next).flat().includes(domain));
  if (removed.length) changes.push(removed.join(', ') + ' · usunięto z listy');
  return changes.length ? changes.join('. ') + '.' : 'Zapisano listę stron.';
}

for (const field of Object.values(fields)) {
  field.addEventListener('input', () => {
    siteStatus.textContent = '';
    updateSaveState();
  });
}
updateSaveState();

document.querySelector('#sites').addEventListener('submit', async event => {
  event.preventDefault();
  save.disabled = true;
  for (const field of Object.values(fields)) field.disabled = true;
  siteStatus.textContent = '';
  try {
    const currentValues = fieldValues();
    const sites = readSites(currentValues);
    const origins = Object.values(sites).flat().flatMap(domain => [
      'http://*.' + domain + '/*', 'https://*.' + domain + '/*',
    ]);
    if (origins.length && !(await chrome.permissions.request({ origins }))) {
      throw new Error('Zezwól Chrome na obsługę wpisanych stron, aby włączyć przekierowanie.');
    }
    const response = await chrome.runtime.sendMessage({ type: 'save-sites', sites });
    if (response.error) throw new Error(response.error);
    siteStatus.textContent = successMessage(sites, savedSites);
    savedSites = sites;
    savedValues = currentValues;
  } catch (error) {
    siteStatus.textContent = 'Zapis nie powiódł się. ' + error.message;
  } finally {
    for (const field of Object.values(fields)) field.disabled = false;
    updateSaveState();
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
