# Chwila czytania

**[Pobierz dodatek do Chrome (ZIP)](https://github.com/paulcrowski/chwila-czytania/releases/latest/download/chwila-czytania.zip)** · [English](README.en.md) · [Historia wydań](https://github.com/paulcrowski/chwila-czytania/releases)

Gdy odruchowo otwierasz portal, Chwila czytania otwiera Twoją książkę na ostatnim zapisanym akapicie. Sam wybierasz, które strony blokować i którym dać kilka minut dziennie.

## Instalacja

1. Pobierz i rozpakuj ZIP. Zachowaj rozpakowany folder `chwila-czytania`.
2. W Chrome otwórz `chrome://extensions` i włącz **Tryb dewelopera**.
3. Kliknij **Załaduj rozpakowane** i wybierz folder zawierający `manifest.json`.
4. Otwórz **Ustawienia** z menu dodatku. Dodaj domeny, wybierz reguły i kliknij **Zapisz zmiany**. Chrome poprosi o dostęp do wskazanych domen.

Reguły obejmują także subdomeny. Możesz dodać kilka domen po przecinku lub zapisać regułę dla bieżącej strony przez **Dodaj tę stronę** pod ikoną dodatku. Przyciskami **PL** i **ENG** w ustawieniach zmienisz język.

## Zasady blokowania

| Reguła | Co się dzieje po otwarciu strony |
| --- | --- |
| **Zawsze blokuj** | Czytnik otwiera się od razu. |
| **Limit dzienny** | Najpierw otwiera się czytnik. Po ustawionym czasie możesz kliknąć **Otwórz portal**, żeby uruchomić minutnik. |

Możesz ustawić dwie grupy z własnymi limitami. Domeny w jednej grupie dzielą jedną sesję dziennie. Domyślne limity to 10 i 15 minut, a domyślny czas oczekiwania to 30 sekund. Przy 0 sekundach przycisk **Otwórz portal** jest dostępny od razu.

Czas sesji na portalu biegnie także w tle. Pod ikoną dodatku widać pozostały czas, a po upływie limitu otwarte strony z tej grupy wracają do czytnika.

## Własna książka i cytaty

Wczytaj **EPUB bez DRM** lub **TXT w UTF-8** albo zacznij od przykładowego tekstu. Kolejne fragmenty doczytują się przy przewijaniu. Czytnik zapamiętuje ostatni akapit osobno dla każdej książki. W EPUB możesz przejść do rozdziału z listy. W menu **Wygląd czytania** ustawisz rozmiar tekstu i wybierzesz tło Papier, Noc lub System.

Zaznacz fragment i kliknij **Zapisz cytat**. Cytaty z tytułami książek znajdziesz pod **Zapisane cytaty** w czytniku i menu dodatku. Zostają po zmianie książki. Po ponownym wczytaniu tego samego pliku przy cytacie zobaczysz **Przejdź do fragmentu**.

Jeśli szukasz przykładowej lektury, możesz przygotować TXT z [*The Machine Stops* E.M. Forstera (PDF ze Stanforda)](https://hci.stanford.edu/courses/cs047n/readings/forster.pdf).

## Statystyki po blokadzie

Kliknij ikonę dodatku, żeby zobaczyć wyniki **Dziś**, **7 dni** i **Łącznie**.

- **Otwarcia blokady** liczą przekierowania do czytnika. Odświeżenie czytnika nie zwiększa licznika.
- **Czas w czytniku** obejmuje czas po przekierowaniu, gdy karta czytnika jest widoczna i aktywna.
- **Wejścia na portal** liczą przejścia z czytnika po użyciu przycisku **Otwórz portal**.

Książka, pozycje, cytaty, reguły i statystyki są przechowywane lokalnie w profilu Chrome.

## Aktualizacja

Rozpakuj nowy ZIP i zastąp pliki w folderze używanym przez Chrome. Potem kliknij **Załaduj ponownie** przy dodatku na `chrome://extensions`.

## Testy i licencja

Uruchom `npm ci` i `npm test`. Testy obejmują blokowanie, minutnik, import EPUB, zapamiętywanie pozycji, zapis cytatów i liczenie statystyk. Dodatek zawiera bibliotekę fflate do odczytu EPUB. [Licencja MIT](LICENSE) · [Licencja fflate](vendor/fflate.LICENSE)
