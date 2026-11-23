import assert from 'node:assert/strict';
const elements = new Map();
function element(selector) {
  if (!elements.has(selector)) {
    elements.set(selector, {
      replaceChildren(...children) { this.children = children; },
      children: [],
      append(fragment) { this.children.push(...fragment.children); },
      dataset: {},
      getBoundingClientRect() { return { top: 40, bottom: 100, height: 60 }; },
      options: selector === '#reader-theme' ? ['system', 'paper', 'night'].map(value => ({ value })) : [],
      style: { setProperty() {} },
      scrollIntoView(options) { this.scrolled = options; },
      hidden: true,
      listeners: {},
      addEventListener(name, callback) { this.listeners[name] = callback; },
    });
  }
  return elements.get(selector);
}
globalThis.document = { body: { dataset: {}, style: { setProperty() {} } }, documentElement: {}, querySelectorAll: () => [], querySelector: element, createElement: () => ({ dataset: {}, getBoundingClientRect: () => ({ top: 40, bottom: 100, height: 60 }), scrollIntoView(options) { this.scrolled = options; } }), createDocumentFragment: () => ({ children: [], append(el) { this.children.push(el); } }) };
const windowEvents = {};
Object.assign(globalThis, {
  window: { addEventListener(name, listener) { windowEvents[name] = listener; } },
  IntersectionObserver: class { observe() {} unobserve() {} },
  requestAnimationFrame: () => 1,
});
document.addEventListener = () => {};
let reduced = false;
globalThis.matchMedia = () => ({ get matches() { return reduced; } });
let visited;
globalThis.location = {
  search: '?site=example.org',
  replace(url) { visited = url; },
};
let now = 1_000_000;
Date.now = () => now;
let duration = 0;
let notifyStorage;
const changeLanguage = next => notifyStorage({ language: { newValue: next } }, 'local');
let tick;
globalThis.setTimeout = callback => { tick = callback; };
const messages = [];
globalThis.chrome = {
  storage: { local: { async get() { return this.saved ?? {}; }, async set(values) { this.saved = { ...this.saved, ...values }; } }, onChanged: { addListener(listener) { notifyStorage = listener; } } },
  runtime: {
    async sendMessage(message) {
      messages.push(message.type);
      return message.type === 'show'
        ? { group: 'short', readyAt: now + duration * 1000, minutes: 10 }
        : { url: 'https://example.org/' };
    },
  },
};
await import('../reader.js?immediate');
assert.equal(element('#enter').hidden, false);
assert.equal(element('#enter').disabled, false);
assert.equal(element('#enter').textContent, 'Otwórz portal');
assert.deepEqual(messages, ['show']);
assert.equal(visited, undefined);
await element('#enter').listeners.click();
assert.equal(visited, 'https://example.org/');
element('#next').listeners.click();
assert.deepEqual(element('#text').children[0].scrolled, { block: 'start', behavior: 'smooth' });
reduced = true;
element('#previous').listeners.click();
assert.equal(element('#text').children[0].scrolled.behavior, 'instant');
element('#next').listeners.click();
assert.equal(chrome.storage.local.saved.samplePage, 1);
elements.clear();
duration = 120;
await import('../reader.js?delayed');
assert.equal(element('#enter').disabled, true);
assert.equal(element('#enter').textContent, 'Otwórz za 120 s');
now += 60_000;
changeLanguage('en');
await new Promise(resolve => setImmediate(resolve));
assert.equal(element('#enter').textContent, 'Open in 60 s');
assert.equal(document.documentElement.lang, 'en');
assert.equal(messages.filter(message => message === 'show').length, 2);
now += 59_000;
tick();
assert.equal(element('#enter').disabled, true);
assert.equal(element('#enter').textContent, 'Open in 1 s');
now += 1000;
tick();
assert.equal(element('#enter').disabled, false);
assert.equal(element('#enter').textContent, 'Open site');
console.log('PASS — visible countdown and button with no automatic navigation');

const book = {
  title: 'Próba EPUB', language: 'pl', pages: ['Pierwsza strona', 'Kolejna strona', 'Następny rozdział'],
  chapters: [{ title: 'Pierwszy', startPage: 0 }, { title: 'Drugi', startPage: 2 }],
};
await chrome.storage.local.set({ book, page: 0 });
notifyStorage({ book: { newValue: book }, page: { newValue: 0 } }, 'local');
await new Promise(resolve => setImmediate(resolve));
assert.equal(element('#chapter-picker').hidden, false);
assert.equal(element('#chapter').children.length, 2);
element('#chapter').value = '2';
element('#chapter').listeners.change();
assert.equal(element('#text').children[0].textContent, 'Następny rozdział');
assert.equal(chrome.storage.local.saved.page, 2);

elements.clear();
globalThis.location.search = '';
await import('../reader.js?resume');
assert.equal(element('#page').textContent, '3 / 3');
assert.equal(element('#chapter').value, 2);
assert.equal(element('#text').children[0].textContent, 'Następny rozdział');
console.log('PASS — chapter jump and restored progress');
