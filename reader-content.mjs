import { bookIdentity, pageParagraphs } from './book-position.mjs';

const readingLine = 40;

export function mountBookContent({ local, text, title, label, previous, next, chapterSelect, sentinel, scrollTo, setProgress, onChange }) {
  let book, bookId, legacyKey;
  let generation = 0;
  let loading = false;
  let paragraphs = [];
  let lastPage;
  let counts = new Map();
  let active;
  let savedPosition;
  let targetInMotion;
  let scanning = false;

  function append(index) {
    const fragment = document.createDocumentFragment();
    const parts = pageParagraphs(book.pages[index]);
    counts.set(index, parts.length);
    for (const [paragraph, content] of parts.entries()) {
      const element = document.createElement('p');
      element.dataset.page = index;
      element.dataset.paragraph = paragraph;
      element.textContent = content;
      paragraphs.push(element);
      fragment.append(element);
    }
    text.append(fragment);
    lastPage = index;
  }

  function show(page) {
    const chapter = book.chapters?.findLast(entry => entry.startPage <= page);
    if (chapter) chapterSelect.value = chapter.startPage;
    label.textContent = (page + 1) + ' / ' + book.pages.length;
    previous.disabled = page === 0;
    next.disabled = page === book.pages.length - 1;
  }

  function remember(element) {
    active = element;
    const page = Number(element.dataset.page);
    const paragraph = Number(element.dataset.paragraph);
    const bounds = element.getBoundingClientRect();
    const offset = bounds.height ? Math.min(1, Math.max(0, (readingLine - bounds.top) / bounds.height)) : 0;
    setProgress((page + (paragraph + offset) / counts.get(page)) / book.pages.length);
    if (active === savedPosition) return;
    show(page);
    savedPosition = active;
    local.set({ [legacyKey]: page, ['reading-position:' + bookId]: { page, paragraph } }).catch(console.error);
  }

  function locate() {
    let left = 0;
    let right = paragraphs.length - 1;
    while (left < right) {
      const middle = Math.floor((left + right) / 2);
      if (paragraphs[middle].getBoundingClientRect().bottom > readingLine) right = middle;
      else left = middle + 1;
    }
    return paragraphs[left];
  }

  function syncPosition() {
    if (loading || !paragraphs.length || text.getBoundingClientRect().top > readingLine) return;
    if (targetInMotion) return;
    remember(locate());
  }

  function jump(pageIndex, paragraphIndex = 0, behavior = 'smooth', shouldScroll = true) {
    if (loading || !book) return;
    const page = Math.max(0, Math.min(pageIndex, book.pages.length - 1));
    paragraphs = [];
    counts = new Map();
    text.replaceChildren();
    targetInMotion = false;
    append(page);
    if (page + 1 < book.pages.length) append(page + 1);
    const target = paragraphs.find(el => Number(el.dataset.page) === page && Number(el.dataset.paragraph) === paragraphIndex)
      ?? paragraphs[0];
    remember(target);
    observer.unobserve(sentinel);
    observer.observe(sentinel);
    if (shouldScroll) {
      targetInMotion = true;
      scrollTo(target, behavior);
    }
  }

  window.addEventListener('scroll', () => {
    if (scanning) return;
    scanning = true;
    requestAnimationFrame(() => {
      scanning = false;
      syncPosition();
    });
  }, { passive: true });
  window.addEventListener('scrollend', () => {
    if (targetInMotion) targetInMotion = false;
    else syncPosition();
  });
  for (const event of ['wheel', 'touchstart', 'pointerdown', 'keydown']) {
    window.addEventListener(event, () => { targetInMotion = false; }, { passive: true });
  }
  const observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting) && book && lastPage < book.pages.length - 1) {
      append(lastPage + 1);
      observer.unobserve(sentinel);
      observer.observe(sentinel);
    }
  }, { rootMargin: '0px 0px 600px' });
  observer.observe(sentinel);

  previous.addEventListener('click', () => jump(Number(active.dataset.page) - 1));
  next.addEventListener('click', () => jump(Number(active.dataset.page) + 1));
  chapterSelect.addEventListener('change', () => jump(Number(chapterSelect.value)));

  return {
    jump,
    async load(nextBook, fallbackKey, fallbackPage, showQuotes) {
      const request = ++generation;
      loading = true;
      const nextId = await bookIdentity(nextBook);
      const positionKey = 'reading-position:' + nextId;
      const position = (await local.get(positionKey))[positionKey] ?? { page: fallbackPage, paragraph: 0 };
      if (request !== generation) return;
      loading = false;
      book = nextBook;
      bookId = nextId;
      legacyKey = fallbackKey;
      targetInMotion = false;
      title.textContent = book.title;
      title.lang = text.lang = book.language ?? '';
      const resume = position.page > 0 || position.paragraph > 0;
      jump(position.page, position.paragraph, 'instant', !showQuotes && resume);
      if (!showQuotes && !resume && window.scrollY > 0) {
        targetInMotion = true;
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
      onChange(book, bookId);
    },
  };
}
