# Chwila czytania

**[Pobierz dodatek do Chrome (ZIP)](https://github.com/paulcrowski/chwila-czytania/releases/latest/download/chwila-czytania.zip)** · [English](README.en.md)

Chwila czytania otwiera książkę, gdy wchodzisz na stronę, którą chcesz odwiedzać rzadziej. Czytnik wraca do ostatniego fragmentu. Możesz zablokować stronę całkowicie albo dać sobie kilka minut dziennie.

## Jak to działa

Dodaj Interię do stałej blokady, a Onet i Pudelka do grupy z limitem **5 minut**.

| Reguła | Co zobaczysz przy pierwszym wejściu |
| --- | --- |
| **Zawsze blokuj** | Wejście na Interię od razu otworzy czytnik. |
| **Limit dzienny** | Onet otworzy czytnik. Po wybranym czasie oczekiwania możesz kliknąć **Otwórz portal** i uruchomić wspólny minutnik dla Onetu i Pudelka. |

Jeśli dwie strony są w tej samej grupie, dzielą jedną sesję dziennie. Czas biegnie również w tle. Minuty pozostałe do końca najbliższej sesji widać na ikonie dodatku. Kliknij ikonę, żeby zobaczyć dokładny czas każdej aktywnej sesji. Po wyczerpaniu limitu otwarte strony z tej grupy wracają do czytnika.

## Instalacja i ustawienia

1. Pobierz i rozpakuj ZIP w folderze, który chcesz zachować.
2. Otwórz `chrome://extensions`, włącz **Tryb dewelopera** i kliknij **Załaduj rozpakowane**. Wskaż folder `chwila-czytania` z plikiem `manifest.json`.
3. Otwórz **Ustawienia** z menu dodatku. Dodaj domeny pojedynczo albo po przecinku. Każda reguła obejmuje również subdomeny.
4. Wybierz stałą blokadę albo jedną z dwóch grup czasowych. Domyślne limity to 10 i 15 minut. Możesz je zmienić, a nowy limit zacznie obowiązywać od następnej sesji.
5. Ustaw **Czas przed wejściem na portal**. Domyślnie to 30 sekund. Wpisz np. 60, 120 lub 0, jeśli przycisk **Otwórz portal** ma pojawiać się od razu.
6. Kliknij **Zapisz zmiany** i przyznaj dodatkowi dostęp do podanych domen.

Otwartą stronę możesz też dodać z ikony dodatku. W sekcji **Dodaj tę stronę** wybierz regułę, zapisz ją i potwierdź dostęp do domeny, jeśli Chrome o to poprosi.

Aby zmienić język menu, ustawień i czytnika, kliknij **PL** albo **ENG** u góry ustawień.

## Własna książka

Możesz zacząć od tekstu demonstracyjnego po polsku lub angielsku albo wczytać **książkę EPUB bez DRM albo dowolny tekst jako plik TXT w UTF-8**. Przycisk **Czytaj dalej** zapisuje miejsce. Przy książce EPUB lista nad tekstem pozwala przejść do rozdziału. Pod przyciskiem **Wygląd czytania** znajdziesz tło **Papier**, **Noc** lub **System** oraz regulację wielkości tekstu. Jeśli szukasz przykładowej lektury, możesz przygotować plik TXT z [*The Machine Stops* E. M. Forstera (PDF ze Stanforda)](https://hci.stanford.edu/courses/cs047n/readings/forster.pdf).

## Aktualizacja

Rozpakuj nowy ZIP, zastąp pliki w folderze już wskazanym w Chrome i kliknij **Załaduj ponownie** przy dodatku na stronie `chrome://extensions`.

Książka, miejsce czytania, reguły i sesje są przechowywane lokalnie w profilu Chrome.

## Testy

Uruchom `npm ci`, a potem `npm test`. Testy obejmują blokadę, minutnik, zapis pozycji i import EPUB. Dodatek działa bez instalowania zależności. Rozpakowanie EPUB korzysta z dołączonego fflate 0.8.3 ([licencja](vendor/fflate.LICENSE)).

[Licencja MIT](LICENSE) · [Zgłoś problem lub pomysł](https://github.com/paulcrowski/chwila-czytania/issues)
