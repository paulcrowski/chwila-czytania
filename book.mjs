import { appError } from './i18n.mjs';

export function paginate(text) {
  const words = /\S+/g;
  const pages = [];
  let pageStart = 0;
  let count = 0;
  for (const word of text.matchAll(words)) {
    if (count > 0 && count % 180 === 0) {
      pages.push(text.slice(pageStart, word.index).trim());
      pageStart = word.index;
    }
    count++;
  }
  if (count) pages.push(text.slice(pageStart).trim());
  return pages;
}

export function makeBook(title, text) {
  const pages = paginate(text);
  if (!pages.length) throw appError('emptyBook');
  return { title: title.replace(/\.txt$/i, ''), pages };
}
