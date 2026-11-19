import { SAMPLE } from './sample.mjs';

const local = chrome.storage.local;
const saved = await local.get(['book', 'page', 'samplePage']);
let book = saved.book ?? SAMPLE;
let page = (saved.book ? saved.page : saved.samplePage) ?? 0;
const title = document.querySelector('#title');
const text = document.querySelector('#text');
const label = document.querySelector('#page');
const previous = document.querySelector('#previous');
const next = document.querySelector('#next');
const portal = document.querySelector('#portal');
const access = document.querySelector('#access');
const enter = document.querySelector('#enter');

function renderPage() {
  page = Math.max(0, Math.min(page, book.pages.length - 1));
  title.textContent = book.title;
  text.textContent = book.pages[page];
  label.textContent = (page + 1) + ' / ' + book.pages.length;
  previous.disabled = page === 0;
  next.disabled = page === book.pages.length - 1;
}

function move(offset) {
  page += offset;
  renderPage();
  const pageKey = book === SAMPLE ? 'samplePage' : 'page';
  local.set({ [pageKey]: page });
}

previous.addEventListener('click', () => move(-1));
next.addEventListener('click', () => move(1));
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.book) {
    book = changes.book.newValue ?? SAMPLE;
    page = changes.page?.newValue ?? 0;
    renderPage();
  }
});
renderPage();

function renderAccess(result, domain) {
  enter.hidden = true;
  if (result.error) {
    access.textContent = result.error;
  } else if (result.group === 'block') {
    access.textContent = domain + ' · stała blokada';
  } else if (result.used) {
    access.textContent = domain + ' · dzisiejsze ' + result.minutes + ' min już minęło.';
  } else if (result.readyAt) {
    const update = () => {
      const seconds = Math.max(0, Math.ceil((result.readyAt - Date.now()) / 1000));
      if (seconds) {
        enter.hidden = false;
        enter.disabled = true;
        enter.textContent = 'Otwórz za ' + seconds + ' s';
        setTimeout(update, 250);
      } else {
        access.textContent = result.endAt ? domain + ' · sesja już trwa.' : domain + ' · po kliknięciu masz ' + result.minutes + ' min.';
        enter.hidden = false;
        enter.disabled = false;
        enter.textContent = 'Otwórz portal';
      }
    };
    access.textContent = domain + ' · chwila na czytanie przed wejściem';
    update();
  } else {
    portal.hidden = true;
  }
}

const domain = new URLSearchParams(location.search).get('site');
if (domain) {
  portal.hidden = false;
  access.textContent = 'Sprawdzanie dostępu…';
  try {
    renderAccess(await chrome.runtime.sendMessage({ type: 'show' }), domain);
  } catch {
    access.textContent = 'Nie udało się sprawdzić dostępu. Odśwież kartę.';
  }
  enter.addEventListener('click', async () => {
    enter.disabled = true;
    try {
      const result = await chrome.runtime.sendMessage({ type: 'enter' });
      if (result.url) location.replace(result.url);
      else renderAccess(result, domain);
    } catch {
      access.textContent = 'Nie udało się otworzyć strony. Spróbuj ponownie.';
      enter.disabled = false;
    }
  });
}
