# Chwila czytania

[English](README.en.md) · **[Pobierz dodatek do Chrome (ZIP)](https://github.com/paulcrowski/chwila-czytania/releases/latest/download/chwila-czytania.zip)**

Otwierasz portal z przyzwyczajenia? Chwila czytania pokazuje książkę na ostatnim fragmencie, do którego dotarłeś. Możesz poczytać od razu albo po chwili wejść na stronę, jeśli ma przydzielony czas.

## Instalacja

1. Pobierz i rozpakuj ZIP w folderze, który chcesz zachować.
2. Otwórz w Chrome `chrome://extensions` i włącz **Tryb dewelopera**.
3. Kliknij **Załaduj rozpakowane** i wskaż folder `chwila-czytania` zawierający plik `manifest.json`.
4. Kliknij ikonę dodatku, wybierz **Ustawienia** i dodawaj domeny pojedynczo albo kilka po przecinku. Ustaw własny limit dla każdej grupy czasowej.
5. Kliknij **Zapisz zmiany** i pozwól Chrome obsługiwać wskazane domeny.

## Jak działa

- **Zawsze blokuj** — po otwarciu domeny lub jej subdomeny zobaczysz książkę.
- **Grupa 1** i **Grupa 2** — każda ma jedną dzienną sesję wspólną dla wszystkich jej stron. Limity możesz zmienić z domyślnych 10 i 15 minut. Zmiana będzie obowiązywać od następnej sesji. Po 30 sekundach w czytniku możesz kliknąć **Otwórz portal**. Minutnik działa także w tle. Po końcu sesji otwarte portale z tej grupy wracają do książki.
- Liczba na ikonie pokazuje pozostałe minuty do końca najbliższej sesji. Kliknij ikonę, żeby zobaczyć dokładny czas dla każdej sesji.
- Możesz zacząć od tekstu demonstracyjnego albo wczytać własny plik TXT w kodowaniu UTF-8. Przycisk **Czytaj dalej** zapisuje miejsce. Przykładowa lektura do samodzielnego przygotowania w formacie TXT to [*The Machine Stops* E. M. Forstera (PDF ze Stanforda)](https://hci.stanford.edu/courses/cs047n/readings/forster.pdf).

Dodatek działa lokalnie. Książka, pozycja, lista domen i czas sesji są zapisywane w profilu Chrome. Kod jest dostępny na [licencji MIT](LICENSE).

Problemy i propozycje można zgłaszać w [Issues](https://github.com/paulcrowski/chwila-czytania/issues).
