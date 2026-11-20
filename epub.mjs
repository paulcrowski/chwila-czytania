import { unzipSync } from './vendor/fflate.mjs';
import { paginate } from './book.mjs';
import { appError } from './i18n.mjs';

const MEBIBYTE = 1024 * 1024;
const ARCHIVE_ORIGIN = 'https://epub.invalid';
const CONTAINER = 'META-INF/container.xml';
const MIME_TYPE = 'application/epub+zip';
const XHTML_TYPE = 'application/xhtml+xml';
const HIDDEN = new Set(['script', 'style', 'svg', 'math', 'noscript', 'template', 'iframe', 'audio', 'video', 'nav']);
const BLOCK = new Set(['address', 'article', 'aside', 'blockquote', 'caption', 'dd', 'div', 'dl', 'dt',
  'figcaption', 'figure', 'footer', 'header', 'li', 'main', 'ol', 'p', 'pre', 'section',
  'table', 'td', 'th', 'tr', 'ul']);
const decoder = new TextDecoder();

function elements(node, name) {
  return Array.from(node?.getElementsByTagNameNS('*', name) ?? []);
}

function first(node, name) {
  return node?.getElementsByTagNameNS('*', name)[0];
}

function xml(bytes) {
  if (!bytes?.length) throw appError('epubFormat');
  const document = new DOMParser().parseFromString(decoder.decode(bytes), 'application/xml');
  if (!document.documentElement || first(document, 'parsererror')) throw appError('epubFormat');
  return document;
}

function resolvePath(baseFile, reference) {
  const basePath = baseFile.split('/').map(encodeURIComponent).join('/');
  const url = new URL(reference, ARCHIVE_ORIGIN + '/' + basePath);
  if (url.origin !== ARCHIVE_ORIGIN) return undefined;
  return decodeURIComponent(url.pathname.slice(1));
}

function archiveReader(bytes) {
  let total = 0;
  return (paths) => unzipSync(bytes, {
    filter({ name, originalSize }) {
      if (!paths.has(name)) return false;
      total += originalSize;
      if (originalSize > 8 * MEBIBYTE || total > 24 * MEBIBYTE) {
        throw appError('epubTooLarge');
      }
      return true;
    },
  });
}

function contentOf(body) {
  const parts = [];
  let title;
  const visit = (node) => {
    if (node.nodeType === 3 || node.nodeType === 4) {
      parts.push(node.nodeValue.replace(/\s+/g, ' '));
      return;
    }
    if (node.nodeType !== 1 || HIDDEN.has(node.localName) || node.hasAttribute('hidden')) return;

    const heading = /^h[1-6]$/.test(node.localName);
    if (heading && !title) title = node.textContent.replace(/\s+/g, ' ').trim();
    const block = heading || BLOCK.has(node.localName);
    if (block) parts.push('\n\n');
    if (node.localName === 'br') parts.push('\n');
    for (const child of Array.from(node.childNodes)) visit(child);
    if (block) parts.push('\n\n');
  };
  visit(body);
  const text = parts.join('').replace(/ +/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  return { title, pages: paginate(text) };
}

export async function readEpub(file) {
  if (file.size > 64 * MEBIBYTE) throw appError('epubTooLarge');
  try {
    const extract = archiveReader(new Uint8Array(await file.arrayBuffer()));
    const header = extract(new Set(['mimetype', CONTAINER]));
    if (decoder.decode(header.mimetype).trim() !== MIME_TYPE) throw appError('epubFormat');
    const container = xml(header[CONTAINER]);
    const packageReference = first(container, 'rootfile')?.getAttribute('full-path');
    if (!packageReference) throw appError('epubFormat');
    const packagePath = resolvePath('', packageReference);
    if (!packagePath) throw appError('epubFormat');
    const packageFile = xml(extract(new Set([packagePath]))[packagePath]);
    const metadata = first(packageFile, 'metadata');
    const title = first(metadata, 'title')?.textContent.trim() || file.name.replace(/\.epub$/i, '');
    const language = first(metadata, 'language')?.textContent.trim();
    const manifest = new Map(elements(first(packageFile, 'manifest'), 'item')
      .filter(item => item.getAttribute('media-type') === XHTML_TYPE)
      .map(item => [item.getAttribute('id'), item.getAttribute('href')]));
    const spine = elements(first(packageFile, 'spine'), 'itemref')
      .filter(item => item.getAttribute('linear') !== 'no')
      .map(item => manifest.get(item.getAttribute('idref')))
      .filter(Boolean)
      .map(href => resolvePath(packagePath, href));
    if (!spine.length || spine.some(path => !path)) throw appError('epubFormat');

    const content = extract(new Set(spine));
    const pages = [];
    const chapters = [];
    for (const path of spine) {
      const document = xml(content[path]);
      const body = first(document, 'body');
      if (!body) throw appError('epubFormat');
      const chapter = contentOf(body);
      if (!chapter.pages.length) continue;
      const heading = chapter.title || first(document, 'title')?.textContent.trim() || '';
      chapters.push({ title: heading, startPage: pages.length });
      pages.push(...chapter.pages);
    }
    if (!pages.length) throw appError('emptyBook');
    return { title, language, pages, chapters };
  } catch (error) {
    if (error.i18n) throw error;
    throw appError('epubFormat');
  }
}
