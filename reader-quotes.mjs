import { checkResponse, errorText } from './i18n.mjs';

const MAX_QUOTE_LENGTH = 4_000;

export async function mountReaderQuotes({ local, text, jump, translate }) {
  const details = document.querySelector('#quotes');
  const list = document.querySelector('#quote-list');
  const empty = document.querySelector('#quote-empty');
  const actions = document.querySelector('#quote-actions');
  const save = document.querySelector('#save-quote');
  const status = document.querySelector('#quote-status');
  let quotes = (await local.get('quotes')).quotes ?? [];
  let book, bookId, selection, saving, statusTimer;

  function render() {
    empty.hidden = quotes.length > 0;
    const rows = quotes.map(quote => {
      const row = document.createElement('li');
      const excerpt = document.createElement('blockquote');
      const source = document.createElement('p');
      excerpt.textContent = quote.text;
      source.textContent = quote.title;
      row.append(excerpt, source);
      if (quote.bookId === bookId) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = translate('goToQuote');
        button.addEventListener('click', () => {
          details.open = false;
          jump(quote.page, quote.paragraph);
        });
        row.append(button);
      }
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = translate('removeQuote');
      remove.addEventListener('click', async () => {
        try {
          checkResponse(await chrome.runtime.sendMessage({ type: 'remove-quote', id: quote.id }));
        } catch {
          showStatus('quoteError');
        }
      });
      row.append(remove);
      return row;
    });
    list.replaceChildren(...rows);
  }

  function showStatus(key) {
    clearTimeout(statusTimer);
    status.textContent = translate(key);
    actions.hidden = false;
    statusTimer = setTimeout(() => {
      status.textContent = '';
      actions.hidden = !selection;
    }, 3500);
  }

  document.addEventListener('selectionchange', () => {
    if (saving) return;
    const selected = window.getSelection();
    const value = selected?.toString().trim();
    const range = selected?.rangeCount ? selected.getRangeAt(0) : null;
    const startNode = range?.startContainer;
    const startElement = startNode?.nodeType === Node.ELEMENT_NODE ? startNode : startNode?.parentElement;
    const start = startElement?.closest('[data-paragraph]');
    // Keep the snapshot when moving keyboard focus from the selection to the save button.
    if (document.activeElement === save && !value) return;
    selection = book && value && start && text.contains(start) && text.contains(range.endContainer) ? {
      text: value,
      title: book.title,
      bookId,
      page: Number(start.dataset.page),
      paragraph: Number(start.dataset.paragraph),
    } : undefined;
    save.hidden = !selection;
    if (selection) status.textContent = '';
    actions.hidden = !selection && !status.textContent;
  });

  save.addEventListener('pointerdown', event => event.preventDefault());
  save.addEventListener('click', async () => {
    if (!selection || saving) return;
    if (selection.text.length > MAX_QUOTE_LENGTH) {
      showStatus('quoteTooLong');
      return;
    }
    saving = true;
    save.disabled = true;
    try {
      checkResponse(await chrome.runtime.sendMessage({ type: 'save-quote', quote: selection }));
      window.getSelection()?.removeAllRanges();
      selection = undefined;
      save.hidden = true;
      showStatus('quoteSaved');
    } catch (error) {
      console.error(errorText(translate, error));
      showStatus('quoteError');
    } finally {
      saving = false;
      save.disabled = false;
    }
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.quotes) {
      quotes = changes.quotes.newValue ?? [];
      render();
    }
  });

  return {
    setBook(nextBook, nextId) {
      book = nextBook;
      bookId = nextId;
      selection = undefined;
      save.hidden = true;
      actions.hidden = true;
      status.textContent = '';
      render();
    },
    render,
    open(scrollTo) {
      details.open = true;
      scrollTo(details, 'instant');
    },
  };
}
