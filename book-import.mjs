import { makeBook } from './book.mjs';
import { appError } from './i18n.mjs';

export async function importBook(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.txt')) return makeBook(file.name, await file.text());
  if (name.endsWith('.epub')) {
    const { readEpub } = await import('./epub.mjs');
    return readEpub(file);
  }
  throw appError('bookFormats');
}
