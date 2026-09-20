# Hustle City — poprawki 15 września 2026

## Wdrożone lokalnie

- Zapasy dilera przeniesione do `world_documents` w SQLite. Stan gracza, magazyn świata i potwierdzenie operacji zapisują się w jednej transakcji. Ponowienie tego samego żądania nie powtarza zakupu/sprzedaży. Dotychczasowy dokument jest importowany przy pierwszym uruchomieniu; wykryte uszkodzenie starej bazy nadal zatrzymuje start.
- Pięć rozdziałów drogi gracza połączonych z istniejącymi misjami i nagrodami. Po samouczku gracz dostaje konkretny cel: inwestycje, dostawy, ekipa, imperium. Przewodnik rozróżnia brak respektu, brak gotówki i środki w banku; nie resetuje wcześniejszych nagród ani nie dodaje drugiej waluty.
- Gotowe misje po zadaniach startowych trafiają na początek tablicy, zamiast pozostawać poza widocznymi slotami.
- Fabryki: tylko Twoje/Kup, bez dużego panelu progów. Katalog pokazuje nieposiadane zakłady z blokadą wymagań. Udany zakup automatycznie przenosi do własnego zakładu. Receptury i ekonomia są w rozwijanych szczegółach; przyciski prowadzą do dostaw i dilera na Rynku.
- Produkcja ma blokadę brakujących składników i powtórnych kliknięć; widać koszt surowców, wartość u dilera i marżę przed opłatami/ryzykiem. Odbierz wszystko pokazuje stan oczekiwania. Zakup nie jest już nazywany stratą.
- Biznesy zachowują Twoje/Kup/Odbiór i ikony, ale bez powtórzonego dużego panelu Zaplecze. Przewodnik nie zajmuje miejsca nad biznesami i fabrykami.
- Test API wykonuje zakup i sprzedaż u dilera, restartuje serwer i porównuje zapasy wspólne, ekwipunek gracza oraz pieniądze. Ostrzeżenie o nieudanym zapisie powoduje błąd testu.
- Mniejszy HUD telefonu: HP i energia obok siebie, mniejszy avatar i medal, więcej miejsca na wartości pieniędzy i XP.
- Wszystkie siedem głównych zakładek mieści się w dwóch rzędach. Dodano role i etykiety dostępności zakładek oraz przycisków napadów i szybkich akcji.
- Zwykłe wyniki są powiadomieniami u dołu ekranu. Nie zasłaniają całej gry i można je zamknąć. Ważne komunikaty rozpoznawane jako areszt, stan krytyczny lub awans oraz wyniki wewnątrz szybkich akcji zachowują modal.
- Czas powiadomienia zależy od długości tekstu (4,5–10 s). Usunięto powtórne podawanie zmiany gotówki, gdy tekst zawiera już kwotę.
- Limit żądań zwraca polski komunikat, czas oczekiwania i nagłówek Retry-After. Ten przypadek ma test regresji.
- Poprawione opisy na ekranie startowym.
- `npm run check` sprawdza składnię wszystkich plików JS/JSX w objętych nim katalogach, zamiast tylko dwóch plików.
- Aktualizacje zależności w dotychczasowych zakresach wersji; Expo pozostaje w linii 54.

## Weryfikacja

- 40 testów reguł, persystencji, transakcji, API i prowadzenia gracza oraz pełny smoke na osobnych bazach. Nowy test wymusza konflikt rewizji świata i sprawdza wycofanie pieniędzy, magazynu i potwierdzenia operacji.
- Eksport web i Android/Hermes; nie jest to instalacyjne APK ani test urządzenia fizycznego.
- Podgląd zbudowanego web: ekran startowy, zakładki, wykonanie napadu, zmiany zasobów i powiadomienie; rozmiary 390 × 844 oraz 320 × 740.
- Dodatkowo sprawdzono rozdział po samouczku, przejście do biznesów, katalog fabryk z blokadą respektu, zakup na koncie testowym, automatyczne przejście do Twoje, wyłączoną produkcję bez składników oraz przejście do Dostaw. Ostatni podgląd 390 × 844 nie zgłaszał błędów konsoli. Testowe fundusze i postęp przygotowano wyłącznie w izolowanej bazie.
- Po aktualizacji npm zgłasza 0 podatności backendu. We frontendzie pozostaje 18 (9 moderate, 9 high), bez critical. Zgłoszenia są powiązane z łańcuchem narzędzi Expo; wymagają dalszej analizy i aktualizacji. Sam eksport nie dowodzi bezpieczeństwa ani pełnej zgodności natywnej.

## Pozostałe prace

Atomowość dilera jest naprawiona. Przed wdrożeniem należy wykonać i sprawdzić kopię całego katalogu danych (w tym SQLite wraz ze stanem WAL albo spójną kopię po zatrzymaniu serwera). Nie należy wracać do starszej wersji backendu z samą starą bazą świata: po migracji aktualny magazyn żyje w SQLite. Wieloinstancyjny backend nadal wymaga osobnego projektu synchronizacji pamięciowego stanu rynku.

Nadal potrzebne są: pomiary balansu pierwszego tygodnia, backup i odtworzenie na hostingu, monitoring, testy obciążenia i APK na telefonach. Projektowe pomysły z audytu (planowane napady, specjalizacje, wydarzenia miasta) pozostają osobnym etapem rozwoju.

Zmiany nie są opublikowane. Zastane zmiany w repo zachowano. Bazy testowe pod `.codex-local` są ignorowane przez Git.
