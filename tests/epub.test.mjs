import assert from 'node:assert/strict';
import test from 'node:test';
import { DOMParser } from '@xmldom/xmldom';
import { importBook } from '../book-import.mjs';
import { strToU8, zipSync } from '../vendor/fflate.mjs';

globalThis.DOMParser = DOMParser;
const packageXml = `<package xmlns="http://www.idpf.org/2007/opf">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>Opowieść o ławce</dc:title><dc:language>pl</dc:language>
  </metadata>
  <manifest>
    <item id="two" href="Narracja/2.xhtml" media-type="application/xhtml+xml"/>
    <item id="one" href="Narracja/Pierwszy%20rozdział.xhtml" media-type="application/xhtml+xml"/>
    <item id="nav" href="toc.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine><itemref idref="one"/><itemref idref="two"/><itemref idref="nav" linear="no"/></spine>
</package>`;
const containerXml = `<container xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles><rootfile full-path="OPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>`;
const xhtml = body => '<html xmlns="http://www.w3.org/1999/xhtml"><head><title>Tytuł</title></head><body>' + body + '</body></html>';

function bookFile(extra = {}) {
  const contents = {
    mimetype: 'application/epub+zip',
    'META-INF/container.xml': containerXml,
    'OPS/content.opf': packageXml,
    'OPS/Narracja/2.xhtml': xhtml('<h1>Jutro</h1><p>Drugi rozdział.</p>'),
    'OPS/Narracja/Pierwszy rozdział.xhtml': xhtml('<h1>Dzisiaj</h1><p>Pierwszy <em>akapit</em>.</p><p>Drugi<br/>wiersz.</p><script>unreadable</script><img src="https://example.invalid/cover.jpg" />'),
    'OPS/toc.xhtml': xhtml('<p>Nie w kolejności czytania.</p>'),
    ...extra,
  };
  const entries = Object.fromEntries(Object.entries(contents).map(([name, value]) => [name, strToU8(value)]));
  entries.mimetype = [entries.mimetype, { level: 0 }];
  return new File([zipSync(entries)], 'lawka.epub', { type: 'application/epub+zip' });
}

test('imports EPUB XML metadata and text in spine order', async () => {
  const book = await importBook(bookFile());
  assert.deepEqual(book, {
    title: 'Opowieść o ławce',
    language: 'pl',
    pages: ['Dzisiaj\n\nPierwszy akapit.\n\nDrugi\nwiersz.', 'Jutro\n\nDrugi rozdział.'],
    chapters: [{ title: 'Dzisiaj', startPage: 0 }, { title: 'Jutro', startPage: 1 }],
  });
});

test('rejects corrupt ZIP files, missing content and external spine resources', async () => {
  const badFormat = { i18n: { key: 'epubFormat', values: [] } };
  await assert.rejects(importBook(new File(['no zip'], 'broken.epub')), badFormat);
  await assert.rejects(importBook(bookFile({ 'OPS/Narracja/2.xhtml': '' })), badFormat);
  const external = packageXml.replace('Narracja/2.xhtml', 'https://example.invalid/2.xhtml');
  await assert.rejects(importBook(bookFile({ 'OPS/content.opf': external })), badFormat);
});

test('still imports plain UTF-8 and reports unsupported file types', async () => {
  const file = new File(['Raz\n\nDwa'], 'Przykład.txt', { type: 'text/plain' });
  assert.deepEqual(await importBook(file), { title: 'Przykład', pages: ['Raz\n\nDwa'] });
  await assert.rejects(importBook(new File(['pdf'], 'test.pdf')), { i18n: { key: 'bookFormats', values: [] } });
});
