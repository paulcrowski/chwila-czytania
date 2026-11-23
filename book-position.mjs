export async function bookIdentity(book) {
  const bytes = new TextEncoder().encode(book.pages.join('\n\n'));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

export function pageParagraphs(text) {
  return text.split(/\n\s*\n/).map(part => part.trim()).filter(Boolean);
}
