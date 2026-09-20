# Druga partia napraw: trwałe rozliczenia

Zmiany przygotowano lokalnie. Nie uruchamiano migracji głównej bazy graczy i nie publikowano backendu.

## Zachowanie gry

- Chronione operacje banku, gangu i klubów zapisują wszystkich uczestników w jednej transakcji. Błąd zapisu dowolnego uczestnika wycofuje całość.
- Ten sam mechanizm obejmuje ataki między graczami, nagrody za głowę, relacje znajomych, prywatne wiadomości i administracyjne przyznanie gotówki/respektu.
- Klient zapisuje identyfikator operacji na urządzeniu przed wysłaniem żądania. Dwa szybkie kliknięcia tej samej akcji współdzielą żądanie. Niepewna odpowiedź powoduje jedno ponowienie z tym samym identyfikatorem; identyfikator pozostaje także po ponownym uruchomieniu aplikacji.
- Serwer zapisuje wynik wraz ze zmianami kont. Ponowienie po utracie odpowiedzi lub restarcie serwera odczytuje wynik, bez ponownego wykonania akcji. Zmieniona treść pod tym samym identyfikatorem daje konflikt.
- Powiadomienia o zmianach i potwierdzenie HTTP wychodzą dopiero po udanym zapisie. Rewizje nadal chronią przed zastąpieniem nowszego profilu starszą odpowiedzią.
- Równoczesna próba kupienia tego samego lokalu przez dwóch graczy ma jednego zwycięzcę. Drugi zachowuje pieniądze.

## Zapis i migracja

Backend wymaga **Node.js 24.15.0 lub nowszego wydania 24.x**. Korzysta z wbudowanego `node:sqlite`, bez dodatkowego serwera bazy. Wymaganie zapisano w obu pakietach; konfiguracja Render wybiera linię 24.

Konta i profile zapisują się teraz w `DATA_DIR/game.sqlite`. SQLite pracuje z WAL i `synchronous=FULL`. Obliczenia asynchroniczne zbierają zmiany w pamięci; krótka transakcja sprawdza rewizje, zapisuje wszystkie profile i skompresowany wynik operacji, następnie zatwierdza całość. Nie utrzymujemy transakcji SQL podczas oczekiwania na kod asynchroniczny.

Przy pierwszym uruchomieniu nowego backendu import jest automatyczny: odczytuje `users.db`, uwzględnia aktualizacje i usunięcia NeDB, zachowuje hashe haseł oraz postęp. Nie zmienia oryginalnego pliku. Znacznik migracji i wszystkie konta zapisują się razem; błąd danych lub konflikt unikalności przerywa import. Kolejny start nie importuje kont ponownie. Uszkodzona istniejąca baza SQLite zatrzymuje start zamiast odtwarzać nieaktualne konta z NeDB.

Przed przejściem rzeczywistego środowiska należy zatrzymać backend i zrobić kopię całego `DATA_DIR`. Po uruchomieniu sprawdzić logowanie istniejącego konta, saldo i postęp. Kopie po migracji muszą obejmować cały katalog, w tym obecne pliki `game.sqlite-wal` i `game.sqlite-shm`; nie kopiować samego pliku SQLite podczas pracy procesu. Najprostsza kopia spójna: po zatrzymaniu wszystkich procesów używających bazy. Odtwarzanie również przy zatrzymanym backendzie, z pełnej kopii. Powrót do starego kodu wymaga kopii sprzed migracji — stary `users.db` nie zawiera późniejszego postępu.

Wyniki operacji są ważne przez 7 dni. Starszy identyfikator jest odrzucany (HTTP 410), aby nie rozliczać ponownie niepewnej dawnej akcji. Czyszczenie starych wyników odbywa się przy starcie i podczas zapisów najwyżej raz na godzinę. Zegar urządzenia może wyprzedzać serwer najwyżej o 5 minut. Brak możliwości zapisania identyfikatora na urządzeniu zatrzymuje wysłanie akcji.

## Weryfikacja

- `npm test`: 32 testy, w tym migracja, zachowanie oryginalnych danych, konflikt rewizji, awaria po pierwszym zapisie, przerwanie procesu, utrata odpowiedzi, ponowienie po restarcie oraz jednoczesny zakup lokalu.
- `npm run smoke`: scenariusz HTTP obejmujący systemy gry; każde udane chronione żądanie jest ponawiane z tym samym kluczem, z kontrolą nagłówka i identycznego wyniku. Dodatkowo kontroluje wspólny skarbiec trzech członków i zgodność opłaty gościa z przychodem właściciela klubu.
- `npm run check`: kontrola składni.
- Eksport Expo web i Android. Eksport pakietu Android nie zastępuje testu APK na fizycznym telefonie.
- Wszystkie testy używają oddzielnych, tymczasowych danych.

## Granice tej partii

Rynek i diler nadal przechowują wspólny stan świata poza bazą kont. Nie są objęte wspólną transakcją konta i magazynu ani automatycznym ponawianiem płatności. Pozostałe akcje, np. kasyno, także nie otrzymały jeszcze trwałych identyfikatorów. Starszy klient bez nagłówka korzysta z atomowego zapisu chronionych ścieżek, ale nie z ochrony przed ponownym wysłaniem tej samej akcji.

To rozwiązanie dla obecnego backendu z lokalnym trwałym dyskiem. Nie zweryfikowano pracy na wielu hostach, wydajności pod dużym obciążeniem ani istniejących danych pod kątem wcześniej powstałych duplikatów właścicieli klubów. Przed wydaniem potrzebne są próba odtworzenia kopii rzeczywistych danych i testy urządzeń.

Następny etap produktu: pierwsze 15 minut gry — przejście z zadania do właściwej akcji, czytelny postęp, odblokowania i pierwsza znacząca nagroda. Kolejny etap techniczny: wspólny zapis magazynu świata i konta.
