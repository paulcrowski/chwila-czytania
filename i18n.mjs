const messages = {
  settings: ['Ustawienia', 'Settings'],
  settingsTitle: ['Ustawienia · Chwila czytania', 'Settings · Chwila czytania'],
  language: ['Język dodatku', 'Extension language'],
  languageError: ['Nie udało się zapisać języka.', 'Could not save the language.'],
  openBook: ['Otwórz książkę', 'Open book'],
  siteRules: ['Reguły stron', 'Site rules'],
  saveChanges: ['Zapisz zmiany', 'Save changes'],
  domainHelp: ['Wpisz domenę albo kilka po przecinku. Reguły obejmują też subdomeny.', 'Enter one domain or a comma-separated list. Rules also cover subdomains.'],
  block: ['Zawsze blokuj', 'Always block'],
  blockHelp: ['Po otwarciu każdej z tych stron od razu zobaczysz książkę.', 'Each of these sites opens the reader immediately.'],
  blockedDomains: ['Domeny ze stałą blokadą', 'Always-blocked domains'],
  domainForBlock: ['Domeny do stałej blokady', 'Domains to always block'],
  exampleBlock: ['np. interia.pl', 'e.g. interia.pl'],
  addToBlock: ['Dodaj domeny do stałej blokady', 'Add domains to the always-block list'],
  add: ['Dodaj', 'Add'],
  group1: ['Grupa 1', 'Group 1'],
  group2: ['Grupa 2', 'Group 2'],
  dailyLimit: ['Limit dzienny', 'Daily limit'],
  group1Domains: ['Domeny w grupie 1', 'Domains in group 1'],
  group2Domains: ['Domeny w grupie 2', 'Domains in group 2'],
  domainForGroup1: ['Domeny do grupy 1', 'Domains to add to group 1'],
  domainForGroup2: ['Domeny do grupy 2', 'Domains to add to group 2'],
  exampleGroup1: ['np. onet.pl', 'e.g. onet.pl'],
  exampleGroup2: ['np. gazeta.pl', 'e.g. gazeta.pl'],
  addToGroup1: ['Dodaj domeny do grupy 1', 'Add domains to group 1'],
  addToGroup2: ['Dodaj domeny do grupy 2', 'Add domains to group 2'],
  limitsNote: ['Każda grupa ma jedną wspólną sesję dziennie. Minutnik działa też w tle. Zmiana limitu obowiązuje od następnej sesji.', 'Each group shares one session per day. The timer keeps running in the background. Changes apply to the next session.'],
  waitTitle: ['Czas przed wejściem na portal', 'Wait before opening a site'],
  showAfter: ['Pokaż przycisk po', 'Show button after'],
  waitNote: ['Dotyczy obu grup czasowych. Przy 0 przycisk jest dostępny od razu. Kliknięcie uruchamia minutnik.', 'Applies to both timed groups. Set 0 to show the button immediately. Clicking it starts the timer.'],
  book: ['Książka', 'Book'],
  importBook: ['Wczytaj książkę lub fragment z pliku TXT (UTF-8).', 'Import a book or an excerpt from a UTF-8 TXT file.'],
  saving: ['Zapisywanie…', 'Saving…'],
  unsaved: ['Niezapisane zmiany', 'Unsaved changes'],
  saved: ['Zapisano ustawienia', 'Settings saved'],
  removeDomain: ['Usuń {0}', 'Remove {0}'],
  permanentBlock: ['stała blokada', 'always blocked'],
  minutesPerDay: ['{0} min dziennie', '{0} min per day'],
  domainRemoved: ['{0} · usunięto z reguł', '{0} · removed from site rules'],
  newLimit: ['{0} · nowy limit {1} min', '{0} · new limit: {1} min'],
  noWait: ['Przycisk do portalu dostępny od razu', 'The site button is available immediately'],
  newWait: ['Przycisk do portalu po {0} s', 'The site button appears after {0} s'],
  currentBook: ['W czytniku: {0}', 'In the reader: {0}'],
  savePermission: ['Zezwól Chrome na obsługę wpisanych domen, aby zapisać reguły.', 'Grant access to the domains you entered to save the rules.'],
  saveError: ['Zapis nie powiódł się. {0}', 'Could not save your changes. {0}'],
  txtOnly: ['Wybierz plik z rozszerzeniem .txt.', 'Choose a file with the .txt extension.'],
  bookReady: ['Książka jest gotowa do czytania.', 'Your book is ready to read.'],
  addCurrent: ['Dodaj tę stronę', 'Add this site'],
  rule: ['Reguła', 'Rule'],
  saveRule: ['Zapisz regułę', 'Save rule'],
  timerIdle: ['Minutnik jest wyłączony.', 'No active timer.'],
  grantAccess: ['Przyznaj dostęp', 'Grant access'],
  accessNeeded: ['Chrome potrzebuje dostępu do tej domeny.', 'Chrome needs permission to access this domain.'],
  accessDenied: ['Chrome potrzebuje dostępu do tej domeny. Reguła nie została zapisana.', 'Chrome needs permission to access this domain. The rule was not saved.'],
  ruleSavedActive: ['Reguła zapisana. Możesz korzystać ze strony do końca trwającej sesji.', 'Rule saved. You can use this site until the current session ends.'],
  ruleSavedReader: ['Reguła zapisana. Kolejne wejście otworzy czytnik.', 'Rule saved. The reader will open the next time you visit.'],
  sessionTitle: ['{0} · grupa {1} min', '{0} · {1}-minute group'],
  timerDetails: ['Zostało {0} · minęło {1}', '{0} left · {1} elapsed'],
  accessCheckFailed: ['Nie udało się sprawdzić dostępu do tej strony.', 'Could not check access to this site.'],
  siteAccess: ['Dostęp do strony', 'Site access'],
  openSite: ['Otwórz portal', 'Open site'],
  bookNav: ['Nawigacja książki', 'Book navigation'],
  previousPage: ['Wstecz', 'Previous'],
  nextPage: ['Czytaj dalej', 'Read on'],
  dailyUsed: ['{0} · dzisiejsze {1} min już minęło.', '{0} · today’s {1}-minute limit has ended.'],
  openAfter: ['Otwórz za {0} s', 'Open in {0} s'],
  alreadyActive: ['{0} · sesja już trwa.', '{0} · your session is already running.'],
  timeOnClick: ['{0} · po kliknięciu masz {1} min.', '{0} · open the site to start your {1}-minute session.'],
  readFirst: ['{0} · chwila na czytanie przed wejściem', '{0} · a moment to read before you open the site'],
  checkingAccess: ['Sprawdzanie dostępu…', 'Checking site access…'],
  refreshReader: ['Nie udało się sprawdzić dostępu. Odśwież kartę.', 'Could not check site access. Reload the tab.'],
  tryOpenAgain: ['Nie udało się otworzyć strony. Spróbuj ponownie.', 'Could not open the site. Try again.'],
  domainInvalid: ['Wpisz nazwę domeny, np. onet.pl.', 'Enter a domain name, such as onet.pl.'],
  domainOverlap: ['Domena występuje już na liście: {0}', 'This domain overlaps with an existing rule: {0}'],
  domainCount: ['Prototyp obsługuje do 100 domen.', 'You can save up to 100 domains.'],
  limitsInvalid: ['Podaj pełną liczbę minut od 1 do {0}.', 'Enter a whole number of minutes from 1 to {0}.'],
  waitInvalid: ['Wpisz pełną liczbę sekund, np. 0, 60 albo 120.', 'Enter a whole number of seconds, such as 0, 60, or 120.'],
  emptyBook: ['Plik jest pusty.', 'This file is empty.'],
  settingsConflict: ['Ustawienia zmieniły się w innym oknie. Odśwież kartę przed zapisem.', 'Settings changed in another window. Reload this tab before saving.'],
  ruleInvalid: ['Wybierz poprawną domenę i regułę.', 'Choose a valid domain and rule.'],
  permissionMissing: ['Chrome nie przyznał dostępu do tej domeny.', 'Chrome did not grant access to this domain.'],
  readerTab: ['Otwórz czytnik w karcie Chrome.', 'Open the reader in a Chrome tab.'],
  gateNotReady: ['Odczekaj chwilę na czytanie i spróbuj ponownie.', 'Wait for the reading timer and try again.'],
  badgeTime: ['Chwila czytania · pozostało ok. {0} min', 'Chwila czytania · about {0} min left'],
};

export function translator(language) {
  const index = language === 'en' ? 1 : 0;
  return (key, ...values) => messages[key][index].replace(/\{(\d+)\}/g, (_, position) => values[position] ?? '');
}

export function localizeDocument(language, t) {
  document.documentElement.lang = language === 'en' ? 'en' : 'pl';
  for (const element of document.querySelectorAll('[data-i18n]')) {
    element.textContent = t(element.getAttribute('data-i18n'));
  }
  for (const attribute of ['aria-label', 'placeholder']) {
    const key = 'data-i18n-' + attribute;
    for (const element of document.querySelectorAll('[' + key + ']')) {
      element.setAttribute(attribute, t(element.getAttribute(key)));
    }
  }
}

export function appError(key, ...values) {
  const error = new Error(translator()(key, ...values));
  error.i18n = { key, values };
  return error;
}

export function errorText(t, error) {
  const details = error.i18n ?? error.errorInfo;
  return details ? t(details.key, ...details.values) : (error.message ?? error.error);
}

export function checkResponse(response) {
  if (response.error) {
    throw Object.assign(new Error(response.error), { i18n: response.errorInfo });
  }
  return response;
}
