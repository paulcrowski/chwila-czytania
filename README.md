# Chwila czytania

**[Pobierz dodatek do Chrome (ZIP)](https://github.com/paulcrowski/chwila-czytania/releases/latest/download/chwila-czytania.zip)** · [English](README.en.md)

Chwila czytania otwiera książkę, gdy wchodzisz na stronę, którą chcesz odwiedzać rzadziej. Czytnik wraca do ostatniego fragmentu. Możesz zablokować stronę całkowicie albo dać sobie kilka minut dziennie.

## Jak to działa

Dodaj Interię do stałej blokady, a Onet i Pudelka do grupy z limitem **5 minut**.

| Reguła | Co zobaczysz przy pierwszym wejściu |
| --- | --- |
| **Zawsze blokuj** | Wejście na Interię od razu otworzy czytnik. |
| **Limit dzienny** | Onet otworzy czytnik. Po 30 sekundach możesz kliknąć **Otwórz portal** i uruchomić wspólny minutnik dla Onetu i Pudelka. |

Jeśli dwie strony są w tej samej grupie, dzielą jedną sesję dziennie. Czas biegnie również w tle. Minuty pozostałe do końca najbliższej sesji widać na ikonie dodatku. Kliknij ikonę, żeby zobaczyć dokładny czas każdej aktywnej sesji. Po wyczerpaniu limitu otwarte strony z tej grupy wracają do czytnika.

## Instalacja i ustawienia

1. Pobierz i rozpakuj ZIP w folderze, który chcesz zachować.
2. Otwórz `chrome://extensions`, włącz **Tryb dewelopera** i kliknij **Załaduj rozpakowane**. Wskaż folder `chwila-czytania` z plikiem `manifest.json`.
3. Otwórz **Ustawienia** z menu dodatku. Dodaj domeny pojedynczo albo po przecinku. Każda reguła obejmuje również subdomeny.
4. Wybierz stałą blokadę albo jedną z dwóch grup czasowych. Domyślne limity to 10 i 15 minut. Możesz je zmienić, a nowy limit zacznie obowiązywać od następnej sesji.
5. Kliknij **Zapisz zmiany** i przyznaj dodatkowi dostęp do podanych domen.

## Własna książka

Możesz zacząć od tekstu demonstracyjnego albo wczytać **dowolną książkę lub własny tekst jako plik TXT w UTF-8**. Przycisk **Czytaj dalej** zapisuje miejsce. Jeśli szukasz przykładowej lektury, możesz przygotować plik TXT z [*The Machine Stops* E. M. Forstera (PDF ze Stanforda)](https://hci.stanford.edu/courses/cs047n/readings/forster.pdf).

## Aktualizacja

Rozpakuj nowy ZIP, zastąp pliki w folderze już wskazanym w Chrome i kliknij **Załaduj ponownie** przy dodatku na stronie `chrome://extensions`.

Książka, miejsce czytania, reguły i sesje są przechowywane lokalnie w profilu Chrome.

[Licencja MIT](LICENSE) · [Zgłoś problem lub pomysł](https://github.com/paulcrowski/chwila-czytania/issues)
