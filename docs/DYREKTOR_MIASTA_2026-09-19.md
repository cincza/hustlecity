# HUSTLE CITY — dyrektor miasta

Etap domknięto 19 września 2026. Zakres wykorzystuje istniejące dzielnice, kontakty, klasy, gangi, rynek, dilera, kluby, produkcję i operacje. Nie powstała równoległa wersja żadnego z tych systemów.

## 1. Jak działa system

Serwer wyznacza jedno wspólne wydarzenie na deterministyczne, 12-godzinne okno. Klucz zawiera numer okna, archetyp i wariant towaru. Każdy gracz widzi ten sam klucz oraz te same czasy rozpoczęcia i zakończenia. Stan dyrektora jest również zapisywany w `world_documents` jako `city-director-state`, wraz z krótką historią przejść.

Wygaśnięcie nie wymaga joba ani ręcznego resetu. Pierwsze żądanie po granicy okna atomowo przełącza dokument świata. Bazowe ceny i konfiguracje pozostają nietknięte, więc po końcu wydarzenia automatycznie wracają normalne reguły.

## 2. Dodane wydarzenia

- **Neon nie śpi — Neon Strip:** duża nocna impreza zwiększa ruch klubów i popyt, ale zostawia więcej śladu.
- **Port stoi — Harbor Line:** blokada dostaw podnosi koszty i wartość własnej produkcji, lecz zwiększa ryzyko transportu i operacji.
- **Obława na fronty — Old Town:** kontrole lokali osłabiają głośny biznes, zwiększają znaczenie cichych kontaktów i tworzą ryzykowne okno dla operacji.

Każdy archetyp rotuje konkretnym produktem rynku oraz towarem dilera. Symulacja 90 okien, czyli 45 dni, wykazała równy rozkład 30/30/30 i 12 różnych kombinacji wariantów.

## 3. Wpływ na istniejące systemy

- **Rynek:** czasowa cena zakupu i skupu jednego produktu, egzekwowana na backendzie i pokazana w UI.
- **Diler:** czasowa cena kupna i skupu wybranego towaru, z tym samym obliczeniem po obu stronach.
- **Kluby:** ruch, wypłata i przyrost presji zależą od wydarzenia w dzielnicy lokalu.
- **Kontakty:** zmieniają się wypłata, Heat i prawdopodobieństwo pilnego zlecenia w aktywnej dzielnicy.
- **Produkcja:** wydarzenie może zwiększyć partię i ryzyko nalotu w dzielnicy fabryki.
- **Operacje:** zmieniają się koszt przygotowania, szansa, nagroda i Heat finału.
- **Gangi:** pojawia się wspólny cel reakcji w dzielnicy fokusu.

## 4. Rola dzielnic

Efekty lokalne działają tylko tam, gdzie wydarzenie zachodzi. Blokada portu nie poprawia produkcji w Neon Strip, a obława Old Town nie zmienia klubu w innej dzielnicy. Rynek i wskazany towar dilera są efektami globalnymi, ponieważ ich stan już jest wspólny dla serwera.

## 5. Klasy i reakcje

Każdy gracz ma bezpieczną reakcję `Zmień trasę`, kosztującą energię. Aktualna klasa dodaje jedną alternatywę opartą na jej stylu:

- Biznesmen stawia legalną osłonę za gotówkę.
- Diler wypuszcza zapas bocznym kanałem.
- Hustler rozlicza pośredników barterem.
- Król nocy przenosi ruch na zamkniętą listę.
- Egzekutor zabezpiecza teren energią i zdrowiem.

Wypracowana specjalizacja obniża koszt charakterystycznego podejścia. Premium nie odblokowuje decyzji i nie wpływa na wynik. Klasy wpływają też jakościowo na wybrane ryzyka: przykładowo Diler lepiej maskuje produkcję podczas blokady, a Biznesmen skraca przygotowanie cichej operacji podczas obławy.

## 6. Gang

Gracz solo otrzymuje pełną reakcję i wszystkie efekty świata. Jeżeli gang ustawił fokus na dzielnicę wydarzenia, reakcje trzech różnych członków domykają wspólny cel. Nagroda to 3000 do skarbca, 4 influence w aktywnej dzielnicy i 4 punkty redukcji presji. Ten sam członek nie nabija celu drugi raz, a następne wydarzenie tworzy nowy licznik.

## 7. Ekonomia i persystencja

Rynek nadal używa istniejącego dokumentu świata, blokady mutacji, rewizji i transakcji. Mnożnik wydarzenia jest nakładany na autorytatywną ofertę po zmianie podaży. Diler zachowuje transakcyjne zapisanie salda gracza i wspólnego stocku. Reakcja gracza jest objęta idempotentnym potwierdzeniem operacji, a claim wydarzenia trafia do profilu.

Nie zapisujemy zmodyfikowanych cen jako nowej bazy. Dzięki temu restart, wygaśnięcie i kolejne okno nie kumulują mnożników. W 45-dniowej symulacji najmniejszy spread kupno–sprzedaż wyniósł 22 na rynku i 25 u dilera przy cenie bazowej 100; nie znaleziono natychmiastowego arbitrażu.

## 8. Prezentacja

Kompaktowy panel `Teraz w mieście` jest widoczny w Dzielnicach i Kontaktach, a wariant skrócony przy rynku i dilerze. Pokazuje nazwę, dzielnicę, pozostały czas, krótki sens wydarzenia, dotknięte systemy, konkretne zmiany cen oraz postęp gangu. Nie używa modala i nie pokazuje czterech niedostępnych opcji innych klas.

## 9. Testy

- `npm run check`: składnia 125 plików JS/JSX, 0 błędów.
- `npm test`: 86/86 testów, w tym 5 nowych testów dyrektora.
- `npm run smoke`: pełny smoke API, reakcja na wydarzenie, restart i persystencja zaliczone.
- `node tools/analyze-city-director.mjs`: 90 okien / 45 dni, rozkład wariantów i kontrola spreadu.
- Kontrola wizualna świeżego buildu web: onboarding, Kontakty i Dzielnice; panel jest czytelny i zgodny z obecnym stylem.

Testy korzystają z osobnych katalogów tymczasowych i osobnych baz SQLite.

## 10. Próby exploitów

Sprawdzono powtórzenie reakcji z tym samym kluczem operacji, drugi claim z nowym kluczem, restart przed odczytem profilu, dwóch graczy odczytujących wspólne wydarzenie, przejście dokładnie na granicy czasu, kumulowanie mnożników po restarcie, kupno i natychmiastową sprzedaż na rynku i u dilera, wielokrotną reakcję tego samego członka gangu oraz przeniesienie licznika na następne wydarzenie.

## 11. Świadomie poza zakresem

Nie dodano nowej waluty, płatnej przewagi, mapy, wielkiej kampanii, hostingu, deploymentu, APK ani wieloinstancyjnej synchronizacji. Nie przebudowano gangów i nie wykonano wielogodzinnego playthrough. Trzy archetypy mają dać zamknięty, testowalny system zamiast niedokończonego generatora setek popupów.

## 12. Następny etap poprawiający grywalność

Największy zwrot da **miejska tablica planów**: trzy krótkie, czytelne cele na sesję, generowane z bieżącego wydarzenia, stanu dzielnic i realnego zaplecza gracza. Każdy plan powinien prowadzić przez istniejące akcje do konkretnego finału, pokazywać koszt i ryzyko przed startem oraz dawać różne drogi klasie, solo i gangowi. To nada grze rytm „zobacz sytuację → wybierz plan → przygotuj zaplecze → rozegraj finał” bez dokładania kolejnych odseparowanych systemów.
